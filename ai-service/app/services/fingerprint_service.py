"""Multi-signal fingerprint generation services: Visual (DINOv2), Structural (Layout geometry), and Field features."""

import math
from typing import Any, Dict, List, Optional, Union
import numpy as np
from PIL import Image

from app.core.config import settings
from app.core.logging import logger
from app.schemas.embedding import PageEmbedding
from app.schemas.structural import NormalizedPageTemplate, StructuralEmbedding
from app.services.embedding_service import EmbeddingService


class StructuralFingerprintService:
    """Computes fixed-dimension (128-D) content-independent structural layout fingerprints."""

    DIMENSION: int = 128

    def generate_structural_embedding(
        self,
        template: NormalizedPageTemplate,
        document_id: str,
    ) -> StructuralEmbedding:
        """Generate a 128-D L2-normalized structural fingerprint from normalized page layout."""
        features = np.zeros(self.DIMENSION, dtype=np.float32)

        # --- Section 1: Dual-Channel Spatial Occupancy Grids (64 dimensions: indices 0..63) ---
        # Channel A (32 dims: 0..31): 8x4 Grid for Tabular/Form structures
        # Channel B (32 dims: 32..63): 8x4 Grid for Header/Text/Footer/Figures
        grid_w, grid_h = 8, 4
        grid_struct = np.zeros((grid_h, grid_w), dtype=np.float32)
        grid_content = np.zeros((grid_h, grid_w), dtype=np.float32)

        for reg in template.layout_regions:
            bbox = reg.get("bbox", [0, 0, 0, 0])
            label = str(reg.get("label", "")).lower()
            conf = float(reg.get("confidence", 1.0))
            x1, y1, x2, y2 = bbox
            gx1 = min(grid_w - 1, max(0, int(x1 * grid_w)))
            gy1 = min(grid_h - 1, max(0, int(y1 * grid_h)))
            gx2 = min(grid_w - 1, max(0, int(x2 * grid_w)))
            gy2 = min(grid_h - 1, max(0, int(y2 * grid_h)))
            area = max(0.01, (x2 - x1) * (y2 - y1)) * conf

            if any(k in label for k in ["table", "tabular", "form", "key_value", "list"]):
                grid_struct[gy1 : gy2 + 1, gx1 : gx2 + 1] += area * 5.0
            else:
                grid_content[gy1 : gy2 + 1, gx1 : gx2 + 1] += area * 3.0

        for tb in template.text_blocks:
            bbox = tb.get("bbox", [0, 0, 0, 0])
            x1, y1, x2, y2 = bbox
            cx = min(grid_w - 1, max(0, int(((x1 + x2) / 2.0) * grid_w)))
            cy = min(grid_h - 1, max(0, int(((y1 + y2) / 2.0) * grid_h)))
            grid_content[cy, cx] += 0.5

        features[0:32] = grid_struct.flatten()
        features[32:64] = grid_content.flatten()

        # --- Section 2: Layout Category & Field Histogram (16 dimensions: indices 64..79) ---
        cat_hist = np.zeros(16, dtype=np.float32)
        cat_map = {
            "table": 0, "tabular": 0,
            "header": 1, "title": 1, "heading": 1,
            "text": 2, "paragraph": 2,
            "figure": 3, "image": 3, "logo": 3,
            "form": 4, "key_value": 4,
            "list": 5, "item": 5,
            "footer": 6,
            "signature": 7, "stamp": 7,
        }

        for reg in template.layout_regions:
            label = str(reg.get("label", "")).lower()
            idx = 2  # default text
            for key, c_idx in cat_map.items():
                if key in label:
                    idx = c_idx
                    break
            cat_hist[idx] += 2.0

        # Variable field categories (indices 8..13)
        for vf in template.variable_fields:
            ftype = vf.field_type.upper()
            if "PATIENT" in ftype:
                cat_hist[8] += 2.0
            elif "AMOUNT" in ftype or "TOTAL" in ftype:
                cat_hist[9] += 2.0
            elif "DATE" in ftype:
                cat_hist[10] += 2.0
            elif "INVOICE" in ftype or "BILL" in ftype:
                cat_hist[11] += 2.0
            elif "DOCTOR" in ftype:
                cat_hist[12] += 2.0
            else:
                cat_hist[13] += 2.0

        features[64:80] = cat_hist

        # --- Section 3: Spatial Projection Profiles (32 dimensions: indices 80..111) ---
        num_proj_bins = 16
        v_proj = np.zeros(num_proj_bins, dtype=np.float32)
        h_proj = np.zeros(num_proj_bins, dtype=np.float32)

        for tb in template.text_blocks:
            bbox = tb.get("bbox", [0, 0, 0, 0])
            x1, y1, x2, y2 = bbox
            cx = (x1 + x2) / 2.0
            cy = (y1 + y2) / 2.0
            bx = min(num_proj_bins - 1, max(0, int(cx * num_proj_bins)))
            by = min(num_proj_bins - 1, max(0, int(cy * num_proj_bins)))
            h_proj[bx] += 1.0
            v_proj[by] += 1.0

        features[80:96] = v_proj
        features[96:112] = h_proj

        # --- Section 4: Geometry Summary Invariants (16 dimensions: indices 112..127) ---
        geo = np.zeros(16, dtype=np.float32)
        geo[0] = (template.aspect_ratio - 0.75) * 2.0
        geo[1] = (float(template.table_count) - 0.5) * 3.0
        geo[2] = (float(template.header_count) - 1.0) * 2.0
        geo[3] = (len(template.variable_fields) - 3.0) * 0.5
        geo[4] = (len(template.layout_regions) - 4.0) * 0.5
        geo[5] = (len(template.text_blocks) - 10.0) * 0.2

        # Spatial distribution statistics
        if template.text_blocks:
            widths = [(tb["bbox"][2] - tb["bbox"][0]) for tb in template.text_blocks]
            heights = [(tb["bbox"][3] - tb["bbox"][1]) for tb in template.text_blocks]
            cxs = [(tb["bbox"][0] + tb["bbox"][2]) / 2.0 for tb in template.text_blocks]
            cys = [(tb["bbox"][1] + tb["bbox"][3]) / 2.0 for tb in template.text_blocks]

            geo[6] = (float(np.mean(widths)) - 0.3) * 5.0
            geo[7] = (float(np.mean(heights)) - 0.05) * 10.0
            geo[8] = float(np.std(widths)) * 5.0
            geo[9] = float(np.std(heights)) * 10.0
            geo[10] = (float(np.mean(cxs)) - 0.5) * 10.0
            geo[11] = (float(np.mean(cys)) - 0.5) * 10.0

            # Quadrant imbalance
            top_half = sum(1 for y in cys if y < 0.5)
            bottom_half = len(cys) - top_half
            left_half = sum(1 for x in cxs if x < 0.5)
            right_half = len(cxs) - left_half

            geo[12] = float(top_half - bottom_half) / max(1, len(cys)) * 3.0
            geo[13] = float(left_half - right_half) / max(1, len(cxs)) * 3.0

        # --- Mean Centering and L2 Normalization ---
        features = features - np.mean(features)
        norm = np.linalg.norm(features)
        if norm > 1e-8:
            features = features / norm
        else:
            features[0] = 1.0  # fallback unit vector

        return StructuralEmbedding(
            document_id=document_id,
            page_number=template.page_number,
            vector=features.tolist(),
            dimension=self.DIMENSION,
            model_version=settings.STRUCTURAL_MODEL_VERSION,
            template_version=settings.TEMPLATE_VERSION,
        )



class FingerprintService:
    """Coordinates visual (DINOv2) and structural layout fingerprint generation."""

    def __init__(
        self,
        embedding_service: Optional[EmbeddingService] = None,
        structural_service: Optional[StructuralFingerprintService] = None,
    ):
        self.embedding_service = embedding_service or EmbeddingService()
        self.structural_service = structural_service or StructuralFingerprintService()

    def generate_visual_fingerprint(
        self,
        image_input: Union[Image.Image, str],
        document_id: str,
        page_number: int,
    ) -> PageEmbedding:
        """Generate 768-D L2-normalized DINOv2 visual embedding (runs exactly ONCE per page)."""
        return self.embedding_service.generate_page_embedding(
            image_input=image_input,
            document_id=document_id,
            page_number=page_number,
        )

    def generate_structural_fingerprint(
        self,
        template: NormalizedPageTemplate,
        document_id: str,
    ) -> StructuralEmbedding:
        """Generate 128-D L2-normalized structural layout embedding."""
        return self.structural_service.generate_structural_embedding(
            template=template,
            document_id=document_id,
        )
