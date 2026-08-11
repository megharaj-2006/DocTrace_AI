"""Health check endpoint router."""

from fastapi import APIRouter
from app.core.config import settings
from app.schemas.common import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    """Check service operational health."""
    return HealthResponse(
        status="ok",
        service=settings.SERVICE_NAME,
    )
