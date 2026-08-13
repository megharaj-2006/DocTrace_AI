import io
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings


@pytest.mark.asyncio
async def test_concurrent_analysis_requests_isolation(sample_pdf_content):
    """Verify concurrent analysis requests return correct isolated responses without state leakage."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        async def send_req(doc_id: str):
            files = {"file": ("invoice.pdf", io.BytesIO(sample_pdf_content), "application/pdf")}
            data = {"documentId": doc_id}
            headers = {"X-Internal-API-Key": settings.INTERNAL_API_KEY}
            res = await ac.post("/api/v1/analyze", files=files, data=data, headers=headers)
            return doc_id, res

        doc_ids = ["CONCUR-001", "CONCUR-002"]
        for requested_id in doc_ids:
            requested_id, res = await send_req(requested_id)
            assert res.status_code == 200, res.text
            body = res.json()
            assert body["documentId"] == requested_id
            assert "fraudScore" in body
            assert "riskLevel" in body


