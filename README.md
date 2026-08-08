# DocTrace AI

### AI-Powered Medical Invoice Template Similarity & Fraud Detection

DocTrace AI is an AI-powered document analysis system designed to help
identify potentially fraudulent medical reimbursement claims by detecting
similarities between medical invoice templates.

Fraudulent claims may involve reusing an existing invoice template while
modifying information such as patient details, provider names, invoice
numbers, dates, amounts, logos, colors, or text positioning.

Instead of relying only on textual comparison, DocTrace AI focuses on the
underlying visual and structural characteristics of medical invoices.

---

## 🚨 Current Scope

### Phase 1 — Medical Invoices

The current implementation is limited to:

- Medical invoices
- Medical bills
- Invoice template similarity
- Similar-document detection
- Fraud/suspicion scoring
- Investigator review

### Future Scope

The architecture is designed to be extendable to:

- Medical prescriptions
- Laboratory reports
- Other healthcare documents

Prescriptions and laboratory reports are **not part of the current
implementation**.

---

# 🎯 Problem

Healthcare and insurance organizations process large numbers of medical
documents for reimbursement claims.

A fraudulent claimant may reuse an existing invoice template and make small
changes to the document:

- Change patient information
- Change provider/hospital name
- Change invoice number
- Change dates
- Change amounts
- Change logos
- Change colors
- Modify text
- Reposition individual elements

Traditional document comparison methods may fail when the textual content
has been changed significantly.

The objective of DocTrace AI is to identify whether seemingly different
invoices may originate from the same or highly similar underlying template.

---

# 💡 Proposed Solution

DocTrace AI uses document representation and similarity analysis to compare
medical invoices.

The high-level process is:

1. Upload an invoice.
2. Preprocess the document.
3. Generate a document representation/embedding.
4. Compare the embedding against existing invoice representations.
5. Calculate similarity scores.
6. Identify highly similar documents.
7. Generate a potential fraud/suspicion score.
8. Assign a risk level.
9. Provide reasons for the detected similarity.
10. Allow an investigator to review the result.

The system assists investigators rather than automatically declaring a claim
fraudulent.

---

# 🏗️ System Architecture

```text
                         ┌──────────────────────┐
                         │    React Frontend    │
                         │                      │
                         │ Upload / Dashboard   │
                         │ Results / Review     │
                         └──────────┬───────────┘
                                    │
                                    │ REST API
                                    ▼
                         ┌──────────────────────┐
                         │   Spring Boot        │
                         │      Backend         │
                         │                      │
                         │ Authentication       │
                         │ Invoice Management   │
                         │ Database             │
                         │ AI Integration       │
                         │ Fraud Alerts         │
                         └───────┬───────┬──────┘
                                 │       │
                     PostgreSQL  │       │ HTTP
                                 │       ▼
                                 │  ┌──────────────────────┐
                                 │  │ Python AI            │
                                 │  │ Microservice         │
                                 │  │                      │
                                 │  │ Preprocessing        │
                                 │  │ OCR/Layout           │
                                 │  │ Embeddings           │
                                 │  │ Similarity           │
                                 │  │ Fraud Scoring        │
                                 │  │ Explanation          │
                                 │  └──────────┬───────────┘
                                 │             │
                                 │             ▼
                                 │      ┌──────────────┐
                                 │      │  ML Model    │
                                 │      └──────────────┘
                                 │
                                 ▼
                          Application Data
```

### Important Architecture Principle

The frontend does **not** directly communicate with the AI microservice.

The communication flow is:

```text
Frontend
   ↓
Spring Boot Backend
   ↓
Python AI Microservice
   ↓
ML Model
```

The Spring Boot backend acts as the central application layer.

---

# 🧠 AI Pipeline

The AI component is conceptually organized as:

```text
Medical Invoice
       │
       ▼
Preprocessing
       │
       ▼
OCR / Layout Processing
       │
       ▼
Document Representation
       │
       ▼
Embedding Generation
       │
       ▼
Similarity Comparison
       │
       ▼
Similarity Scores
       │
       ▼
Fraud / Suspicion Score
       │
       ▼
Risk Classification
       │
       ▼
Explanation
```

The exact ML architecture and model are determined through experimentation
and evaluation during the ML development phase.

The project does not require training a model from scratch if a suitable
pretrained model can provide better results within the available dataset
and timeline.

---

# 📊 Dataset

The project uses a combination of:

- Original/publicly available invoice samples
- Synthetic invoice variations
- Metadata
- Positive document pairs
- Negative document pairs

