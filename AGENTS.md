# DocTrace AI — Agent Instructions

> IMPORTANT: Read this file completely before making any changes to the repository.
> This file defines the project's current architecture, scope, module boundaries,
> development rules, and team responsibilities.
>
> When working on this repository, preserve these decisions unless the user
> explicitly instructs you to change them.

---

# 1. PROJECT IDENTITY

## Project Name

DocTrace AI

## Project Type

SIH 2026 — Software Project

## Problem Statement

The project addresses fraud detection in medical reimbursement claims by
identifying medical invoice documents that appear to reuse or imitate the
same underlying document template despite modifications to their textual or
visual content.

Fraudulent users may take an existing invoice/document template and modify:

- Patient information
- Provider/hospital name
- Provider logo
- Invoice number
- Dates
- Amounts
- Treatment information
- Colors
- Text positioning
- Other visual/content elements

The system should identify suspicious template similarities and provide
investigators with similarity scores, risk levels, matched documents, and
explanations.

---

# 2. CURRENT PROJECT SCOPE

## CURRENT SCOPE: MEDICAL INVOICES ONLY

The current implementation is strictly limited to:

> Medical invoices / medical bills.

Do NOT implement prescriptions or laboratory reports at this stage.

Prescriptions and laboratory reports are future extensions and may be added
later.

Do not expand the current scope unless the user explicitly asks for it.

---

# 3. PRIMARY OBJECTIVE

The primary objective is NOT to simply compare two invoice images using
pixel-level image similarity.

The system should attempt to identify whether documents share a common
underlying template or structural design despite changes in their content.

The important distinction is:

    Similar text/content != necessarily same template

    Similar visual/template structure = important signal

The system should ultimately support:

1. Invoice upload
2. Document preprocessing
3. Document representation/embedding generation
4. Template similarity analysis
5. Comparison with existing invoice representations
6. Similarity scoring
7. Fraud/suspicion scoring
8. Risk classification
9. Explanation of suspicious similarity
10. Investigator review

---

# 4. HIGH-LEVEL SYSTEM ARCHITECTURE

The system consists of five major technical components:

    React Frontend
          |
          | REST API
          v
    Spring Boot Backend
          |
          +--------------------+
          |                    |
          v                    v
    PostgreSQL          Python AI Microservice
                              |
                              v
                         ML Model
                              |
                              v
                      Embeddings / Similarity
                      / Fraud Analysis

The Spring Boot backend is the central application backend.

The frontend MUST NOT directly communicate with the AI microservice.

The expected communication flow is:

    Frontend
       |
       v
    Spring Boot
       |
       v
    AI Microservice
       |
       v
    ML Model
       |
       v
    AI Microservice
       |
       v
    Spring Boot
       |
       v
    Frontend

---

# 5. COMPONENT RESPONSIBILITIES

## 5.1 FRONTEND

Technology:

- React
- JavaScript/TypeScript as selected by the frontend team
- Existing project frontend stack should be respected

Responsibilities:

- Authentication UI
- Invoice upload
- Invoice listing
- Invoice details
- Analysis status
- Fraud/similarity results
- Similar document visualization
- Investigator dashboard
- Fraud alert management
- Search/filtering
- Charts/statistics
- Responsive UI

The frontend communicates ONLY with the Spring Boot backend.

Do not create direct frontend → AI-service calls.

---

# 5.2 SPRING BOOT BACKEND

Technology:

- Java
- Spring Boot
- Spring Data JPA
- PostgreSQL
- Spring Security/JWT
- Maven

Responsibilities:

- Authentication
- Authorization
- User management
- Invoice metadata management
- Invoice upload handling
- File storage coordination
- Database persistence
- AI-service communication
- Analysis result persistence
- Fraud-alert persistence
- Similar-document persistence
- Dashboard APIs
- Provider management
- Search/filter APIs
- Investigator workflow
- Audit logging
- API documentation

