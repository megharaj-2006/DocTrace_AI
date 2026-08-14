"""
predict.py — Invoice template matching inference script.

Given two invoice images, returns whether they share the same
underlying template.

Model: facebook/dinov2-base
Similarity method: cosine similarity
Validated threshold: 0.955 (AUC 0.9908, F1 0.9568 on 300-pair FATURA eval)
"""

import torch
import torch.nn.functional as F
from PIL import Image
from transformers import AutoImageProcessor, AutoModel

device = "cuda" if torch.cuda.is_available() else "cpu"

processor = AutoImageProcessor.from_pretrained("facebook/dinov2-base")
model = AutoModel.from_pretrained("facebook/dinov2-base").to(device)
model.eval()


def get_embedding(image_path):
    """Convert an invoice image into a 768-dim embedding vector."""
    image = Image.open(image_path).convert("RGB")
    inputs = processor(images=image, return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = model(**inputs)
    return outputs.last_hidden_state[:, 0, :]


def predict(image_path_a, image_path_b, threshold=0.955):
    """
    Compare two invoice images and decide if they share the same template.

    Returns:
        dict with similarity score, same_template decision, threshold used
    """
    emb_a = get_embedding(image_path_a)
    emb_b = get_embedding(image_path_b)
    similarity = F.cosine_similarity(emb_a, emb_b).item()

    return {
        "similarity": round(similarity, 4),
        "same_template": similarity >= threshold,
        "threshold_used": threshold
    }


if __name__ == "__main__":
    import sys
    if len(sys.argv) != 3:
        print("Usage: python predict.py <image_a> <image_b>")
    else:
        result = predict(sys.argv[1], sys.argv[2])
        print(result)