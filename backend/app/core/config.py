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
    
    # App Info
    APP_NAME: str = "LiteTravel API"
    APP_VERSION: str = "2.0.0"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()
