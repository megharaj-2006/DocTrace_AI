"""Unit tests for Settings and Core configuration."""

from app.core.config import Settings


def test_default_settings():
    """Verify default settings values load correctly."""
    s = Settings()
    assert s.SERVICE_NAME == "doctrace-ai-service"
    assert s.PORT == 8000
    assert s.HOST == "0.0.0.0"
    assert s.LOG_LEVEL == "INFO"


def test_custom_env_override(monkeypatch):
    """Verify environment variables override defaults."""
    monkeypatch.setenv("SERVICE_NAME", "custom-service")
    monkeypatch.setenv("PORT", "9000")
    monkeypatch.setenv("LOG_LEVEL", "DEBUG")

    s = Settings()
    assert s.SERVICE_NAME == "custom-service"
    assert s.PORT == 9000
    assert s.LOG_LEVEL == "DEBUG"
