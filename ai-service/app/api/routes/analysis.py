"""Invoice template similarity analysis router (POST /api/v1/analyze)."""

from fastapi import APIRouter, File, Form, UploadFile, Depends
from app.schemas.analysis import AnalysisResponse
from app.services.analysis_service import AnalysisService

router = APIRouter(prefix="/api/v1", tags=["Analysis"])


def get_analysis_service() -> AnalysisService:
    """Dependency injector for AnalysisService."""
    return AnalysisService()


@router.post("/analyze", response_model=AnalysisResponse)
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
