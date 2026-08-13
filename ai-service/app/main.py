"""FastAPI application entrypoint for DocTrace AI Microservice."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.api.routes import health, analysis
from app.core.config import settings
from app.core.exceptions import (
    AIServiceException,
    ai_service_exception_handler,
    generic_exception_handler,
)
from app.core.logging import logger, setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan setup and teardown."""
    import time
    from app.models.dinov2_manager import DINOv2Manager
    from app.document_processing.layout_detector import LayoutDetector
    from app.document_processing.ocr_service import OCRService

    app.state.is_warmed_up = False
    setup_logging()
    logger.info(
        "Starting %s [env=%s, host=%s, port=%s]",
        settings.SERVICE_NAME,
        settings.APP_ENV,
        settings.HOST,
        settings.PORT,
    )

    warmup_start = time.time()
    logger.info("Initiating sequential application-scoped model warmup...")

    warmed_ok = True

    # 1. Warm up DINOv2Manager
    try:
        t0 = time.time()
        DINOv2Manager.get_instance()
        logger.info("DINOv2Manager warmup completed in %.2f ms.", (time.time() - t0) * 1000)
    except Exception as err:
        warmed_ok = False
        logger.error("DINOv2Manager warmup error: %s", str(err), exc_info=True)

    # 2. Warm up LayoutDetector
    try:
        t0 = time.time()
        LayoutDetector.get_instance()._ensure_engine_loaded()
        logger.info("LayoutDetector warmup completed in %.2f ms.", (time.time() - t0) * 1000)
    except Exception as err:
        warmed_ok = False
        logger.error("LayoutDetector warmup error: %s", str(err), exc_info=True)

    # 3. Warm up OCRService
    try:
        t0 = time.time()
        OCRService.get_instance()._ensure_engine_loaded()
        logger.info("OCRService warmup completed in %.2f ms.", (time.time() - t0) * 1000)
    except Exception as err:
        warmed_ok = False
        logger.error("OCRService warmup error: %s", str(err), exc_info=True)

    app.state.is_warmed_up = warmed_ok
    logger.info("Sequential model startup warmup completed in %.2f s (ready=%s).", time.time() - warmup_start, warmed_ok)
    yield
    logger.info("Shutting down %s", settings.SERVICE_NAME)



def create_app() -> FastAPI:
    """Factory creating and configuring the FastAPI application instance."""
    app = FastAPI(
        title="DocTrace AI Microservice",
        description="AI-powered medical invoice template similarity and fraud risk assessment service",
        version="0.1.0",
        lifespan=lifespan,
    )

    # Register Routers
    app.include_router(health.router)
    app.include_router(analysis.router)

    # Register Exception Handlers
    app.add_exception_handler(AIServiceException, ai_service_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.APP_ENV == "development",
    )
