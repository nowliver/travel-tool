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
    
    # External APIs - 高德地图 (AMap)
    AMAP_KEY_WEB: str | None = None  # 高德地图 Web Service API Key (后端 POI 搜索)
    AMAP_KEY_WEB_JS: str | None = None  # 高德地图 JS API Key (前端地图加载)
    GOOGLE_API_KEY: str | None = None  # Google API Key
    
    # LLM - 火山引擎 (Volcengine)
    VOLCENGINE_API_KEY: str | None = None
    VOLCENGINE_MODEL: str = "doubao-seed-1-6-251015"
    VOLCENGINE_BASE_URL: str = "https://ark.cn-beijing.volces.com/api/v3"
    VOLCENGINE_TEMPERATURE: float = 0.3
    VOLCENGINE_MAX_TOKENS: int = 4096
    
    # App Info
    APP_NAME: str = "LiteTravel API"
    APP_VERSION: str = "2.1.0"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # 允许忽略 .env 中未定义的额外变量


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()
