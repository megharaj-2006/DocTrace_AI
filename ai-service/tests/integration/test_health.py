"""Integration tests for GET /health endpoint."""


def test_health_check_endpoint(client):
    """Test GET /health returns 200 OK and expected JSON schema."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "doctrace-ai-service"


def test_readiness_check_endpoint(client):
    """Test GET /readiness returns readiness state."""
    response = client.get("/readiness")
    assert response.status_code in (200, 503)
    data = response.json()
    assert "status" in data
    assert data["service"] == "doctrace-ai-service"
    assert "details" in data

