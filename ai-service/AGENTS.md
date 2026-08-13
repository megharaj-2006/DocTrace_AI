# AI Service — AGENTS.md

## 1. Purpose

This directory contains the Python + FastAPI AI microservice for the project.

The AI service is responsible for:

- Document preprocessing
- OCR / text extraction
- Layout detection
- Embedding generation
- Vector-store interaction
- Similarity search
- Fraud/risk scoring logic
- Explanation generation
- Exposing the AI analysis REST API

The AI service communicates with the Spring Boot backend through a defined HTTP/REST contract.

The AI service must remain independently deployable from the Spring Boot backend.

---

# 2. Instruction Hierarchy

Before making any change:

1. Read the root-level `README.md`.
2. Read the root-level `AGENTS.md`.
3. Read this `ai-service/AGENTS.md`.
4. Inspect the existing AI-service code before modifying it.
5. Follow the most specific applicable instruction.

The root-level project instructions are authoritative for project-wide conventions.

This file defines additional rules specific to the AI service.

Never contradict a root-level instruction.

Do not modify other project modules unless explicitly requested.

---

# 3. Git Workflow

The project uses protected/shared integration branches.

### Branch rules

Never work directly on:

- `main`
- `develop`

Each team member works on their own feature branch.

For the AI service, the preferred branch naming convention is:

`feature/member3-ai-service`

Before making code changes:

1. Inspect the current Git branch.
2. If already on the correct AI-service feature branch, continue.
3. If on `main` or `develop`, do NOT make project changes there.
4. Create or switch to the appropriate AI-service feature branch.
5. Never force-push.
6. Never rewrite shared branch history.
7. Never merge directly into `main` or `develop` unless explicitly instructed.

Expected workflow:

main
  ↓
develop
  ↓
feature/member3-ai-service
  ↓
Pull Request / inspection
  ↓
develop
  ↓
main

Do not commit unrelated files from other team members.

Keep commits focused and logically grouped.

Do not automatically push to remote repositories unless explicitly instructed by the user.

---

# 4. Development Philosophy

This service is being developed incrementally in defined phases.

Do not prematurely implement functionality belonging to later phases.

Before beginning a phase:

- Read the phase-specific instructions supplied by the user.
- Inspect the current implementation.
- Identify existing functionality.
- Preserve working functionality.
- Do not redesign existing architecture without approval.

When an architectural decision is required and it is not already explicitly defined:

STOP and ask the user before implementing it.

Do not silently choose:

- frameworks
- databases
- vector databases
- ML models
- communication protocols
- persistence strategies
- asynchronous processing systems
- message brokers
- authentication mechanisms
- major folder structures
- major architectural patterns

unless the decision has already been approved.

---

# 5. Current Approved Architecture

The AI service uses:

- Python 3.11
- FastAPI
- `uv` for dependency/environment management
- `pyproject.toml` as the dependency definition
- `uv.lock` for reproducible dependency resolution
- `requirements.txt` for compatibility/export purposes
- Docker for containerization

The service uses synchronous processing for the current MVP.

The concrete vector database has NOT yet been selected.

The AI service must therefore use a VectorStore abstraction rather than coupling the application directly to a specific vector database.

---

# 6. Dependency Management

Use:

- `uv`
- `pyproject.toml`
- `uv.lock`
- `requirements.txt`

`pyproject.toml` is the authoritative dependency definition.

`uv.lock` must be kept synchronized with the dependency configuration.

`requirements.txt` must not become a separately maintained dependency source.

Do not manually maintain conflicting dependency versions across multiple files.

When adding or removing dependencies:

1. Update the appropriate dependency configuration.
2. Regenerate/update the lock file using `uv`.
3. Regenerate/update `requirements.txt` when required.
4. Verify the environment after the change.

Do not install packages globally when project-local dependency management is appropriate.

---

# 7. Python Version

The project is standardized on:

Python 3.11

Do not change the Python major/minor version without explicit approval.

The Docker environment must use a compatible Python 3.11 base image.

---

# 8. AI Service API Contract

The backend-to-AI contract is currently frozen.

Endpoint:

`POST /api/v1/analyze`

Request:

`multipart/form-data`

Required fields:

- `file`
- `documentId`

The AI service must return the agreed response structure:

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

Do not change this external contract without explicit agreement with the user and the backend developer.

If a contract change appears necessary:

STOP and ask before implementing it.

Do not invent additional required request fields.

Do not silently rename response fields.

Maintain backwards compatibility when possible.

---

# 9. File Handling and Data Retention

The AI service must NEVER permanently store uploaded invoice files.

The lifecycle of an uploaded document is:

HTTP request
    ↓
Temporary file / temporary processing representation
    ↓
AI processing
    ↓
Result generation
    ↓
Temporary file cleanup
    ↓
HTTP response

