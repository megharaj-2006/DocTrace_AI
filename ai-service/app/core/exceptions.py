"""Application exceptions and FastAPI exception handlers."""

from typing import Any, Dict
from fastapi import Request, status
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)


class AIServiceException(Exception):
    """Base exception for AI Microservice errors."""

    def __init__(self, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class InvalidInputException(AIServiceException):
    """Raised when request input validation fails."""

    def __init__(self, message: str):
        super().__init__(message=message, status_code=status.HTTP_400_BAD_REQUEST)


class ProcessingException(AIServiceException):
    """Raised when document processing fails."""

    def __init__(self, message: str):
        super().__init__(message=message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


async def ai_service_exception_handler(request: Request, exc: AIServiceException) -> JSONResponse:
    """FastAPI exception handler for AIServiceException."""
    logger.warning("AI Service error [%s]: %s", exc.status_code, exc.message)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message},
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """FastAPI exception handler for unhandled internal exceptions."""
    logger.error("Unhandled exception processing request: %s", str(exc), exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal processing error occurred."},
    )
