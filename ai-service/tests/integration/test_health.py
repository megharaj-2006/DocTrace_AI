"""Integration tests for GET /health endpoint."""


def test_health_check_endpoint(client):
    """Test GET /health returns 200 OK and expected JSON schema."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "doctrace-ai-service"
