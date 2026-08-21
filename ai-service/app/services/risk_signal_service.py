"""Multi-signal template matching, provider context, and risk/suspicion signal evaluation service."""

from typing import Any, Dict, List, Optional, Tuple
from app.core.config import settings
from app.core.logging import logger
from app.schemas.document_understanding import DocumentClassification, DocumentType, ProviderInfo, RelevanceStatus
from app.schemas.report import AnalysisReport, MatchedCandidateDetail
from app.schemas.similarity import PageSimilarityMatch
from app.schemas.structural import NormalizedPageTemplate


class RiskSignalService:
    """Evaluates multi-signal similarity evidence, provider context, legitimate reuse, and risk scores."""

    def __init__(
        self,
        amber_threshold: Optional[float] = None,
        red_threshold: Optional[float] = None,
        family_threshold: Optional[float] = None,
        structural_threshold: Optional[float] = None,
    ):
        self.amber_threshold = amber_threshold if amber_threshold is not None else settings.RISK_AMBER_THRESHOLD
        self.red_threshold = red_threshold if red_threshold is not None else settings.RISK_RED_THRESHOLD
        self.family_threshold = family_threshold if family_threshold is not None else settings.TEMPLATE_FAMILY_THRESHOLD
        self.structural_threshold = structural_threshold if structural_threshold is not None else settings.STRUCTURAL_SIMILARITY_THRESHOLD

    def is_same_provider(self, prov_a: Optional[ProviderInfo], prov_b_name: Optional[str]) -> Tuple[bool, Optional[str]]:
        """Determine if two provider contexts represent the same healthcare institution."""
        if not prov_a or not prov_a.normalized_name or not prov_b_name:
            return False, None

        norm_a = prov_a.normalized_name.strip()
        norm_b = prov_b_name.strip().upper()

        if not norm_a or not norm_b:
            return False, None

        # Exact normalized match
        if norm_a == norm_b:
            return True, norm_b

        # Substring containment for institution names
        if len(norm_a) > 5 and len(norm_b) > 5:
            if norm_a in norm_b or norm_b in norm_a:
                return True, norm_b

        return False, norm_b

    def combine_matches(
        self,
        visual_matches: List[PageSimilarityMatch],
        structural_matches: List[PageSimilarityMatch],
        query_doc_id: str,
        query_provider: Optional[ProviderInfo] = None,
    ) -> List[MatchedCandidateDetail]:
        """Aggregate visual and structural matches per historical candidate document."""
        candidate_map: Dict[str, Dict[str, Any]] = {}

        # 1. Process visual matches
        for vm in visual_matches:
            doc_id = vm.document_id
            if doc_id == query_doc_id:
                continue
            if doc_id not in candidate_map:
                candidate_map[doc_id] = {
                    "visual_sim": vm.similarity_score,
                    "structural_sim": 0.0,
                    "metadata": vm.metadata,
                }
            else:
                candidate_map[doc_id]["visual_sim"] = max(
                    candidate_map[doc_id]["visual_sim"], vm.similarity_score
                )

        # 2. Process structural matches
        for sm in structural_matches:
            doc_id = sm.document_id
            if doc_id == query_doc_id:
                continue
            if doc_id not in candidate_map:
                candidate_map[doc_id] = {
                    "visual_sim": 0.0,
                    "structural_sim": sm.similarity_score,
                    "metadata": sm.metadata,
                }
            else:
                candidate_map[doc_id]["structural_sim"] = max(
                    candidate_map[doc_id]["structural_sim"], sm.similarity_score
                )

        # 3. Compute combined scores and evaluate candidate relationships
        candidate_details: List[MatchedCandidateDetail] = []
        w_v = settings.RISK_WEIGHT_VISUAL
        w_s = settings.RISK_WEIGHT_STRUCTURAL

        for doc_id, data in candidate_map.items():
            v_score = data["visual_sim"]
            s_score = data["structural_sim"]
            meta = data["metadata"] or {}
            cand_prov_name = meta.get("provider_name") or meta.get("provider")

            # Weighted combined similarity
            if v_score > 0 and s_score > 0:
                combined = (w_v * v_score + w_s * s_score) / (w_v + w_s)
            elif v_score > 0:
                combined = v_score * 0.85
            else:
                combined = s_score * 0.70

            same_prov, normalized_cand_prov = self.is_same_provider(query_provider, cand_prov_name)

            signals = []
            if v_score >= settings.SIMILARITY_THRESHOLD:
                signals.append(f"High visual DINOv2 match ({v_score:.4f})")
            if s_score >= self.structural_threshold:
                signals.append(f"High structural layout match ({s_score:.4f})")
            if same_prov:
                signals.append(f"Matching provider institution: '{cand_prov_name}'")
            elif cand_prov_name and query_provider and query_provider.name:
                signals.append(f"Cross-provider disparity: query='{query_provider.name}', candidate='{cand_prov_name}'")

            template_fam = meta.get("template_family_id") or f"TF-{doc_id[:8]}"

            candidate_details.append(
                MatchedCandidateDetail(
                    document_id=doc_id,
                    visual_similarity=round(v_score, 4),
                    structural_similarity=round(s_score, 4),
                    combined_similarity=round(combined, 4),
                    candidate_provider=cand_prov_name,
                    is_same_provider=same_prov,
                    template_family_id=template_fam,
                    signals=signals,
                )
            )

        candidate_details.sort(key=lambda c: c.combined_similarity, reverse=True)
        return candidate_details

    def evaluate_risk(
        self,
        document_id: str,
        classification: DocumentClassification,
        templates: List[NormalizedPageTemplate],
        matched_candidates: List[MatchedCandidateDetail],
        processing_metadata: Dict[str, Any],
    ) -> AnalysisReport:
        """Calculate multi-signal risk score, risk level, explainable reasons, and build AnalysisReport."""
        reasons: List[str] = list(classification.reasons)
        suspicious_signals: List[str] = []

        top_visual = matched_candidates[0].visual_similarity if matched_candidates else 0.0
        top_structural = matched_candidates[0].structural_similarity if matched_candidates else 0.0
        top_combined = matched_candidates[0].combined_similarity if matched_candidates else 0.0

        # Determine template family
        template_family_id: Optional[str] = None
        if matched_candidates and top_visual >= self.family_threshold:
            template_family_id = matched_candidates[0].template_family_id
        else:
            template_family_id = f"TF-{document_id[:8]}"

        # Base case: empty corpus or no matches found
        if not matched_candidates:
            return AnalysisReport(
                document_id=document_id,
                relevance_status=classification.relevance_status,
                document_type=classification.document_type,
                classification_confidence=classification.confidence,
                provider_info=classification.provider_info,
                page_count=len(templates),
                template_family_id=template_family_id,
                top_visual_similarity=0.0,
                top_structural_similarity=0.0,
                top_combined_similarity=0.0,
                matched_candidates=[],
                is_same_provider_reuse=False,
                suspicious_signals=[],
                fraud_score=0.0,
                risk_level="LOW",
                confidence=0.95,
                reasons=["No suspicious template similarity detected against existing document corpus."],
                processing_metadata=processing_metadata,
            )

        # Multi-signal Risk Evaluation Logic
        top_cand = matched_candidates[0]
        is_same_prov = top_cand.is_same_provider
        
        # Check for near-duplicate (exact clone)
        is_near_duplicate = (top_visual >= 0.992 and top_structural >= 0.985)
        
        # Check for cross-provider reuse
        is_cross_provider = (
            top_cand.candidate_provider is not None
            and classification.provider_info is not None
            and classification.provider_info.name is not None
            and not is_same_prov
            and (top_visual >= 0.90 or top_structural >= 0.85)
        )

        fraud_score = 0.0
        risk_level = "LOW"

        if is_near_duplicate:
            # Case: Near-duplicate / Cloned Document
            fraud_score = round(top_combined, 4)
            risk_level = "RED"
            suspicious_signals.append("Near-duplicate visual and structural clone detected against historical claim.")
            reasons.append(
                f"High-priority alert: Document appears near-identical to historical claim '{top_cand.document_id}' (similarity: {top_combined:.4f}). Potential duplicated reimbursement submission."
            )

        elif is_cross_provider:
            # Case: Cross-Provider Template Reuse / Imitation
            # Template matches an invoice from a DIFFERENT hospital/clinic -> Suspicious!
            fraud_score = round(min(0.96, max(self.amber_threshold, top_combined + 0.10)), 4)
            risk_level = "RED" if fraud_score >= self.red_threshold else "AMBER"
            suspicious_signals.append(f"Cross-provider template reuse detected: matches template from '{top_cand.candidate_provider}'.")
            reasons.append(
                f"Cross-provider template similarity detected: Layout closely matches document '{top_cand.document_id}' issued by '{top_cand.candidate_provider}', while current claim is for '{classification.provider_info.name}'."
            )
            reasons.append("Potential template imitation or forged document layout across unrelated healthcare providers.")

        elif is_same_prov:
            # Case: Same-Provider Evaluation (Requires Visual + Structural Verification)
            # Legitimate template reuse requires BOTH visual and structural layout consistency.
            # Provider name alone MUST NOT force LOW if template geometry deviates!
            is_genuine_same_template = (
                top_visual >= settings.SIMILARITY_THRESHOLD
                and top_structural >= self.structural_threshold
            )

            if is_genuine_same_template:
                # Legitimate Same-Provider Template Reuse (standard hospital/clinic workflow)
                fraud_score = round(min(0.35, top_combined * 0.35), 4)
                risk_level = "LOW"
                reasons.append(
                    f"Legitimate template consistency identified: Matches known standard billing template for provider '{classification.provider_info.name}'."
                )
                reasons.append(
                    f"Corpus match with historical document '{top_cand.document_id}' (visual: {top_cand.visual_similarity:.4f}, structural: {top_cand.structural_similarity:.4f}) reflects expected provider template reuse."
                )
                reasons.append("Matching template appears consistent with legitimate provider template reuse.")
            elif top_visual >= 0.85 or top_structural >= 0.80:
                # Suspicious layout or visual deviation despite matching provider name
                fraud_score = round(top_combined, 4)
                risk_level = "RED" if fraud_score >= self.red_threshold else "AMBER"
                suspicious_signals.append(
                    f"Suspicious template layout deviation detected for provider '{classification.provider_info.name}'."
                )
                reasons.append(
                    f"Suspicious template deviation detected: While provider name matches '{classification.provider_info.name}', visual/structural layout exhibits notable deviations from historical provider templates (visual: {top_visual:.4f}, structural: {top_structural:.4f})."
                )
                reasons.append("Investigator review recommended for potential template alteration or irregular billing layout.")
            else:
                fraud_score = round(top_combined * 0.5, 4)
                risk_level = "LOW"
                reasons.append(
                    f"Minor structural layout commonality with historical document '{top_cand.document_id}' for provider '{classification.provider_info.name}'."
                )

        else:
            # Case: General Template Match without verified provider context
            # Base suspicion on combined multi-signal similarity
            if top_combined >= settings.SIMILARITY_THRESHOLD and top_structural >= self.structural_threshold:
                fraud_score = round(top_combined, 4)
                risk_level = "RED" if fraud_score >= self.red_threshold else "AMBER"
                reasons.append(
                    f"Strong visual and structural template similarity detected with document '{top_cand.document_id}' (combined: {top_combined:.4f})."
                )
            elif top_combined >= 0.88 or top_visual >= 0.90:
                fraud_score = round(top_combined, 4)
                risk_level = "AMBER"
                reasons.append(
                    f"Moderate template similarity identified with historical document '{top_cand.document_id}' (similarity: {top_combined:.4f})."
                )
            else:
                fraud_score = round(top_combined * 0.5, 4)
                risk_level = "LOW"
                reasons.append(
                    f"Minor structural layout commonality with historical document '{top_cand.document_id}' (similarity: {top_combined:.4f}). Within acceptable variation."
                )

        confidence = round(min(0.99, max(0.85, max(top_visual, top_structural))), 2)

        return AnalysisReport(
            document_id=document_id,
            relevance_status=classification.relevance_status,
            document_type=classification.document_type,
            classification_confidence=classification.confidence,
            provider_info=classification.provider_info,
            page_count=len(templates),
            template_family_id=template_family_id,
            top_visual_similarity=top_visual,
            top_structural_similarity=top_structural,
            top_combined_similarity=top_combined,
            matched_candidates=matched_candidates[:settings.TOP_K_MATCHES],
            is_same_provider_reuse=is_same_prov,
            suspicious_signals=suspicious_signals,
            fraud_score=fraud_score,
            risk_level=risk_level,
            confidence=confidence,
            reasons=reasons,
            processing_metadata=processing_metadata,
        )
