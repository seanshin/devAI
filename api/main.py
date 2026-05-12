"""FastAPI Application - AI Orchestrator Proxy"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from config import settings
from routes import orchestrator, rag, cli, websocket, download
from clients.weru_client import weru_client
from clients.mock_weru_client import MockWeRUClient


# Setup logging
logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

# Configure WeRU.B client (mock or real)
import clients.weru_client as weru_module
if settings.MOCK_MODE:
    weru_module.weru_client = MockWeRUClient()
    logger.warning("🧪 MOCK MODE ENABLED - Using mock WeRU.B client (development only)")
elif not settings.WERUB_API_KEY:
    logger.warning(
        "⚠️  WARNING: WERUB_API_KEY not set. "
        "Set WERUB_API_KEY environment variable or use MOCK_MODE=true for testing"
    )
else:
    logger.info("🔗 Using real WeRU.B client")

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.API_VERSION,
    debug=settings.DEBUG,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_CREDENTIALS,
    allow_methods=settings.CORS_METHODS,
    allow_headers=settings.CORS_HEADERS,
)


# Include routers
app.include_router(orchestrator.router)
app.include_router(rag.router)
app.include_router(cli.router)
app.include_router(websocket.router)
app.include_router(download.router)


# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "version": settings.API_VERSION}


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.API_VERSION,
        "status": "running",
    }


# Error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
