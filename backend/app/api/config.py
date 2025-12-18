"""Public configuration API for frontend."""
from fastapi import APIRouter
from pydantic import BaseModel
from app.core.config import get_settings

router = APIRouter(prefix="/config", tags=["Configuration"])


class PublicConfig(BaseModel):
    """Public configuration exposed to frontend."""
    amap_key_web_js: str | None = None  # 高德地图 JS API Key (前端地图加载)
    app_name: str = "LiteTravel"
    app_version: str = "2.1.0"


@router.get("", response_model=PublicConfig)
def get_public_config():
    """
    Get public configuration for frontend.
    
    This endpoint exposes only the configuration that is safe to share
    with the frontend (no secrets like JWT keys or database URLs).
    """
    settings = get_settings()
    return PublicConfig(
        amap_key_web_js=settings.AMAP_KEY_WEB_JS,
        app_name=settings.APP_NAME,
        app_version=settings.APP_VERSION,
    )
