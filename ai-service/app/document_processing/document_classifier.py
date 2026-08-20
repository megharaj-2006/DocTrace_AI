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

    def classify_and_gate(self, processed_doc: ProcessedDocument) -> DocumentClassification:
        """Perform document classification and relevance gating on processed document."""
        # 1. Aggregate OCR and layout metrics across all pages
        total_text = " ".join(p.text for p in processed_doc.pages).strip()
        total_chars = len(total_text)
        first_page_lines = [r.text.strip() for p in processed_doc.pages for r in p.ocr_regions if r.text.strip()]
        total_ocr_regions = sum(len(p.ocr_regions) for p in processed_doc.pages)
        total_layout_regions = sum(len(p.layout_regions) for p in processed_doc.pages)
        
        # Calculate mean OCR confidence
        all_confs = [r.confidence for p in processed_doc.pages for r in p.ocr_regions]
        mean_ocr_conf = (sum(all_confs) / len(all_confs)) if all_confs else 0.0

        # Check table/header presence in layout
        has_table_layout = any(
            r.label.lower() in {"table", "tabular"}
            for p in processed_doc.pages for r in p.layout_regions
        )
        has_header_layout = any(
            r.label.lower() in {"header", "title", "heading"}
            for p in processed_doc.pages for r in p.layout_regions
        )

        # 2. Extract domain keywords
        text_lower = total_text.lower()
        
        detected_invoice_kw = [kw for kw in self.INVOICE_KEYWORDS if kw in text_lower]
        detected_rx_kw = [kw for kw in self.PRESCRIPTION_KEYWORDS if kw in text_lower]
        detected_lab_kw = [kw for kw in self.LAB_KEYWORDS if kw in text_lower]
        detected_med_kw = [kw for kw in self.GENERIC_MEDICAL_KEYWORDS if kw in text_lower]

        all_detected_kw = list(set(detected_invoice_kw + detected_rx_kw + detected_lab_kw + detected_med_kw))

        # Extract provider information
        provider_info = self.extract_provider_info(total_text, first_page_lines)

        # 3. Evaluate Relevance & Gating Logic
        reasons: List[str] = []

        # REJECTION CONDITION 1: Almost zero text or no OCR content (e.g. cow/landscape/photo)
        if total_chars < self.min_text_chars:
            reasons.append(
                f"Insufficient recognized text content ({total_chars} chars < {self.min_text_chars} min threshold)."
            )
            reasons.append("Document lacks readable tabular or structured claim information.")
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

        # REJECTION CONDITION 2: No medical or invoice keywords and no structured document layout
        has_domain_keywords = bool(all_detected_kw)
        has_document_structure = has_table_layout or has_header_layout or total_ocr_regions >= 5

        if not has_domain_keywords and not has_document_structure:
            reasons.append("No medical or billing domain terminology identified in document.")
            reasons.append("Document lacks standard medical invoice or clinical report structure.")
            return DocumentClassification(
                document_type=DocumentType.IRRELEVANT,
                relevance_status=RelevanceStatus.IRRELEVANT,
                confidence=0.90,
                reasons=reasons,
                detected_keywords=[],
                provider_info=None,
                is_medical_document=False,
                metadata={"total_chars": total_chars, "mean_ocr_conf": mean_ocr_conf},
            )

        # 4. Classification Scoring
        score_invoice = len(detected_invoice_kw) * 1.5 + (2.0 if has_table_layout else 0.0)
        score_rx = len(detected_rx_kw) * 1.5
        score_lab = len(detected_lab_kw) * 1.5
        score_med = len(detected_med_kw) * 1.0

        scores = {
            DocumentType.INVOICE: score_invoice,
            DocumentType.PRESCRIPTION: score_rx,
            DocumentType.LAB_REPORT: score_lab,
            DocumentType.OTHER_MEDICAL: score_med,
        }

        # Determine dominant document type
        best_type, best_score = max(scores.items(), key=lambda x: x[1])

        # If keywords are weak but provider was identified or there is significant text
        if best_score == 0 and (provider_info.confidence > 0 or has_document_structure):
            best_type = DocumentType.OTHER_MEDICAL
            best_score = 1.0

        # If still no medical signal at all
        if best_score == 0 and not has_domain_keywords:
            reasons.append("Document does not match medical reimbursement categories (invoice/prescription/lab).")
            return DocumentClassification(
                document_type=DocumentType.IRRELEVANT,
                relevance_status=RelevanceStatus.IRRELEVANT,
                confidence=0.85,
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
            reasons.append("Identified as medical invoice / billing document based on tabular and billing terms.")
        elif best_type == DocumentType.PRESCRIPTION:
            reasons.append("Identified as medical prescription based on clinical and medication terms.")
        elif best_type == DocumentType.LAB_REPORT:
            reasons.append("Identified as diagnostic / laboratory report based on investigation terms.")
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
            },
        )
