# Use official Python 3.11 slim base image
FROM python:3.11-slim as base

# Set environment variables for CPU execution, non-interactive mode, and container setup
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PORT=8000 \
    FLAGS_use_mkldnn=0 \
    FLAGS_use_onednn=0 \
    FLAGS_enable_pir_api=0 \
    FLAGS_enable_pir_in_executor=0 \
    PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True \
    HF_HOME=/app/.cache/huggingface

WORKDIR /app

# Install system dependencies required for OpenCV, pdfium, and PaddleOCR in Linux containers
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt-get/lists/*

# Install uv for fast, reproducible dependency installation
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy dependency configuration files
COPY pyproject.toml uv.lock requirements.txt README.md ./

# Install project dependencies
RUN uv sync --frozen --no-dev

# Pre-download and cache DINOv2 model weights into container image for instant offline startup
RUN uv run python -c "from transformers import AutoImageProcessor, AutoModel; AutoImageProcessor.from_pretrained('facebook/dinov2-base'); AutoModel.from_pretrained('facebook/dinov2-base')"

# Copy application source code and benchmark scripts
COPY app/ ./app/
COPY benchmark/ ./benchmark/


# Expose microservice port
EXPOSE 8000

# Run FastAPI app with Uvicorn using uv run
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
