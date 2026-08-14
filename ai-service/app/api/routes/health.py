from fastapi import APIRouter, Request, Response, status
from app.core.config import settings
from app.schemas.common import HealthResponse, ReadinessResponse
from app.vector_store.mock import MockVectorStore
from app.vector_store.qdrant import QdrantVectorStore

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    """Check service process liveness."""
    return HealthResponse(
        status="ok",
        service=settings.SERVICE_NAME,
    )


@router.get("/readiness", response_model=ReadinessResponse)
async def get_readiness(request: Request, response: Response) -> ReadinessResponse:
    """Check service readiness for processing analysis requests."""
    is_warmed_up = getattr(request.app.state, "is_warmed_up", False)

    # Lightweight vector store liveness check
    try:
        store = QdrantVectorStore()
        vector_store_healthy = await store.is_healthy()
    except Exception:
        vector_store_healthy = False

    is_ready = is_warmed_up and vector_store_healthy

    details = {
        "model_warmup_completed": is_warmed_up,
        "vector_store_healthy": vector_store_healthy,
    }

    if is_ready:
        response.status_code = status.HTTP_200_OK
        return ReadinessResponse(
            status="ready",
            service=settings.SERVICE_NAME,
            details=details,
        )
    else:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return ReadinessResponse(
            status="not_ready",
            service=settings.SERVICE_NAME,
            details=details,
        )

