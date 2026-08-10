# ML Model Training — Invoice Template Matching

Member 5 deliverable for DocTrace_AI (SIH 2026, Problem Statement SIH260085)

## 1. Objective
Determine whether two invoice images are based on the same underlying
document template, to support fraud detection in health insurance claims.

## 2. Dataset used
FATURA: 10,000 synthetic invoices across 50 template families.
Source: https://zenodo.org/records/8261508
Citation: Limam, Dhiaf & Kessentini, 2023 (CC-BY-4.0)

## 3. Model selected
facebook/dinov2-base (pretrained vision transformer, via Hugging Face)

## 4. Why this model
No training data was available at project start. DINOv2 provides strong
general-purpose visual embeddings without requiring fine-tuning, allowing
a working baseline within the 12-day timeline. Baseline evaluation
(AUC 0.99) confirmed it performs well enough that fine-tuning was not
necessary for this stage.

## 5. Input preprocessing
Handled automatically by Hugging Face's AutoImageProcessor
(resize + normalize). No manual preprocessing required.

## 6. Method
1. Each invoice image is passed through DINOv2 to generate a 768-dimension
   embedding vector.
2. Two invoices are compared using cosine similarity.
3. If similarity is above the threshold, they are considered the same
   template.

## 7. Threshold selection
Threshold was chosen by sweeping values from 0.80 to 1.00 on a
300-pair evaluation set and selecting the value with the best F1 score.

Selected threshold: 0.955

## 8. Evaluation results
Evaluated on 300 pairs (150 same-template, 150 different-template)
across 50 template families:

| Metric | Value |
|---|---|
| AUC | 0.9908 |
| Accuracy | 0.9567 |
| Precision | 0.9536 |
| Recall | 0.96 |
| F1 | 0.9568 |

See outputs/baseline/baseline_histogram.png for the similarity
distribution, and outputs/baseline/hard_case_example.png for a
known difficult case (two different templates that scored 0.964).

## 9. How to use
See HANDOFF.md for full integration details.

Quick example:
from predict import predict
result = predict("invoice_a.jpg", "invoice_b.jpg")

## 10. Known limitations
- Evaluated on synthetic, clean invoice images. Real scanned or
  photographed invoices (noise, skew, shadows) are untested.
- No fine-tuning performed. Baseline pretrained model only.
- A structural masking preprocessing step was tested (blacking out
  text regions before embedding) but showed no improvement over raw
  images (AUC unchanged), so it was not adopted.

## 11. Roadmap
- Fine-tune with Siamese/contrastive learning if real-world testing
  shows the baseline is insufficient.
- Test on real scanned invoices with noise/rotation augmentation.
- Add reference-based verification mode (compare claims against a
  known genuine provider template, not just against each other).

## 12. Repository structure
ml-training/
  notebooks/       - experiment notebooks (01-04)
  scripts/          - predict.py (inference script)
  outputs/baseline/ - evaluation charts
  HANDOFF.md        - integration spec for Member 3
  requirements.txt  - dependencies