"""Content API endpoints for searching attractions, hotels, dining, etc."""
from fastapi import APIRouter, Query, HTTPException
from ..schemas.content import (
    ContentCategory,
    DataSource,
    ContentSearchResponse,
    AttractionItem,
    DiningItem,
    HotelItem,
    GeoLocation,
)
from ..services.sources.amap import AmapSource

router = APIRouter(prefix="/content", tags=["content"])

# 高德 POI 类型映射
AMAP_CATEGORY_MAP = {
    ContentCategory.ATTRACTION: "风景名胜|旅游景点",
    ContentCategory.HOTEL: "住宿服务",
    ContentCategory.DINING: "餐饮服务",
}


@router.get("/search", response_model=ContentSearchResponse)
async def search_content(
    keyword: str = Query(..., description="搜索关键词"),
    city: str = Query(..., description="城市名称"),
    category: ContentCategory | None = Query(None, description="内容类别"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=50, description="每页数量"),
):
    """
    搜索内容（景点/住宿/美食）
    
    目前支持高德地图 POI 数据源，后续扩展携程、小红书等。
    """
    amap = AmapSource()
    
    # 获取高德 POI 类型
    amap_type = AMAP_CATEGORY_MAP.get(category) if category else None
    
    result = await amap.search(
        keyword=keyword,
        city=city,
        category=amap_type,
        page=page,
        page_size=page_size,
    )
    
    if not result.success:
        raise HTTPException(
            status_code=503,
            detail=f"数据源错误: {result.error}"
        )
    
    # 转换为统一格式
    items = []
    for poi in result.data:
        item = _convert_poi_to_item(poi, category)
        if item:
            items.append(item)
    
    return ContentSearchResponse(
        items=items,
        total=result.total_count,
        page=page,
        page_size=page_size,
        sources_used=[DataSource.AMAP],
    )


def _convert_poi_to_item(
    poi: dict,
    category: ContentCategory | None
) -> AttractionItem | DiningItem | HotelItem | None:
    """将 POI 数据转换为对应类型的 Item"""
    
    # 解析位置
    location = None
    if poi.get("location"):
        location = GeoLocation(
            lng=poi["location"]["lng"],
            lat=poi["location"]["lat"]
        )
    
    # 基础字段
    base = {
        "name": poi.get("name", ""),
        "address": poi.get("address"),
        "city": poi.get("city", ""),
        "district": poi.get("district"),
        "location": location,
        "source": DataSource.AMAP,
        "source_id": poi.get("id"),
    }
    
    # 根据类别返回不同类型
    if category == ContentCategory.ATTRACTION:
        return AttractionItem(
            **base,
            rating=float(poi["rating"]) if poi.get("rating") else None,
            photos=poi.get("photos", []),
            open_hours=poi.get("business_hours"),
        )
    elif category == ContentCategory.DINING:
        return DiningItem(
            **base,
            rating=float(poi["rating"]) if poi.get("rating") else None,
            avg_cost=float(poi["cost"]) if poi.get("cost") else None,
            photos=poi.get("photos", []),
            business_hours=poi.get("business_hours"),
            tel=poi.get("tel"),
        )
    elif category == ContentCategory.HOTEL:
        return HotelItem(
            **base,
            rating=float(poi["rating"]) if poi.get("rating") else None,
            photos=poi.get("photos", []),
        )
    else:
        # 默认返回景点类型
        return AttractionItem(
            **base,
            rating=float(poi["rating"]) if poi.get("rating") else None,
            photos=poi.get("photos", []),
        )
