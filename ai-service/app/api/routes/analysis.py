"""Invoice template similarity analysis router (POST /api/v1/analyze)."""

from fastapi import APIRouter, File, Form, UploadFile, Depends, Header, HTTPException, status
from app.core.config import settings
from app.schemas.analysis import AnalysisResponse
from app.services.analysis_service import AnalysisService

router = APIRouter(prefix="/api/v1", tags=["Analysis"])


async def verify_internal_api_key(x_internal_api_key: str = Header(None, alias="X-Internal-API-Key")):
    """Validate internal service-to-service secret header."""
    if settings.APP_ENV == "production" and (
        not settings.INTERNAL_API_KEY or settings.INTERNAL_API_KEY == "dev-internal-secret-key-12345"
    ):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Production internal API key is unconfigured.",
        )

    if x_internal_api_key != settings.INTERNAL_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Internal-API-Key header",
        )


def get_analysis_service() -> AnalysisService:
    """Dependency injector for AnalysisService."""
    return AnalysisService()


@router.post("/analyze", response_model=AnalysisResponse, dependencies=[Depends(verify_internal_api_key)])
async def analyze_invoice(
    file: UploadFile = File(...),
    documentId: str = Form(...),
    service: AnalysisService = Depends(get_analysis_service),
) -> AnalysisResponse:
    """Analyze uploaded invoice for template similarity and potential fraud risk.
    
    Accepts multipart/form-data with `file` and `documentId`.
    Returns structured analysis JSON adhering to frozen backend contract.
    """
    return await service.analyze_document(file=file, document_id=documentId)

