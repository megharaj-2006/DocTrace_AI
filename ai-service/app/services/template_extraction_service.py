"""Template Extraction and Standardization Service producing content-independent layout representations."""

import re
from typing import Any, Dict, List, Optional, Tuple
from app.core.logging import logger
from app.schemas.document_understanding import DocumentClassification
from app.schemas.processed_document import PageData, ProcessedDocument
from app.schemas.structural import NormalizedBBox, NormalizedPageTemplate, VariableField


class TemplateExtractionService:
    """Extracts content-independent structural template representations and normalizes geometry."""

    # Variable field label detection patterns
    FIELD_PATTERNS = [
        (re.compile(r"\b(?:patient|pt|name|mr|mrs|ms|shri|smt)\b", re.IGNORECASE), "PATIENT_NAME"),
        (re.compile(r"\b(?:inv(?:oice)?|bill|receipt|rec)\s*(?:no|num|#|id)", re.IGNORECASE), "INVOICE_NUMBER"),
        (re.compile(r"\b(?:date|dt|dated|admission|discharge|time)\b", re.IGNORECASE), "DATE"),
        (re.compile(r"\b(?:total|amount|amt|grand\s*total|net|subtotal|balance|due|paid|charge|fee)\b", re.IGNORECASE), "AMOUNT"),
        (re.compile(r"\b(?:dr|doctor|physician|surgeon|consultant)\b", re.IGNORECASE), "DOCTOR_NAME"),
        (re.compile(r"\b(?:phone|ph|tel|mobile|contact|mob)\b", re.IGNORECASE), "PHONE"),
        (re.compile(r"\b(?:address|addr|city|state|pin|zip|road|street)\b", re.IGNORECASE), "ADDRESS"),
        (re.compile(r"\b(?:policy|claim|tpa|uhid|ipd|opd|reg|mrn|cr\s*no)\b", re.IGNORECASE), "POLICY_NUMBER"),
    ]

    def normalize_box(self, bbox: List[float], width: int, height: int) -> NormalizedBBox:
        """Convert pixel bounding box [x1, y1, x2, y2] to normalized [0.0, 1.0] coordinates."""
        w = max(1, width)
        h = max(1, height)
        
        # Handle 4-point polygon or [x1, y1, x2, y2]
        if len(bbox) == 4 and isinstance(bbox[0], (int, float)):
            x1, y1, x2, y2 = bbox
        else:
            # Flatten or find min/max
            xs = [pt[0] for pt in bbox if isinstance(pt, (list, tuple))] if isinstance(bbox[0], (list, tuple)) else bbox[::2]
            ys = [pt[1] for pt in bbox if isinstance(pt, (list, tuple))] if isinstance(bbox[0], (list, tuple)) else bbox[1::2]
            x1, x2 = min(xs), max(xs)
            y1, y2 = min(ys), max(ys)

        norm_x1 = max(0.0, min(1.0, float(x1) / w))
        norm_y1 = max(0.0, min(1.0, float(y1) / h))
        norm_x2 = max(0.0, min(1.0, float(x2) / w))
        norm_y2 = max(0.0, min(1.0, float(y2) / h))

        # Ensure valid ordering
        if norm_x2 < norm_x1:
            norm_x1, norm_x2 = norm_x2, norm_x1
        if norm_y2 < norm_y1:
            norm_y1, norm_y2 = norm_y2, norm_y1

        return NormalizedBBox(x1=norm_x1, y1=norm_y1, x2=norm_x2, y2=norm_y2)

    def extract_variable_fields(self, page_data: PageData) -> List[VariableField]:
        """Identify variable field structural locations without binding to specific patient data."""
        fields: List[VariableField] = []
        
        for ocr_reg in page_data.ocr_regions:
            text = ocr_reg.text.strip()
            if not text:
                continue

            for pattern, field_type in self.FIELD_PATTERNS:
                if pattern.search(text):
                    norm_bbox = self.normalize_box(ocr_reg.bbox, page_data.width, page_data.height)
                    fields.append(
                        VariableField(
                            field_type=field_type,
                            normalized_bbox=norm_bbox,
                            confidence=ocr_reg.confidence,
                        )
                    )
                    break  # Matched one field role

        return fields

    def extract_page_template(self, page_data: PageData) -> NormalizedPageTemplate:
        """Construct a content-independent standardized template representation for a single page."""
        w = max(1, page_data.width)
        h = max(1, page_data.height)
        aspect_ratio = round(float(w) / float(h), 4)

        # 1. Normalize layout regions
        norm_layout_regions = []
        table_count = 0
        header_count = 0

        for reg in page_data.layout_regions:
            label_lower = reg.label.lower()
            if "table" in label_lower:
                table_count += 1
            elif any(k in label_lower for k in ["header", "title", "heading"]):
                header_count += 1

            norm_box = self.normalize_box(reg.bbox, w, h)
            norm_layout_regions.append({
                "label": reg.label,
                "bbox": [norm_box.x1, norm_box.y1, norm_box.x2, norm_box.y2],
                "confidence": reg.confidence,
                "order": reg.order,
            })

        # 2. Normalize text geometry blocks
        norm_text_blocks = []
        for ocr_reg in page_data.ocr_regions:
            norm_box = self.normalize_box(ocr_reg.bbox, w, h)
            norm_text_blocks.append({
                "bbox": [norm_box.x1, norm_box.y1, norm_box.x2, norm_box.y2],
                "char_length": len(ocr_reg.text.strip()),
                "confidence": ocr_reg.confidence,
            })

        # 3. Extract variable field locations
        variable_fields = self.extract_variable_fields(page_data)

        return NormalizedPageTemplate(
            page_number=page_data.page_number,
            aspect_ratio=aspect_ratio,
            layout_regions=norm_layout_regions,
            text_blocks=norm_text_blocks,
            variable_fields=variable_fields,
            table_count=table_count,
            header_count=header_count,
            metadata={
                "total_layout_regions": len(norm_layout_regions),
                "total_text_blocks": len(norm_text_blocks),
                "total_variable_fields": len(variable_fields),
            },
        )

    def extract_document_templates(
        self,
        processed_doc: ProcessedDocument,
        classification: Optional[DocumentClassification] = None,
    ) -> List[NormalizedPageTemplate]:
        """Extract standardized template representations for all pages in a document."""
        templates = []
        for page in processed_doc.pages:
            tpl = self.extract_page_template(page)
            templates.append(tpl)

        logger.debug(
            "Extracted %d normalized page templates for documentId='%s'",
            len(templates),
            processed_doc.document_id,
        )
        return templates
