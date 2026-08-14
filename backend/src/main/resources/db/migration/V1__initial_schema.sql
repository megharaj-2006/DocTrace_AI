-- ==============================================================================
-- DocTrace AI Backend — V1 Initial Database Schema
-- ==============================================================================

-- 1. Users
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(20) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_users_email ON users(email);

-- 2. Providers
CREATE TABLE providers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE,
    address VARCHAR(500),
    phone VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_providers_name ON providers(name);

-- 3. Invoices
CREATE TABLE invoices (
    id BIGSERIAL PRIMARY KEY,
    document_id VARCHAR(50) NOT NULL UNIQUE,
    uploaded_by_id BIGINT NOT NULL REFERENCES users(id),
    provider_id BIGINT REFERENCES providers(id),
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255),
    file_path VARCHAR(500),
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    invoice_number VARCHAR(100),
    invoice_date DATE,
    amount NUMERIC(12, 2),
    patient_name VARCHAR(255),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_invoices_document_id ON invoices(document_id);
CREATE INDEX idx_invoices_uploaded_by ON invoices(uploaded_by_id);
CREATE INDEX idx_invoices_provider ON invoices(provider_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- 4. Analysis Results
CREATE TABLE analysis_results (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL REFERENCES invoices(id),
    fraud_score DOUBLE PRECISION NOT NULL,
    risk_level VARCHAR(10) NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    reasons TEXT,
    error_message VARCHAR(1000),
    analyzed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_analysis_results_invoice ON analysis_results(invoice_id);
CREATE INDEX idx_analysis_results_risk_level ON analysis_results(risk_level);

-- 5. Similar Documents
CREATE TABLE similar_documents (
    id BIGSERIAL PRIMARY KEY,
    analysis_result_id BIGINT NOT NULL REFERENCES analysis_results(id) ON DELETE CASCADE,
    matched_document_id VARCHAR(50) NOT NULL,
    matched_invoice_id BIGINT REFERENCES invoices(id),
    similarity DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_similar_documents_analysis ON similar_documents(analysis_result_id);
CREATE INDEX idx_similar_documents_matched ON similar_documents(matched_document_id);

-- 6. Fraud Alerts
CREATE TABLE fraud_alerts (
    id BIGSERIAL PRIMARY KEY,
    analysis_result_id BIGINT NOT NULL REFERENCES analysis_results(id),
    invoice_id BIGINT NOT NULL REFERENCES invoices(id),
    assigned_to_id BIGINT REFERENCES users(id),
    status VARCHAR(20) NOT NULL,
    risk_level VARCHAR(10) NOT NULL,
    resolution_notes VARCHAR(2000),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX idx_fraud_alerts_risk_level ON fraud_alerts(risk_level);
CREATE INDEX idx_fraud_alerts_invoice ON fraud_alerts(invoice_id);
CREATE INDEX idx_fraud_alerts_assigned_to ON fraud_alerts(assigned_to_id);

-- 7. Audit Logs
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(50),
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
