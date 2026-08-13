# DocTrace AI — AI Microservice

AI-powered document analysis microservice for medical invoice template similarity and fraud risk assessment.

---

## Architecture & Implementation Overview

- **Phase 0 — FastAPI Microservice Foundation**: Frozen external API contract (`POST /api/v1/analyze`), type-safe settings, structured logging, mock vector store, guaranteed temporary file cleanup.
- **Phase 1 — Document Intelligence / Document Processing Pipeline**: Multimodal pipeline for PDF, JPG, and PNG medical invoices utilizing `pypdfium2` (rendering PDFs at 200 DPI), OpenCV/Pillow conservative preprocessing, `PaddleOCR` (English text recognition), and `PP-DocLayout-M` (structural layout detection).
- **Phase 2A — Embedding & Vector Intelligence**: Page-level 768-D vision embeddings using stock `facebook/dinov2-base` (CLS token extraction), L2 normalization, `VectorStore` abstraction, `QdrantVectorStore` integration, `SimilarityService` with configurable baseline cutoff (`0.955`), self-match prevention, and distinct Search vs Registration workflows.


---

## 🏗️ Technology Stack

- **Language**: Python 3.11
- **Framework**: FastAPI
- **Package Manager**: `uv`
- **PDF Renderer**: `pypdfium2`
- **OCR Engine**: `PaddleOCR` (English)
- **Layout Detection**: `PP-DocLayout-M` / `PaddleX`
- **ASGI Server**: Uvicorn
- **Containerization**: Docker

---

## 📁 Project Structure

```text
ai-service/
├── AGENTS.md               # AI service instructions
├── README.md               # AI service documentation
├── pyproject.toml          # Dependency specification
├── uv.lock                 # Lock file for reproducible builds
├── requirements.txt        # Exported requirements file
├── Dockerfile              # Containerization definition
├── .dockerignore           # Container build exclusions
├── .gitignore              # Git ignore rules
├── .env.example            # Environment configuration template
│
├── app/                    # Application package
│   ├── main.py             # FastAPI entrypoint
│   ├── api/                # API router definitions
│   │   └── routes/
│   │       ├── analysis.py # POST /api/v1/analyze
│   │       └── health.py   # GET /health
│   ├── document_processing/# Phase 1 Document Intelligence Pipeline
│   │   ├── file_validator.py  # File format and 20MB size validation
│   │   ├── document_loader.py # Image loading & pypdfium2 PDF page rendering
│   │   ├── preprocessor.py    # Conservative image normalization (RGB, max 2400px)
│   │   ├── ocr_service.py     # PaddleOCR English text recognition engine
│   │   ├── layout_detector.py # PP-DocLayout-M layout detection engine
│   │   └── processor.py       # Orchestration & ProcessedDocument creation
│   ├── schemas/            # Pydantic data models
│   │   ├── analysis.py     # Request/response schemas (Frozen contract)
│   │   ├── processed_document.py # Phase 1 internal representation
│   │   └── common.py       # Base API schemas
│   ├── services/           # Application service orchestration
│   │   └── analysis_service.py # Intersects Phase 1 pipeline with Phase 0 API contract
│   ├── vector_store/       # Vector store abstraction
│   │   ├── base.py         # Abstract VectorStore interface
│   │   └── mock.py         # MockVectorStore
│   └── core/               # Configuration, logging, exceptions
│       ├── config.py       # Settings (pydantic-settings)
│       ├── logging.py      # Structured logging setup
│       └── exceptions.py   # Exception handlers
│
├── benchmark/              # Mandatory CPU/Memory Benchmark Suite
│   ├── README.md           # Benchmark documentation
│   ├── benchmark_layout.py # Benchmark execution script
│   ├── results.json        # Structured CPU benchmark metrics
│   └── results.md          # Rendered CPU benchmark summary
│
└── tests/                  # Test suite
    ├── conftest.py         # Test fixtures (valid PDF binary generator)
    ├── unit/               # Unit tests
    │   ├── test_config.py
    │   ├── test_vector_store.py
    │   ├── test_file_cleanup.py
    │   ├── test_file_validator.py
    │   ├── test_document_loader.py
    │   ├── test_preprocessor.py
    │   ├── test_processed_document.py
    │   └── test_ocr_layout.py
    └── integration/        # Integration tests
        ├── test_health.py
        ├── test_analysis.py
        └── test_phase1_pipeline.py
```

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Available variables:
- `APP_ENV`: Environment (`development`, `production`, `testing`)
- `SERVICE_NAME`: Microservice identifier (`doctrace-ai-service`)
- `HOST`: Server bind address (`0.0.0.0`)
- `PORT`: Server bind port (`8000`)
- `LOG_LEVEL`: Logging verbosity (`INFO`, `DEBUG`, `WARNING`, `ERROR`)
- `TEMP_DIR`: Temporary file storage location (defaults to system temp directory)

---

## 🚀 Running Locally with `uv`

### 1. Install Dependencies

```bash
uv sync --extra dev
```

### 2. Start Development Server

```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🔌 API Endpoints

### 1. Health Check

```http
GET /health
```

**Response**:
```json
{
  "status": "ok",
  "service": "ai-service"
}
```

### 2. Invoice Analysis

```http
POST /api/v1/analyze
Content-Type: multipart/form-data
```

**Form Data**:
- `file`: Invoice document (PDF / image)
- `documentId`: Application document identifier string (e.g. `INV-123`)

**Response**:
```json
{
  "documentId": "INV-123",
  "fraudScore": 0.91,
  "riskLevel": "RED",
  "confidence": 0.94,
  "matchedDocuments": [
    {
      "documentId": "INV-087",
      "similarity": 0.94
    }
  ],
  "reasons": [
    "High template similarity",
    "Header structure matches"
  ]
}
```

---

## 🛡️ Temporary File Policy & Windows Safety

1. Files received via `multipart/form-data` are stored in an isolated temp path.
2. `pypdfium2` PDF handles are closed explicitly in `finally` blocks to prevent Windows file locks (`WinError 32`).
3. After Phase 1 document processing completes, temporary files are **guaranteed to be deleted** in a `finally` block before returning the HTTP response.

---

## 📊 CPU Benchmark Suite

To measure CPU initialization time, per-page inference latency, and peak RAM footprint:

```bash
uv run python benchmark/benchmark_layout.py
```

Results are saved to `benchmark/results.json` and summarized in `benchmark/results.md`.

---

## 🐳 Docker Usage

### Build Image

```bash
docker build -t doctrace-ai-service:phase1 .
```

### Run Container

```bash
docker run -p 8000:8000 doctrace-ai-service:phase1
```

---

## 🧪 Running Tests

Run the full unit and integration test suite:

```bash
uv run pytest
```

---

## ⚠️ Phase 1 Scope & Deferred Components

Phase 1 provides complete document intelligence internal representations (`ProcessedDocument`).
The following components are intentionally deferred to future phases:
- ❌ **PyTorch Embedding Generation** (Phase 2)
- ❌ **Vector Store Persistence & Search** (Phase 2 - currently using `VectorStore` abstraction)
- ❌ **Template Fraud & Risk Scoring Logic** (Phase 3)
