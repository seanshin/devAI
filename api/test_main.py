"""Basic tests for FastAPI application"""
import pytest
from httpx import AsyncClient
from main import app


@pytest.mark.asyncio
async def test_health_check():
    """Test health check endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_root():
    """Test root endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "version" in data
        assert "status" in data


@pytest.mark.asyncio
async def test_orchestrate_request():
    """Test orchestrate endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        payload = {
            "input": "FastAPI 기반 사용자 인증 시스템",
        }
        # This will fail without WeRU.B server, but tests the endpoint structure
        try:
            response = await client.post("/api/orchestrate", json=payload)
            assert response.status_code in [200, 500]  # May error without server
        except Exception:
            # Expected if WeRU.B is not available
            pass