The backend acts as the gateway between frontend and AI service.

The backend should NOT implement ML logic.

Do not implement embedding generation, cosine similarity, OCR/model inference,
or ML training in Spring Boot.

---

# 5.3 AI MICROSERVICE

Technology:

- Python
- FastAPI
- PyTorch / required ML libraries
- Pillow/OpenCV where necessary
- OCR/document-processing libraries where required

Responsibilities:

- Receive invoice images from Spring Boot
- Validate/preprocess invoice images
- Perform required OCR/layout/document preprocessing
- Load the trained ML model
- Generate document embeddings
- Compare document embeddings
- Calculate similarity
- Generate fraud/suspicion score
- Determine risk level according to the agreed model/service logic
- Identify similar documents
- Generate an explanation/reason for the result
- Return structured JSON to Spring Boot

The AI microservice is an INFERENCE service.

It is not responsible for:

- User authentication
- Application user management
- PostgreSQL business entities
- Frontend
- Spring Boot APIs
- ML training pipeline

---

# 5.4 DATASET GENERATION

Dataset generation is a separate responsibility from ML model training.

The dataset-generation workflow is:

    Raw invoice images
          |
          v
    Template classification
          |
          v
    Synthetic variations
          |
          v
    Metadata
          |
          v
    Positive/negative pairs
          |
          v
    Train/validation/test splits

Raw documents must remain untouched.

Synthetic documents must be stored separately from raw documents.

---

# 5.5 ML MODEL TRAINING

ML training is separate from AI-service implementation.

The ML training workflow is approximately:

    Dataset
       |
       v
    Pretrained model
       |
       v
    Baseline embedding generation
       |
       v
    Cosine similarity evaluation
       |
       v
    Fine-tuning / metric learning if necessary
       |
       v
    Validation
       |
       v
    Threshold selection
       |
       v
    Final test evaluation
       |
       v
    Trained model
       |
       v
    AI Microservice

Do NOT assume that a model must be trained from scratch.

The project should prefer transfer learning/fine-tuning of a suitable
pretrained model because of the limited dataset and development timeline.

---

# 6. TEAM OWNERSHIP

There are six team members.

## Member 1 + Member 2

Responsibilities:

- Frontend
- Raw invoice data collection
- Presentation/PPT

They collect and organize original invoice images.

They do NOT train the ML model.

They do NOT build the AI microservice.

---

## Member 3 — AI Microservice

The user is Member 3.

Responsibilities:

- Python AI microservice
- FastAPI
- Invoice preprocessing
- OCR/layout processing as required
- Model loading
- Embedding generation
- Similarity calculation
- Fraud scoring
- Risk classification
- Explanation generation
- AI-service REST API
- Dockerization/deployment of AI service if required

---

## Member 4 — Dataset Generation Engineer

Responsibilities:

- Raw dataset organization
- Template family organization
- Synthetic invoice generation
- Metadata
- Positive/negative pair generation
- Train/validation/test dataset preparation
- Dataset-generation scripts
- Dataset documentation

Member 4 does NOT train the ML model.

---

## Member 5 — ML Training Engineer

Responsibilities:

- Model selection
- Baseline experiments
- Embedding generation experiments
- Model training/fine-tuning
- Metric learning if appropriate
- Validation
- Threshold selection
- Test evaluation
- Model export
- Inference reference implementation
- Model documentation

Member 5 does NOT build FastAPI.

---

## Member 6 — Backend Engineer

Responsibilities:

- Spring Boot
- PostgreSQL
- Authentication
- Invoice APIs
- Analysis APIs
- Fraud-alert APIs
- Dashboard APIs
- Provider APIs
- AI-service integration
- Database persistence
- API documentation
- Backend testing

Member 6 does NOT implement ML logic.

---

# 7. REPOSITORY STRUCTURE

