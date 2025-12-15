"""Unified content schemas for multi-source data."""
from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field
from enum import Enum


class ContentCategory(str, Enum):
    """内容类别"""
    ATTRACTION = "attraction"  # 景点
    HOTEL = "hotel"            # 住宿
    DINING = "dining"          # 美食
    COMMUTE = "commute"        # 出行


class DataSource(str, Enum):
    """数据来源"""
    AMAP = "amap"
    CTRIP = "ctrip"
    XIAOHONGSHU = "xiaohongshu"
    MEITUAN = "meituan"


class GeoLocation(BaseModel):
    """地理坐标"""
    lng: float
    lat: float


class ContentBase(BaseModel):
    """内容基础字段"""
    name: str
    address: str | None = None
    city: str
    district: str | None = None
    location: GeoLocation | None = None
    category: ContentCategory
    source: DataSource
    source_id: str | None = None  # 原始数据源 ID
    

class AttractionItem(ContentBase):
    """景点信息"""
    category: ContentCategory = ContentCategory.ATTRACTION
    description: str | None = None
    tags: list[str] = []
    rating: float | None = None
    review_count: int | None = None
    photos: list[str] = []
    ticket_price: str | None = None
    open_hours: str | None = None
    tips: list[str] = []  # LLM 整理的攻略要点
    ai_summary: str | None = None  # LLM 生成的摘要


class HotelItem(ContentBase):
    """住宿信息"""
    category: ContentCategory = ContentCategory.HOTEL
    star_rating: int | None = None  # 星级 1-5
    price_range: str | None = None  # 价格区间
    min_price: float | None = None
    rating: float | None = None
    review_count: int | None = None
    photos: list[str] = []
    facilities: list[str] = []  # 设施标签
    room_types: list[str] = []
    booking_url: str | None = None


class DiningItem(ContentBase):
    """美食信息"""
    category: ContentCategory = ContentCategory.DINING
    cuisine_type: str | None = None  # 菜系
    rating: float | None = None
    review_count: int | None = None
    avg_cost: float | None = None  # 人均消费
    photos: list[str] = []
    recommended_dishes: list[str] = []  # 推荐菜品
    business_hours: str | None = None
    tel: str | None = None
    tips: list[str] = []


class CommuteType(str, Enum):
    """出行方式"""
    FLIGHT = "flight"      # 飞机
    TRAIN = "train"        # 火车/高铁
    BUS = "bus"            # 大巴
    SUBWAY = "subway"      # 地铁
    TAXI = "taxi"          # 打车
    WALKING = "walking"    # 步行


class CommuteItem(ContentBase):
    """出行信息"""
    category: ContentCategory = ContentCategory.COMMUTE
    commute_type: CommuteType
    from_location: str
    to_location: str
    duration: int | None = None  # 预计时长(分钟)
    distance: float | None = None  # 距离(公里)
    price: float | None = None
    schedule: str | None = None  # 时刻表/班次信息
    booking_url: str | None = None


# API 请求/响应模型
class ContentSearchRequest(BaseModel):
    """内容搜索请求"""
    keyword: str
    city: str
    category: ContentCategory | None = None
    sources: list[DataSource] = []  # 空则搜索所有
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=50)


class ContentSearchResponse(BaseModel):
    """内容搜索响应"""
    items: list[AttractionItem | HotelItem | DiningItem | CommuteItem]
    total: int
    page: int
    page_size: int
    sources_used: list[DataSource]


class ContentDetailResponse(BaseModel):
    """内容详情响应"""
    item: AttractionItem | HotelItem | DiningItem | CommuteItem
    ai_enhanced: bool = False  # 是否经过 LLM 增强
    last_updated: datetime | None = None
