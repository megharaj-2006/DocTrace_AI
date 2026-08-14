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
    SIMILARITY_THRESHOLD: float = 0.955


settings = Settings()