The expected repository structure is:

    DocTrace_AI/
    |
    ├── README.md
    ├── AGENTS.md
    ├── .gitignore
    |
    ├── ai-service/
    |
    ├── backend/
    |
    ├── frontend/
    |
    ├── dataset/
    |   ├── raw/
    |   ├── generated/
    |   └── metadata/
    |
    ├── ml-training/
    |
    └── docs/
        ├── architecture.md
        ├── api-contract.md
        └── development-workflow.md

Do not reorganize the repository unnecessarily.

If a new directory is needed, first determine whether it belongs inside
an existing module.

---

# 8. DATASET STRUCTURE

The dataset should follow:

    dataset/
    |
    ├── raw/
    |   └── original/
    |       ├── template_001/
    |       ├── template_002/
    |       ├── template_003/
    |       └── unclassified/
    |
    ├── generated/
    |   ├── template_001/
    |   ├── template_002/
    |   └── ...
    |
    └── metadata/
        ├── raw_documents.csv
        ├── documents.csv
        ├── pairs.csv
        ├── train.csv
        ├── validation.csv
        └── test.csv

Important:

- raw documents must not be modified
- generated documents must remain separate
- metadata must remain reproducible
- dataset-generation scripts should be preserved
- do not silently change dataset labels

---

# 9. DATASET LABELING

A template family is identified using a template ID.

Example:

    T001
    T002
    T003

Documents belonging to T001 are considered members of the same underlying
template family unless explicitly reclassified.

Positive pair:

    same template_id -> label 1

Negative pair:

    different template_id -> label 0

Synthetic documents generated from T001 remain associated with T001.

Do not invent labels without evidence.

---

# 10. ML MODEL PRINCIPLES

The ML system is expected to work with document embeddings.

Conceptually:

    Invoice Image
          |
          v
    Pretrained/Fine-tuned Model
          |
          v
    Embedding Vector
          |
          v
    Cosine Similarity
          |
          v
    Similarity Score

A Siamese/metric-learning approach may be used if appropriate.

Do not assume that a particular architecture is mandatory unless the ML
engineer has validated it.

Potential model families may include suitable pretrained vision/document
models.

The model selection must be evidence-driven.

---

# 11. IMPORTANT DISTINCTION: TRAINING VS INFERENCE

Training:

    Dataset
      ↓
    Model training/fine-tuning
      ↓
    Model artifact

Inference:

    New invoice
      ↓
    Trained model
      ↓
    Embedding
      ↓
    Similarity
      ↓
    Result

Training happens inside `ml-training/`.

Inference happens inside `ai-service/`.

Do NOT mix the two.

The AI service should NOT execute the entire training pipeline every time
an invoice is uploaded.

---

# 12. AI SERVICE CONTRACT

The AI service should expose a clear REST interface.

The target analysis endpoint is:

    POST /api/v1/analyze

Expected input:

    multipart/form-data

    file = invoice image
    documentId = application document ID

Expected response structure:

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

This is the current target contract.

If the actual ML implementation requires changes, update
`docs/api-contract.md` and coordinate with the backend engineer before
changing the interface.

Do not silently change API response fields after integration has begun.

---

# 13. BACKEND API PRINCIPLES

The backend is the public application API.

Expected major API groups:

    /api/v1/auth
    /api/v1/users
    /api/v1/invoices
    /api/v1/alerts
    /api/v1/dashboard
    /api/v1/providers
    /api/v1/admin

The frontend communicates with these APIs.

The backend communicates with:

    /api/v1/analyze

on the AI service.

Exact API details are maintained in:

    docs/api-contract.md

Always check that file before modifying an API.

---

# 14. DATABASE PRINCIPLES

PostgreSQL is the primary application database.

Expected major entities include:

    User
    Provider
    Invoice
    AnalysisResult
    SimilarDocument
    FraudAlert
    AuditLog

Do not store large invoice binaries directly in PostgreSQL unless there is
a specific reason.

