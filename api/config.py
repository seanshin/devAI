"""Configuration management for the API"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""

    # API Configuration
    API_VERSION: str = "0.1.0"
    APP_NAME: str = "AI Orchestrator API"
    DEBUG: bool = False

    # WeRU.B Server
    WERUB_BASE_URL: str = "https://weve.io.kr/ollama"
    WERUB_API_KEY: str = ""  # Set via environment

    # Mock Mode (for development/testing without WeRU.B API key)
    MOCK_MODE: bool = False  # Set via environment: MOCK_MODE=true

    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_DB: int = 0

    # CORS Configuration
    CORS_ORIGINS: list = ["*"]
    CORS_CREDENTIALS: bool = True
    CORS_METHODS: list = ["*"]
    CORS_HEADERS: list = ["*"]

    # Session Configuration
    SESSION_TTL_HOURS: int = 24

    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
