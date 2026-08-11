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
    setup_logging()
    logger.info(
        "Starting %s [env=%s, host=%s, port=%s]",
        settings.SERVICE_NAME,
        settings.APP_ENV,
        settings.HOST,
        settings.PORT,
    )
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