Prefer file/object storage and store the corresponding file URL/path in the
database.

---

# 15. FRAUD SCORE IS NOT PROOF OF FRAUD

This is a critical product principle.

The system detects:

    suspicious similarity
    potential fraud
    template reuse

It does NOT automatically prove that a claim is fraudulent.

The investigator remains responsible for the final decision.

Therefore UI/API terminology should prefer:

- Fraud risk
- Suspicion score
- Similarity
- Potential fraud
- Suspicious document

Avoid claiming:

    "This invoice is definitely fraudulent."

unless the investigator has explicitly confirmed it.

---

# 16. RISK LEVELS

The current conceptual classification is:

    LOW
    AMBER
    RED

The exact threshold values must come from the ML evaluation/validation
process.

Do NOT hardcode arbitrary thresholds such as:

    > 0.8 = fraud

unless the ML engineer has experimentally established and documented them.

The threshold must be treated as a model/inference configuration.

---

# 17. EXPLANATIONS

The system should provide understandable reasons for suspicious results.

Examples:

- High template similarity
- Header structure closely matches
- Invoice table structure closely matches
- Similar provider/logo placement
- Similar document layout
- Multiple documents share a highly similar template

Do not fabricate explanations that the model does not support.

If the system cannot confidently determine a detailed explanation, return a
more general explanation rather than inventing one.

---

# 18. SECURITY RULES

Never commit:

- passwords
- API keys
- JWT secrets
- database passwords
- cloud credentials
- private tokens
- `.env` files
- private certificates

Use environment variables.

Never hardcode credentials in source code.

Never expose secrets in logs.

---

# 19. FILE UPLOAD SECURITY

Uploaded files must be validated.

At minimum validate:

- file type
- MIME type
- extension
- file size

Do not trust the filename alone.

The backend should reject unsupported file types.

The current intended document type is medical invoice.

---

# 20. AUTHENTICATION

The backend should use secure authentication.

Expected approach:

    JWT authentication
    +
    Password hashing
    +
    Role-based authorization

Expected roles:

    USER
    INVESTIGATOR
    ADMIN

Do not store plaintext passwords.

Do not expose sensitive user information unnecessarily.

---

# 21. GIT WORKFLOW

The repository uses:

    main
    develop
    feature branches

`main` represents a stable/demo-ready state.

`develop` is the integration branch.

Feature branches are used for individual workstreams.

Expected branches:

    feature/frontend
    feature/ai-service
    feature/dataset
    feature/ml-training
    feature/backend

Do NOT directly develop on `main`.

Do NOT force-push shared branches unless explicitly required.

Use meaningful commits.

Examples:

    Initialize backend structure
    Implement invoice upload API
    Add AI service client
    Implement similarity result persistence

Avoid meaningless commits such as:

    update
    changes
    final
    test
    stuff

---

# 22. PULL REQUESTS

Major completed work should be merged through Pull Requests.

Expected flow:

    feature branch
          ↓
       Pull Request
          ↓
       develop
          ↓
      integration
          ↓
        main

Do not merge unfinished experimental code into `main`.

---

# 23. AGENT DEVELOPMENT RULES

When an AI coding agent is asked to modify this repository:

## Before coding

1. Read `AGENTS.md`.
2. Read the relevant module's existing files.
3. Read `docs/architecture.md`.
4. Read `docs/api-contract.md` if APIs are involved.
5. Inspect the existing implementation before creating new files.
6. Determine whether the requested feature already partially exists.

Do not immediately rewrite existing code.

---

# 24. PRESERVE EXISTING WORK

Never replace functioning code merely because another implementation looks
cleaner.

Before refactoring:

1. Understand the current implementation.
2. Determine why the existing implementation exists.
3. Check dependencies.
4. Check whether another team member is working on it.
5. Make the smallest change necessary.

Prefer incremental changes over large rewrites.

---

# 25. DO NOT CROSS MODULE BOUNDARIES WITHOUT REASON