The dataset is organized as:

```text
dataset/
│
├── raw/
│   └── original/
│
├── generated/
│
└── metadata/
    ├── raw_documents.csv
    ├── documents.csv
    ├── pairs.csv
    ├── train.csv
    ├── validation.csv
    └── test.csv
```

### Positive Pair

Two documents belonging to the same underlying template family.

```text
Invoice A ─────┐
               ├── Same template → Positive pair
Invoice B ─────┘
```

### Negative Pair

Two documents belonging to different template families.

```text
Invoice A ─────┐
               ├── Different templates → Negative pair
Invoice B ─────┘
```

The dataset-generation process and ML evaluation methodology are documented
separately.

---

# 🔬 ML Approach

The project investigates document embeddings and similarity-based approaches.

A simplified representation is:

```text
Invoice A
    ↓
Embedding A ─────┐
                 │
                 ├── Cosine Similarity
                 │
Embedding B ─────┘
    ↑
Invoice B
```

The system evaluates whether documents from the same template family tend
to produce higher similarity scores than documents from different template
families.

The ML pipeline may use:

- Pretrained document/vision models
- Transfer learning
- Fine-tuning
- Metric learning
- Embedding-based similarity
- Cosine similarity

The final approach is selected based on experimental results.

---

# 🚦 Risk Classification

The system uses three conceptual risk levels:

| Risk Level | Meaning |
|------------|---------|
| LOW | Low evidence of suspicious template similarity |
| AMBER | Suspicious similarity requiring investigation |
| RED | High similarity / high potential fraud risk |

The exact numerical thresholds are determined through validation and testing
rather than being arbitrarily chosen.

### Important

A RED result does **not** automatically mean that fraud has been proven.

DocTrace AI is an investigation-assistance system.

The final decision remains with the investigator.

---

# 👨‍💼 Investigator Workflow

An investigator should be able to:

```text
Login
  ↓
View invoices
  ↓
Open suspicious invoice
  ↓
View AI analysis
  ↓
View similarity score
  ↓
View matched invoices
  ↓
View risk level
  ↓
View explanation
  ↓
Compare documents
  ↓
Review alert
  ↓
Resolve / Dismiss / Continue investigation
```

This human-in-the-loop design prevents the system from treating an AI
prediction as definitive proof of fraud.

---

# ✨ Key Features

## User Features

- Secure authentication
- Invoice upload
- Invoice history
- Invoice search
- Invoice details
- AI analysis

## AI Features

- Document preprocessing
- Document embeddings
- Template similarity detection
- Similar document identification
- Similarity scoring
- Fraud/suspicion scoring
- Risk classification
- Explainable similarity results

## Investigator Features

- Fraud alert dashboard
- Suspicious invoice filtering
- Similar invoice comparison
- Risk-level filtering
- Alert review
- Alert resolution
- False-positive dismissal
- Investigation history

## Dashboard

- Total invoices
- Analyzed invoices
- Pending analyses
- RED alerts
- AMBER alerts
- Low-risk invoices
- Similarity statistics
- Recent suspicious documents

---

# 🛠️ Technology Stack

## Frontend

- React
- JavaScript / TypeScript
- REST API integration

## Backend

- Java
- Spring Boot
- Spring Security
- Spring Data JPA
- Maven
- PostgreSQL

## AI Microservice

- Python
- FastAPI
- PyTorch
- Computer vision/document-processing libraries
- OCR/document-processing tools as required

## Machine Learning

- Python
- PyTorch
- Pretrained document/vision models
- Embeddings
- Cosine similarity
- Metric learning/fine-tuning where appropriate

## Development & Testing

- Git
- GitHub
- Postman
- Swagger/OpenAPI
- JUnit
- Docker where required

---

# 📁 Repository Structure

```text
DocTrace_AI/
│
├── README.md
├── AGENTS.md
├── .gitignore
│
├── ai-service/
│   └── Python AI inference service
│
├── backend/
│   └── Spring Boot application
│
├── frontend/
│   └── React application
│
├── dataset/
│   ├── raw/
│   ├── generated/
│   └── metadata/
│
├── ml-training/
│   └── ML experiments, training and evaluation
│
└── docs/
    ├── architecture.md
    ├── api-contract.md
    └── development-workflow.md
```

---

# 👥 Team Responsibilities

The project is divided into six workstreams.

| Member | Responsibility |
|--------|----------------|
| Member 1 + 2 | Frontend + Data Collection + Presentation |
| Member 3 | Python AI Microservice |
| Member 4 | Dataset Generation |
| Member 5 | ML Model Training |
| Member 6 | Spring Boot Backend |

