"""Type-safe application configuration using pydantic-settings."""

from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables and defaults."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_ENV: str = "development"
    SERVICE_NAME: str = "doctrace-ai-service"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    LOG_LEVEL: str = "INFO"
    TEMP_DIR: Optional[str] = None
    INTERNAL_API_KEY: str = "dev-internal-secret-key-12345"

    # Phase 2A Vector Intelligence Configuration
    EMBEDDING_DEVICE: str = "auto"  # "auto", "cpu", or "cuda"
    EMBEDDING_MODEL: str = "facebook/dinov2-base"
    EMBEDDING_VERSION: str = "dinov2-base-cls-v1"
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_URL: Optional[str] = None
    QDRANT_API_KEY: Optional[str] = None
    QDRANT_COLLECTION: str = "invoice_page_embeddings_v1"
    VECTOR_STORE_BACKEND: str = "mock"
    SIMILARITY_THRESHOLD: float = 0.955

    # Multi-Signal AI Service Configuration
    RELEVANCE_MIN_TEXT_CHARS: int = 15
    RELEVANCE_MIN_CONFIDENCE: float = 0.50
    STRUCTURAL_EMBEDDING_DIM: int = 128
    STRUCTURAL_COLLECTION: str = "invoice_page_structural_embeddings_v1"
    STRUCTURAL_MODEL_VERSION: str = "structural-layout-v1"
    TEMPLATE_VERSION: str = "template-v1"
    TEMPLATE_FAMILY_THRESHOLD: float = 0.92
    STRUCTURAL_SIMILARITY_THRESHOLD: float = 0.85
    TOP_K_MATCHES: int = 5

    # Risk Scoring Weights and Thresholds
    RISK_WEIGHT_VISUAL: float = 0.50
    RISK_WEIGHT_STRUCTURAL: float = 0.35
    RISK_WEIGHT_CONTEXT: float = 0.15
    RISK_AMBER_THRESHOLD: float = 0.70
    RISK_RED_THRESHOLD: float = 0.88


settings = Settings()


