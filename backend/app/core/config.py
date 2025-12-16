from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # JWT Settings
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Database
    DATABASE_URL: str = "sqlite:///./litetravel.db"
    
    # External APIs
    AMAP_KEY: str | None = None  # 高德地图 API Key
    
    # LLM - 火山引擎 (Volcengine)
    VOLCENGINE_API_KEY: str | None = None
    VOLCENGINE_MODEL: str = "doubao-seed-1.6-flash"
    VOLCENGINE_BASE_URL: str = "https://ark.cn-beijing.volces.com/api/v3"
    VOLCENGINE_TEMPERATURE: float = 0.3
    VOLCENGINE_MAX_TOKENS: int = 4096
    
    # App Info
    APP_NAME: str = "LiteTravel API"
    APP_VERSION: str = "2.1.0"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()