Uploaded files must be deleted after processing.

Cleanup must occur even when processing fails.

Use reliable cleanup mechanisms such as `try/finally` or equivalent resource-management patterns.

Do not store invoice binaries in:

- PostgreSQL
- the Vector DB
- the AI-service repository
- permanent local directories
- Docker volumes intended for persistent storage

The AI service must not become the system of record for uploaded documents.

Permanent document storage belongs to the broader application/storage architecture.

---

# 10. Vector Store Boundary

The AI service owns the VectorStore integration.

However, the concrete vector database has NOT been selected yet.

Therefore:

DO:

- define a clean VectorStore abstraction
- define clear interfaces
- use dependency injection where appropriate
- create a mock/in-memory implementation for development and testing
- keep vector-store-specific code isolated

DO NOT:

- choose a concrete vector database without approval
- scatter vector-database-specific calls throughout the application
- couple business logic directly to a vendor SDK
- assume FAISS, Qdrant, pgvector, Chroma, Milvus, or another implementation without approval

The eventual concrete implementation should be replaceable without rewriting the analysis pipeline.

---

# 11. ML Model Boundary

The AI service consumes the model produced by the ML training engineer.

The model-training engineer (Member 5) is responsible for:

- dataset-based training
- fine-tuning
- model evaluation
- trained model artifact
- model architecture information
- preprocessing requirements
- embedding dimension
- inference code
- similarity method
- recommended similarity threshold
- evaluation metrics

The AI service is responsible for integrating that model into the runtime inference pipeline.

Do NOT:

- train a new model inside the AI service
- invent a model architecture
- modify the trained model without approval
- assume the embedding dimension
- assume preprocessing requirements
- assume the similarity threshold
- hard-code model-specific behavior before the model specification is available

Until the real model is handed over, use clearly isolated mock/stub implementations where necessary.

When the real model specification becomes available, integrate it behind an appropriate abstraction.

---

# 12. AI Pipeline Boundary

The intended runtime pipeline is:

Request
  ↓
File validation
  ↓
Temporary file
  ↓
Preprocessing
  ↓
OCR
  ↓
Layout detection
  ↓
Embedding generation
  ↓
Vector-store search
  ↓
Similarity analysis
  ↓
Risk/fraud analysis
  ↓
Explanation generation
  ↓
Response
  ↓
Temporary file cleanup

Keep each major responsibility modular.

Avoid putting the entire pipeline into a single FastAPI route function.

The API layer should orchestrate the service layer rather than contain business logic.

---

# 13. Fraud and Similarity Semantics

Similarity does NOT automatically mean confirmed fraud.

The ML model primarily provides a useful representation/embedding of invoice templates.

Similarity is one input into the application's risk/fraud analysis.

Do not implement:

`fraud = similarity`

unless explicitly approved.

Do not claim that a highly similar invoice is definitively fraudulent.

The response should distinguish between:

- similarity evidence
- risk assessment
- confidence
- explanation
- confirmed investigator decisions

The final fraud/investigation decision belongs to the broader application workflow, where investigators can review and resolve alerts.

---

# 14. API Layer Rules

FastAPI routes should be thin.

Routes should primarily handle:

- request parsing
- validation
- dependency injection
- calling application services
- response serialization
- appropriate HTTP errors

Routes should NOT contain:

- OCR implementation
- embedding algorithms
- vector database logic
- fraud scoring algorithms
- large business workflows

Keep domain/application logic in services.

---

# 15. Configuration

Configuration must come from environment/configuration mechanisms rather than hard-coded values.

Examples include:

- environment
- logging level
- model path
- vector-store configuration
- processing limits
- temporary directory
- allowed file types
- maximum file size
- service configuration

Never hard-code:

- API keys
- passwords
- tokens
- cloud credentials
- database credentials
- model-storage credentials
- vector-database credentials

Provide `.env.example` for documented configuration names.

Never commit `.env` or secrets.

---

# 16. Security

Treat uploaded documents as untrusted input.

Validate:

- file presence
- MIME type
- extension where appropriate
- file size
- file readability
- supported document format

Do not trust the filename alone.

Do not execute uploaded files.

Do not construct shell commands from user-controlled file names or paths.

Use safe temporary-file handling.

Prevent path traversal.

Do not expose internal stack traces or sensitive configuration in API responses.

---

# 17. Error Handling

Use consistent HTTP error handling.

The service should be able to distinguish appropriate failures such as:

- invalid request
- missing file
- unsupported file format
- oversized file
- invalid/corrupt document
- model failure
- vector-store failure
- internal processing failure

Do not expose raw Python exceptions to clients.

Log useful diagnostic information internally while keeping sensitive data out of logs.

---

# 18. Logging

Use structured, meaningful application logging.

Logs should help answer:

