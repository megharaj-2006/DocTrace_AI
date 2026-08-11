"""Common Pydantic response models."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Health endpoint response schema."""

    status: str
    service: str