Examples:

Do not put ML training code inside `backend/`.

Do not put Spring Boot business logic inside `ai-service/`.

Do not put frontend logic inside `backend/`.

Do not put dataset generation scripts inside `ml-training/`.

Do not make frontend directly call the AI service.

Respect module ownership.

---

# 26. DO NOT INVENT REQUIREMENTS

If the user asks for a feature that is not clearly defined:

1. Inspect the existing architecture.
2. Check relevant documentation.
3. Infer only what is necessary.
4. If the ambiguity materially affects architecture or data models,
   ask for clarification instead of inventing a major design.

Do not introduce unnecessary features simply because they are technically
interesting.

---

# 27. DO NOT OVERENGINEER

This project has a strict hackathon timeline.

Prefer:

    simple
    reliable
    demonstrable
    maintainable

over:

    unnecessarily complex
    enterprise-scale
    premature optimization

Do not introduce microservices, message queues, event buses, caching layers,
Kubernetes, complex distributed systems, or other infrastructure unless
there is a concrete project requirement.

The AI microservice is already an intentional separate service.

---

# 28. CURRENT DEVELOPMENT PRIORITY

The priority order is:

1. End-to-end working system
2. AI similarity detection
3. Reliable dataset
4. Backend/AI integration
5. Frontend integration
6. Investigator workflow
7. Evaluation metrics
8. Visual polish
9. Additional optimizations

A feature that does not improve the core demonstration should have lower
priority during the hackathon.

---

# 29. END-TO-END USER FLOW

The primary working flow should eventually be:

    User logs in
         ↓
    Upload medical invoice
         ↓
    Backend stores invoice
         ↓
    User/investigator starts analysis
         ↓
    Backend sends invoice to AI service
         ↓
    AI service preprocesses invoice
         ↓
    AI service generates embedding
         ↓
    AI service compares against existing documents
         ↓
    Similarity scores generated
         ↓
    Fraud/suspicion score generated
         ↓
    Risk level determined
         ↓
    Explanation generated
         ↓
    Backend stores result
         ↓
    Frontend displays result
         ↓
    Investigator examines matched documents
         ↓
    Investigator reviews/resolves/dismisses alert

This is the primary end-to-end success criterion.

---

# 30. DEMO PRIORITY

The final SIH demonstration should be able to clearly show:

1. Upload invoice
2. Analyze invoice
3. AI processing
4. Similar invoice detection
5. Similarity score
6. Risk classification
7. Explanation
8. Display of matched invoice
9. Investigator review
10. Dashboard statistics

The system should make this workflow reliable before implementing secondary
features.

---

# 31. TESTING REQUIREMENTS

All modules should have appropriate testing.

Backend:

- Controller tests
- Service tests
- Repository/integration tests where useful
- AI-service integration tests

AI service:

- Input validation tests
- Model loading test
- Inference test
- Similarity calculation test
- API response test

Dataset:

- Metadata validation
- Missing-file detection
- Label consistency
- Train/validation/test split validation

ML:

- Baseline evaluation
- Validation metrics
- Final test metrics
- Similarity distribution analysis

Frontend:

- Upload flow
- Authentication
- Result rendering
- Dashboard rendering
- Error states

---

# 32. DOCUMENTATION RULES

Documentation should be maintained when architecture or interfaces change.

Important documents:

    README.md
        Project overview for humans

    AGENTS.md
        Persistent instructions and architecture constraints for coding agents

    docs/architecture.md
        Technical system architecture

    docs/api-contract.md
        Frontend/backend/AI API contracts

    docs/development-workflow.md
        Git/team development workflow

Do not create duplicate documentation containing conflicting information.

When a technical decision changes, update the relevant canonical document.

---

# 33. MODEL ARTIFACTS

Large ML model files should NOT automatically be committed to normal Git
history.

If a trained model is too large:

