"""Document Classifier and Relevance Gate evaluating OCR and Layout evidence."""

import re
from typing import Dict, List, Optional, Set, Tuple
from app.core.config import settings
from app.core.logging import logger
from app.schemas.document_understanding import (
    DocumentClassification,
    DocumentType,
    ProviderInfo,
    RelevanceStatus,
)
from app.schemas.processed_document import ProcessedDocument


class DocumentClassifier:
    """Classifies document type and determines relevance gate status based on OCR and layout features."""

    # Medical & Financial Keywords
    INVOICE_KEYWORDS: Set[str] = {
        "invoice", "bill", "tax invoice", "receipt", "total", "amount", "subtotal", "gst",
        "gstin", "charges", "payment", "net amount", "due", "balance", "item", "qty",
        "rate", "price", "billing", "account", "payable", "voucher", "cash memo"
    }

    PRESCRIPTION_KEYWORDS: Set[str] = {
        "prescription", "rx", "dr.", "doctor", "physician", "tablet", "tab", "cap",
        "capsule", "syrup", "dosage", "diagnosis", "symptoms", "advice", "medication",
        "treatment", "consultation", "clinic", "patient name", "age", "gender"
    }

    LAB_KEYWORDS: Set[str] = {
        "laboratory", "lab report", "pathology", "specimen", "investigation", "reference range",
        "observed value", "units", "sample", "haemoglobin", "blood", "urine", "test name",
        "diagnostic", "radiology", "ultrasound", "scan", "biochemistry", "hematology"
    }

    GENERIC_MEDICAL_KEYWORDS: Set[str] = {
        "hospital", "clinic", "healthcare", "medical", "nursing", "patient", "ward",
        "admission", "discharge", "opd", "ipd", "dr", "doctor", "surgeon", "consultant",
        "pharmacy", "mediclaim", "insurance", "reimbursement", "treatment", "care"
    }

    PROVIDER_NAME_PATTERNS = [
        re.compile(r"([A-Z][A-Za-z0-9\s&,\.\-']+\b(?:Hospital|Clinic|Healthcare|Health\s*Care|Medical\s*Center|Nursing\s*Home|Diagnostic\s*Centre|Diagnostics|Lab|Pathology|Eye\s*Care|Dental\s*Care|Infirmary|Sanatorium)\b)", re.IGNORECASE),
        re.compile(r"(\bDr\.\s+[A-Z][A-Za-z\s\.]+)", re.IGNORECASE),
    ]

    PHONE_PATTERN = re.compile(r"(?:Ph|Phone|Tel|Mobile|Contact|Mob)[\s\.:\-_]*([+]?[0-9]{2,4}[\s\-]?[0-9]{6,10})", re.IGNORECASE)
    GST_PATTERN = re.compile(r"\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})\b")
    REG_PATTERN = re.compile(r"(?:Reg|Registration|Lic|License|No|UID)[\s\.:\-_]*([A-Z0-9\-/]{5,20})", re.IGNORECASE)

    def __init__(
        self,
        min_text_chars: Optional[int] = None,
        min_confidence: Optional[float] = None,
    ):
        self.min_text_chars = min_text_chars if min_text_chars is not None else settings.RELEVANCE_MIN_TEXT_CHARS
        self.min_confidence = min_confidence if min_confidence is not None else settings.RELEVANCE_MIN_CONFIDENCE

    def extract_provider_info(self, full_text: str, first_page_lines: List[str]) -> ProviderInfo:
        """Extract medical institution or provider context from OCR text."""
        provider_name = None
        confidence = 0.0

        # Look in top lines for hospital/clinic name
        for line in first_page_lines[:8]:
            line_str = line.strip()
            if not line_str or len(line_str) < 4:
                continue
            for pattern in self.PROVIDER_NAME_PATTERNS:
                match = pattern.search(line_str)
                if match:
                    provider_name = match.group(1).strip()
                    confidence = 0.85
                    break
            if provider_name:
                break

        # Fallback: first non-empty line if it has medical keywords
        if not provider_name and first_page_lines:
            for line in first_page_lines[:4]:
                line_lower = line.lower()
                if any(kw in line_lower for kw in ["hospital", "clinic", "healthcare", "medical", "dr."]):
                    provider_name = line.strip()
                    confidence = 0.70
                    break

        phone = None
        phone_match = self.PHONE_PATTERN.search(full_text)
        if phone_match:
            phone = phone_match.group(1).strip()

        tax_id = None
        gst_match = self.GST_PATTERN.search(full_text)
        if gst_match:
            tax_id = gst_match.group(1).strip()

        reg_id = None
        reg_match = self.REG_PATTERN.search(full_text)
        if reg_match:
            reg_id = reg_match.group(1).strip()

        normalized_name = None
        if provider_name:
            # Normalize provider name: remove punctuation, lower-case, collapse whitespace
            norm = re.sub(r"[^\w\s]", "", provider_name).strip().upper()
            normalized_name = " ".join(norm.split())

        return ProviderInfo(
            name=provider_name,
            normalized_name=normalized_name,
            phone=phone,
            registration_id=reg_id,
            tax_id=tax_id,
            confidence=confidence if provider_name else 0.0,
        )

    @staticmethod
    def _match_keywords(keyword_set: Set[str], text: str) -> List[str]:
        """Find matching domain keywords using word boundaries to prevent subword false positives."""
        matched = []
        for kw in keyword_set:
            pattern = r"(?:\b)" + re.escape(kw) + r"(?:\b)"
            if re.search(pattern, text, re.IGNORECASE):
                matched.append(kw)
        return matched

    def classify_and_gate(self, processed_doc: ProcessedDocument) -> DocumentClassification:
        """Perform layout-aware document classification and relevance gating on processed document."""
        # 1. Aggregate OCR and layout metrics across all pages
        total_text = " ".join(p.text for p in processed_doc.pages).strip()
        total_chars = len(total_text)
        first_page_lines = [r.text.strip() for p in processed_doc.pages for r in p.ocr_regions if r.text.strip()]
        total_ocr_regions = sum(len(p.ocr_regions) for p in processed_doc.pages)
        total_layout_regions = sum(len(p.layout_regions) for p in processed_doc.pages)
        
        # Calculate mean OCR confidence
        all_confs = [r.confidence for p in processed_doc.pages for r in p.ocr_regions]
        mean_ocr_conf = (sum(all_confs) / len(all_confs)) if all_confs else 0.0

        # Calculate layout structural metrics
        has_table_layout = any(
            r.label.lower() in {"table", "tabular"}
            for p in processed_doc.pages for r in p.layout_regions
        )
        has_header_layout = any(
            r.label.lower() in {"header", "title", "heading"}
            for p in processed_doc.pages for r in p.layout_regions
        )
        
        # Calculate figure / image area dominance ratio across pages
        total_page_area = sum(p.width * p.height for p in processed_doc.pages if p.width > 0 and p.height > 0) or 1
        total_figure_area = 0
        for p in processed_doc.pages:
            for r in p.layout_regions:
                if r.label.lower() in {"figure", "image", "photo", "illustration"}:
                    w = max(0, r.bbox[2] - r.bbox[0])
                    h = max(0, r.bbox[3] - r.bbox[1])
                    total_figure_area += (w * h)
        figure_area_ratio = min(1.0, total_figure_area / total_page_area)

        # 2. Extract domain keywords using word-boundary matching
        text_lower = total_text.lower()
        
        detected_invoice_kw = self._match_keywords(self.INVOICE_KEYWORDS, text_lower)
        detected_rx_kw = self._match_keywords(self.PRESCRIPTION_KEYWORDS, text_lower)
        detected_lab_kw = self._match_keywords(self.LAB_KEYWORDS, text_lower)
        detected_med_kw = self._match_keywords(self.GENERIC_MEDICAL_KEYWORDS, text_lower)

        all_detected_kw = list(set(detected_invoice_kw + detected_rx_kw + detected_lab_kw + detected_med_kw))

        # Extract provider information
        provider_info = self.extract_provider_info(total_text, first_page_lines)

        has_billing_signals = bool(detected_invoice_kw)
        has_medical_signals = bool(detected_med_kw or detected_rx_kw or detected_lab_kw)
        has_provider = bool(provider_info and provider_info.name and provider_info.confidence >= 0.70)

        # 3. Evaluate Relevance & Gating Logic
        reasons: List[str] = []

        # REJECTION CONDITION 1: Almost zero text or no OCR content (e.g. photo / non-document / blur)
        if total_chars < self.min_text_chars:
            reasons.append(
                "Document Rejected: Uploaded file is an irrelevant document and does not belong to accepted medical document categories (medical invoices, laboratory reports, or prescriptions)."
            )
            reasons.append(
                f"Relevance Gate: Insufficient readable text content ({total_chars} characters detected; minimum required is {self.min_text_chars}). Image appears to be a photo, graphic, or non-text document."
            )
            return DocumentClassification(
                document_type=DocumentType.IRRELEVANT,
                relevance_status=RelevanceStatus.IRRELEVANT,
                confidence=0.95,
                reasons=reasons,
                detected_keywords=[],
                provider_info=None,
                is_medical_document=False,
                metadata={"total_chars": total_chars, "mean_ocr_conf": mean_ocr_conf, "figure_area_ratio": round(figure_area_ratio, 3)},
            )

        # REJECTION CONDITION 2: Figure / graphic dominance without structured claim tables
        if figure_area_ratio > 0.60 and not has_table_layout and total_ocr_regions < 6:
            reasons.append(
                "Document Rejected: Uploaded file is an image/graphic and not an accepted structured medical claim document."
            )
            reasons.append(
                "Relevance Gate: Layout is dominated by non-document imagery or graphics rather than structured billing forms, tables, or clinical records."
            )
            return DocumentClassification(
                document_type=DocumentType.IRRELEVANT,
                relevance_status=RelevanceStatus.IRRELEVANT,
                confidence=0.95,
                reasons=reasons,
                detected_keywords=all_detected_kw,
                provider_info=None,
                is_medical_document=False,
                metadata={"total_chars": total_chars, "figure_area_ratio": round(figure_area_ratio, 3)},
            )

        # REJECTION CONDITION 3: Complete lack of domain terminology and healthcare provider
        if not has_billing_signals and not has_medical_signals and not has_provider:
            reasons.append(
                "Document Rejected: Uploaded file is an irrelevant document and does not belong to accepted medical document categories (medical invoices, laboratory reports, or prescriptions)."
            )
            reasons.append(
                "Relevance Gate: No medical, billing, clinical, diagnostic, or healthcare provider terminology identified in document."
            )
            return DocumentClassification(
                document_type=DocumentType.IRRELEVANT,
                relevance_status=RelevanceStatus.IRRELEVANT,
                confidence=0.95,
                reasons=reasons,
                detected_keywords=[],
                provider_info=None,
                is_medical_document=False,
                metadata={"total_chars": total_chars, "mean_ocr_conf": mean_ocr_conf},
            )

        # REJECTION CONDITION 4: Commercial / Non-Medical Bill (Billing terms present, but ZERO medical context and NO medical provider)
        if has_billing_signals and not has_medical_signals and not has_provider:
            reasons.append(
                "Document Rejected: Uploaded file is a commercial / non-medical invoice or receipt and not an accepted medical claim document."
            )
            reasons.append(
                "Relevance Gate: Document contains commercial billing terms but lacks required healthcare or clinical context (patient name, physician, hospital/clinic provider, treatments, or medical services)."
            )
            return DocumentClassification(
                document_type=DocumentType.IRRELEVANT,
                relevance_status=RelevanceStatus.IRRELEVANT,
                confidence=0.95,
                reasons=reasons,
                detected_keywords=all_detected_kw,
                provider_info=provider_info,
                is_medical_document=False,
                metadata={"total_chars": total_chars, "detected_invoice_kw": detected_invoice_kw},
            )

        # REJECTION CONDITION 5: Unstructured continuous text / non-form document with weak isolated medical terms
        if not has_billing_signals and not has_provider and len(detected_med_kw) <= 1 and not has_table_layout and not (detected_rx_kw or detected_lab_kw) and total_chars > 300:
            reasons.append(
                "Document Rejected: Uploaded file lacks structured medical reimbursement formatting (invoice table, laboratory grid, or prescription format)."
            )
            reasons.append(
                "Relevance Gate: General non-claim text or unstructured document excluded from medical template analysis."
            )
            return DocumentClassification(
                document_type=DocumentType.IRRELEVANT,
                relevance_status=RelevanceStatus.IRRELEVANT,
                confidence=0.90,
                reasons=reasons,
                detected_keywords=all_detected_kw,
                provider_info=provider_info,
                is_medical_document=False,
                metadata={"total_chars": total_chars},
            )

        # 4. Classification Scoring
        score_invoice = len(detected_invoice_kw) * 1.5 + (2.0 if has_table_layout else 0.0) + (1.5 if (has_medical_signals or has_provider) else 0.0)
        score_rx = len(detected_rx_kw) * 2.0 + (1.0 if has_provider else 0.0)
        score_lab = len(detected_lab_kw) * 2.0 + (1.5 if has_table_layout else 0.0)
        score_med = len(detected_med_kw) * 1.0 + (1.5 if has_provider else 0.0)

        scores = {
            DocumentType.INVOICE: score_invoice,
            DocumentType.PRESCRIPTION: score_rx,
            DocumentType.LAB_REPORT: score_lab,
            DocumentType.OTHER_MEDICAL: score_med,
        }

        # Determine dominant document type
        best_type, best_score = max(scores.items(), key=lambda x: x[1])

        # If keyword score is 0 but provider was identified
        if best_score == 0:
            if has_provider:
                best_type = DocumentType.OTHER_MEDICAL
                best_score = 1.0
            else:
                reasons.append(
                    "Document Rejected: Uploaded file is an irrelevant document and does not belong to accepted medical document categories (medical invoices, laboratory reports, or prescriptions)."
                )
                reasons.append(
                    "Relevance Gate: Document does not match accepted medical reimbursement categories (invoice/prescription/lab report)."
                )
                return DocumentClassification(
                    document_type=DocumentType.IRRELEVANT,
                    relevance_status=RelevanceStatus.IRRELEVANT,
                    confidence=0.90,
                    reasons=reasons,
                    detected_keywords=all_detected_kw,
                    provider_info=provider_info,
                    is_medical_document=False,
                    metadata={"total_chars": total_chars, "scores": scores},
                )

        # 5. Determine Final Relevance Status
        if mean_ocr_conf < self.min_confidence and total_chars < 50:
            relevance_status = RelevanceStatus.LOW_CONFIDENCE_REVIEW
            reasons.append("Low OCR confidence detected; recommended for manual review.")
        else:
            relevance_status = RelevanceStatus.RELEVANT

        # Build explainable reasons
        if best_type == DocumentType.INVOICE:
            reasons.append("Identified as medical invoice / billing document based on tabular claim structure and healthcare billing terms.")
        elif best_type == DocumentType.PRESCRIPTION:
            reasons.append("Identified as medical prescription based on clinical and medication terms.")
        elif best_type == DocumentType.LAB_REPORT:
            reasons.append("Identified as diagnostic / laboratory report based on investigation and specimen reference terms.")
        else:
            reasons.append("Identified as medical claim document based on clinical domain terms.")

        if provider_info and provider_info.name:
            reasons.append(f"Detected healthcare provider: '{provider_info.name}' (confidence: {provider_info.confidence:.2f}).")

        conf = min(0.99, max(0.60, 0.50 + 0.10 * best_score))

        return DocumentClassification(
            document_type=best_type,
            relevance_status=relevance_status,
            confidence=round(conf, 2),
            reasons=reasons,
            detected_keywords=all_detected_kw,
            provider_info=provider_info,
            is_medical_document=True,
            metadata={
                "total_chars": total_chars,
                "mean_ocr_conf": round(mean_ocr_conf, 3),
                "scores": scores,
                "has_table": has_table_layout,
                "has_header": has_header_layout,
                "figure_area_ratio": round(figure_area_ratio, 3),
            },
        )
