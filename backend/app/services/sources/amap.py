"""AMap (高德地图) API integration for POI data."""
import httpx
from typing import Any
from .base import BaseSource, SourceType, SourceResult
from ...core.config import get_settings


class AmapSource(BaseSource):
    """
    高德地图 POI 搜索服务
    
    API 文档: https://lbs.amap.com/api/webservice/guide/api/search
    
    支持功能:
    - 关键词搜索 POI
    - 周边搜索
    - POI 详情查询
    """
    
    source_type = SourceType.AMAP
    BASE_URL = "https://restapi.amap.com/v3"
    
    def __init__(self):
        self.settings = get_settings()
        # 使用 AMAP_KEY_WEB 作为后端 Web Service API Key
        self.api_key = self.settings.AMAP_KEY_WEB
    
    async def search(
        self,
        keyword: str,
        city: str,
        category: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> SourceResult:
        """
        搜索 POI
        
        Args:
            keyword: 搜索关键词
            city: 城市名称
            category: POI 类型 (如 "餐饮服务", "风景名胜", "住宿服务")
            page: 页码
            page_size: 每页数量 (最大 25)
        """
        if not self.api_key:
            return SourceResult(
                source=self.source_type,
                success=False,
                error="AMAP_KEY_WEB not configured"
            )
        
        params = {
            "key": self.api_key,
            "keywords": keyword,
            "city": city,
            "citylimit": "true",
            "offset": min(page_size, 25),
            "page": page,
            "extensions": "all",  # 返回详细信息
        }
        
        if category:
            params["types"] = category
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/place/text",
                    params=params,
                    timeout=10.0
                )
                response.raise_for_status()
                data = response.json()
                
                if data.get("status") != "1":
                    return SourceResult(
                        source=self.source_type,
                        success=False,
                        error=data.get("info", "Unknown error")
                    )
                
                pois = data.get("pois", [])
                return SourceResult(
                    source=self.source_type,
                    success=True,
                    data=[self._normalize_poi(poi) for poi in pois],
                    total_count=int(data.get("count", 0))
                )
                
        except httpx.HTTPError as e:
            return SourceResult(
                source=self.source_type,
                success=False,
                error=str(e)
            )
    
    async def get_detail(self, item_id: str) -> dict[str, Any] | None:
        """获取 POI 详情"""
        if not self.api_key:
            return None
            
        params = {
            "key": self.api_key,
            "id": item_id,
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/place/detail",
                    params=params,
                    timeout=10.0
                )
                response.raise_for_status()
                data = response.json()
                
                if data.get("status") == "1" and data.get("pois"):
                    return self._normalize_poi(data["pois"][0])
                return None
                
        except httpx.HTTPError:
            return None
    
    def _normalize_poi(self, poi: dict[str, Any]) -> dict[str, Any]:
        """将高德 POI 数据标准化为统一格式"""
        location = poi.get("location", "").split(",")
        lng = float(location[0]) if len(location) > 0 and location[0] else 0
        lat = float(location[1]) if len(location) > 1 and location[1] else 0
        
        return {
            "id": poi.get("id"),
            "name": poi.get("name"),
            "address": poi.get("address"),
            "city": poi.get("cityname"),
            "district": poi.get("adname"),
            "location": {"lng": lng, "lat": lat},
            "category": poi.get("type", "").split(";")[0] if poi.get("type") else None,
            "tel": poi.get("tel"),
            "rating": poi.get("biz_ext", {}).get("rating"),
            "cost": poi.get("biz_ext", {}).get("cost"),
            "photos": [p.get("url") for p in poi.get("photos", []) if p.get("url")],
            "business_hours": poi.get("biz_ext", {}).get("open_time"),
            "source": self.source_type.value,
            "raw": poi,  # 保留原始数据供调试
        }