- use appropriate model/artifact storage
- document its location
- provide a reproducible download/load process

Do not commit huge binaries simply because the application needs them.

---

# 34. DATASET LICENSING AND PRIVACY

The dataset should preferably consist of:

- public datasets
- publicly available sample invoices
- synthetic invoices
- legally usable documents

Avoid committing private medical information.

Do not intentionally collect identifiable real patient medical records.

If a document contains sensitive information, it should be anonymized or
excluded.

Track source information where possible.

---

# 35. WHEN MODIFYING API CONTRACTS

If an API needs to change:

1. Update `docs/api-contract.md`.
2. Check both caller and receiver.
3. Notify/coordinate with the relevant team member.
4. Update tests.
5. Update frontend integration if applicable.

Never silently change a shared API response.

---

# 36. WHEN MODIFYING DATABASE SCHEMA

Use migrations for schema changes.

Do not manually alter production/database structure without recording the
change.

If Flyway is configured in the project, use Flyway migrations.

Example:

    db/migration/
        V1__initial_schema.sql
        V2__add_analysis_results.sql

Do not edit an already-applied migration merely to change its behavior.

Create a new migration.

---

# 37. LOGGING

Logs should help diagnose failures without exposing secrets.

Useful information:

- request/operation ID
- invoice ID
- analysis ID
- processing status
- AI-service response status
- processing time

Do NOT log:

- passwords
- JWT tokens
- API keys
- sensitive medical information unnecessarily

---

# 38. PERFORMANCE PRINCIPLES

Do not prematurely optimize.

However:

- avoid loading entire datasets unnecessarily
- avoid repeated model loading per request
- load the ML model once when the AI service starts
- avoid storing duplicate files unnecessarily
- use pagination for large database queries
- avoid returning huge payloads from APIs

The ML model should normally remain loaded in memory within the AI service.

---

# 39. ERROR HANDLING BETWEEN SERVICES

If Spring Boot cannot reach the AI service:

    AI_SERVICE_UNAVAILABLE

should be returned/handled appropriately.

If AI processing fails:

    PROCESSING
        ↓
    FAILED

The frontend should receive a meaningful status rather than hanging
indefinitely.

Do not expose Python stack traces or internal exceptions to end users.

---

# 40. IMPORTANT ARCHITECTURAL PRINCIPLE

The system is NOT:

    React
       ↓
    ML model

It is:

    React
       ↓
    Spring Boot
       ↓
    AI Microservice
       ↓
    ML model

Spring Boot is the application gateway.

AI service is the ML inference engine.

ML training is a separate development pipeline.

---

# 41. AGENT BEHAVIOR

When implementing a task, the coding agent should:

1. Understand the requested outcome.
2. Inspect the current code.
3. Identify the smallest set of files that need modification.
4. Implement the change.
5. Run relevant tests/build commands.
6. Fix errors caused by the implementation.
7. Avoid unrelated refactoring.
8. Report what changed.
9. Report tests performed.
10. Report any unresolved limitations.

Do not claim a feature works without actually verifying it where verification
is possible.

---

# 42. IF A REQUEST CONFLICTS WITH THIS FILE

Priority order:

1. Explicit current user instruction
2. Existing verified project requirements
3. `AGENTS.md`
4. `docs/architecture.md`
5. Other documentation
6. Existing implementation assumptions

If the user explicitly changes an architectural decision, update the relevant
documentation so that future work follows the new decision.

---

# 43. FINAL PRINCIPLE

The goal is not to build the most sophisticated AI system possible.

The goal is to build a:

    credible
    technically sound
    demonstrable
    end-to-end
    medical invoice template similarity and fraud detection system

within the SIH development timeline.

Prefer a smaller feature that works reliably over a larger feature that is
unfinished.

Always preserve the separation:

    Dataset Generation
            ↓
       ML Training
            ↓
      AI Inference
            ↓
     Spring Boot Backend
            ↓
         Frontend