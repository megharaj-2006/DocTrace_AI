"""Common Pydantic response models."""

from typing import Any, Dict, Optional
from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Health endpoint response schema."""

    status: str
    service: str


class ReadinessResponse(BaseModel):
    """Readiness endpoint response schema."""

    status: str
    service: str
    details: Optional[Dict[str, Any]] = None

