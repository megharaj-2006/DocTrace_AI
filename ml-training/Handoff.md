# Member 5 → Member 3 Handoff

## What this is
A trained pipeline that compares two invoice images and tells you
whether they share the same underlying template.

## Model
- Backbone: `facebook/dinov2-base` (pretrained, no fine-tuning required)
- Loaded via Hugging Face `transformers`

## Input requirements
- Any invoice image (jpg/png)
- No manual preprocessing needed — `predict.py` handles resizing/normalization
  internally via `AutoImageProcessor`

## Output
- Embedding dimension: 768
- Similarity method: cosine similarity
- Validated threshold: **0.955**

## How to use it
`from predict import predict`

`result = predict("invoice_a.jpg", "invoice_b.jpg")`

Returns: `{'similarity': 0.98, 'same_template': True, 'threshold_used': 0.955}`

Or from command line:
`python predict.py invoice_a.jpg invoice_b.jpg`

## Evaluation results
Tested on 300 pairs across 50 template families (FATURA dataset):

| Metric | Value |
|---|---|
| AUC | 0.9908 |
| Accuracy | 0.9567 |
| Precision | 0.9536 |
| Recall | 0.96 |
| F1 | 0.9568 |

## Two use-modes for the microservice

1. Duplicate detection — compare a new claim against past claims. High similarity between unrelated claims = investigate.

2. Reference verification — compare a new claim against a known genuine template from that provider. Low similarity = claim doesn't match provider's real invoice format = investigate.

Both modes call the same predict() function — only the comparison target changes.

## Important: what this model does NOT do
- Does NOT decide fraud. It only reports template similarity.
- A match can be legitimate (same hospital, different patients).
- Fraud decision logic (claim metadata, patient history, rules) is the microservice's responsibility — this model is one input signal.

## Known limitations
- Trained/evaluated on synthetic clean invoices (FATURA dataset). Real scanned/photographed invoices may perform differently — untested.
- No fine-tuning done — baseline pretrained model only.

## Files
- scripts/predict.py — inference script
- notebooks/04_baseline_embeddings.ipynb — full experiment + evaluation
- outputs/baseline/ — histogram + hard-case example images