- What request was received?
- Which document was processed?
- Which stage failed?
- How long did processing take?
- Was the model available?
- Was the vector store available?
- Did cleanup succeed?

Do not log:

- passwords
- API keys
- access tokens
- secrets
- complete invoice contents
- unnecessary sensitive document data

Avoid excessive debug logging in production-oriented code.

---

# 19. Testing

Every significant component should be testable independently.

Use unit tests for:

- validation
- preprocessing
- service logic
- similarity logic
- risk scoring
- response construction
- vector-store abstraction

Use integration tests for:

- FastAPI endpoints
- request validation
- temporary-file lifecycle
- complete mocked analysis flow

Tests should not require the real ML model unless explicitly intended.

The service should be capable of testing the orchestration pipeline using mocks/stubs.

Do not reduce or remove tests merely to make implementation easier.

---

# 20. Docker

The AI service must be containerizable.

Docker configuration should:

- use Python 3.11
- install project dependencies reproducibly
- run the FastAPI service
- avoid storing uploaded documents permanently
- expose only the required service port
- support environment-based configuration

Do not bake secrets into the Docker image.

Use `.dockerignore`.

Keep the image reasonably minimal while preserving required ML/document-processing dependencies.

---

# 21. Documentation

Maintain an AI-service-specific `README.md`.

It should eventually document:

- purpose
- architecture
- setup
- Python version
- `uv` workflow
- environment variables
- local development
- Docker usage
- API endpoint
- request/response examples
- testing
- model integration
- vector-store integration
- known limitations

Do not document functionality that has not actually been implemented.

Keep documentation synchronized with the implementation.

---

# 22. Code Quality

Prefer:

- clear naming
- small focused functions
- explicit interfaces
- type hints
- Pydantic models for API schemas
- dependency injection where useful
- meaningful exceptions
- testable services
- separation of concerns

Avoid:

- giant route functions
- global mutable state
- hidden side effects
- duplicated business logic
- unnecessary abstractions
- premature optimization
- unnecessary dependencies

Do not introduce design patterns simply for the sake of using design patterns.

---

# 23. No Premature Architecture

Do not add technologies merely because they might be useful later.

Examples:

- Redis
- Kafka
- Celery
- RabbitMQ
- Kubernetes
- distributed task queues
- external workflow engines
- authentication systems inside the AI service
- persistent AI-service databases

These are not part of the currently approved architecture.

If future requirements genuinely require one of these technologies:

STOP and ask the user before introducing it.

---

# 24. Changes Outside This Directory

The AI service is one component of a larger team project.

Do not modify:

- Spring Boot backend
- React frontend
- PostgreSQL schema
- other team members' modules
- root project configuration

unless explicitly instructed.

If integration requires a change outside `ai-service/`, explain the required change and ask for approval rather than silently modifying another team's work.

---

# 25. Verification Before Completion

At the end of every implementation task:

1. Run the relevant tests.
2. Run lint/type/static checks if configured.
3. Verify the application starts.
4. Verify changed API endpoints.
5. Check for accidental secrets.
6. Check Git status.
7. Confirm no unrelated files were modified.
8. Review the final diff.
9. Report exactly what was implemented.
10. Report anything that remains mocked, deferred, or dependent on another team member.

Never claim a feature is complete merely because the code was written.

---

# 26. Phase-Based Development

The AI service will be developed in phases.

Current planned phases:

Phase 0 — Architecture + FastAPI Foundation

Phase 1 — Document Processing Pipeline

Phase 2 — Embedding + Vector Search

Phase 3 — Fraud/Risk Analysis

Phase 4 — Complete FastAPI Integration

Phase 5 — Testing + Optimization + Team Integration

Do not implement later-phase functionality unless explicitly instructed by the user.

When a phase is complete, stop and provide a verification-oriented summary.

The user will inspect and verify the implementation before the next phase begins.

---

# 27. Critical Rule

If an implementation decision is not explicitly defined by:

- the root project instructions,
- this AGENTS.md,
- an approved architecture decision,
- or the current phase instructions,

DO NOT GUESS.

Ask the user before making the architectural decision.

Correctness and maintainability are more important than speed.

The goal is a clean, modular, independently deployable AI microservice that integrates predictably with the Spring Boot backend and the ML model supplied by Member 5.
```

### One small addition I'd make

Because your **root `AGENTS.md` already exists**, don't copy the entire root document into this file. The local file should remain an **extension**, not a duplicate. The first section above explicitly tells Antigravity to read the root instructions first.

Also, the branch workflow is now unambiguous:

```text
main
  │
  ▼
develop
  │
  ├── feature/member3-ai-service   ← YOU
  ├── feature/member5-model        ← Member 5
  └── feature/member6-backend      ← Member 6
```

Your AI-service changes should live on **your feature branch**, then go through inspection before entering `develop`.

---