### Development Flow

```text
Raw Invoice Collection
        ↓
Dataset Generation
        ↓
ML Training
        ↓
AI Microservice
        ↓
Spring Boot Backend
        ↓
React Frontend
```

The teams can work in parallel using defined interfaces between modules.

---

# 🔌 Module Communication

## Frontend → Backend

The frontend communicates with Spring Boot through REST APIs.

Examples:

```text
POST /api/v1/auth/login

POST /api/v1/invoices

POST /api/v1/invoices/{id}/analyze

GET /api/v1/invoices/{id}

GET /api/v1/invoices/{id}/analysis

GET /api/v1/invoices/{id}/similar

GET /api/v1/alerts

GET /api/v1/dashboard/summary
```

## Backend → AI Microservice

The backend sends an invoice to the AI service:

```text
POST /api/v1/analyze
```

The AI service returns structured analysis information such as:

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
    "Header structure closely matches"
  ]
}
```

The complete API contract is maintained in:

```text
docs/api-contract.md
```

---

# 🔐 Security

The application uses:

- JWT-based authentication
- Password hashing
- Role-based authorization
- File validation
- Environment variables for secrets
- Controlled communication between backend and AI service

Sensitive information must never be committed to Git.

---

# 🧪 Evaluation

The ML system should be evaluated using appropriate document-similarity
metrics and a held-out test dataset.

Important evaluation areas include:

- Similarity distribution for positive pairs
- Similarity distribution for negative pairs
- Ability to separate similar and dissimilar templates
- False positives
- False negatives
- Precision
- Recall
- F1 score
- Threshold performance

The final system should demonstrate that documents belonging to the same
template family tend to receive higher similarity scores than unrelated
documents.

---

# 🚀 Development Status

## Current Phase

> Development / SIH 2026 Prototype

### Current implementation target

Medical invoice template similarity and potential fraud detection.

### Future extensions

- Prescription analysis
- Laboratory report analysis
- Additional healthcare document types
- Larger provider/document datasets
- Production-scale document processing

---

# 📚 Documentation

Detailed technical information is maintained separately.

### Architecture

See:

```text
docs/architecture.md
```

for:

- System architecture
- Component responsibilities
- Data flow
- Service boundaries
- Database architecture

### API Contract

See:

```text
docs/api-contract.md
```

for:

- Frontend → Backend APIs
- Backend → AI Service API
- Request/response formats
- Error contracts

### Development Workflow

See:

```text
docs/development-workflow.md
```

for:

- Git workflow
- Branch structure
- Team responsibilities
- Integration workflow

### AI Agent Instructions

See:

```text
AGENTS.md
```

for the project's persistent development rules and architectural constraints.

---

# ⚠️ Important Project Principle

DocTrace AI is designed as an **AI-assisted fraud investigation system**.

It identifies suspicious document similarities and helps investigators
prioritize claims.

It does not independently establish that a person or claim is fraudulent.

The system's outputs should therefore be interpreted as:

> **risk indicators and investigation signals, not definitive proof of fraud.**

---

# 📌 Project Goal

The goal of DocTrace AI is to demonstrate a practical, scalable approach to
detecting potentially fraudulent medical reimbursement documents by
identifying reused or manipulated document templates.

The final prototype should demonstrate a complete end-to-end workflow:

```text
Invoice Upload
      ↓
AI Analysis
      ↓
Embedding Generation
      ↓
Template Similarity Detection
      ↓
Fraud Risk Assessment
      ↓
Matched Invoice Identification
      ↓
Explainable Result
      ↓
Investigator Review
```

---

## DocTrace AI

### Detect the template. Trace the pattern. Assist the investigation.
```

### After you paste it

Your root should now look like:

```text
DocTrace_AI/
│
├── README.md          ← human-facing project overview
├── AGENTS.md          ← AI coding-agent instructions
├── .gitignore
│
├── ai-service/
├── backend/
├── frontend/
├── dataset/
│   ├── raw/
│   ├── generated/
│   └── metadata/
├── ml-training/
│
└── docs/
    ├── architecture.md
    ├── api-contract.md
    └── development-workflow.md
```

**Don't write `architecture.md`, `api-contract.md`, and `development-workflow.md` yet unless you need them.** Since we're setting up the repository incrementally, I'd commit `README.md` + `AGENTS.md` now, then create those three docs when the corresponding development work begins. That keeps the repo clean and avoids creating documentation that immediately becomes outdated.