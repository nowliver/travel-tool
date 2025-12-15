from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime


class GeoLocation(BaseModel):
    """Geographic location coordinates."""
    lat: float
    lng: float


class CommuteInfo(BaseModel):
    """Commute information between nodes."""
    distance_text: str
    duration_text: str
    mode: Literal["taxi", "transit"]


class PlanNode(BaseModel):
    """A single node in the itinerary (spot, hotel, dining)."""
    id: str
    type: Literal["spot", "hotel", "dining"]
    name: str
    location: GeoLocation
    cost: Optional[float] = None
    notes: Optional[str] = None
    time: Optional[str] = None
    to_next_commute: Optional[CommuteInfo] = None


class DayPlan(BaseModel):
    """A day's plan containing multiple nodes."""
    day_index: int
    date: Optional[str] = None
    nodes: List[PlanNode] = []


class TripMeta(BaseModel):
    """Trip metadata."""
    city: str
    dates: List[str] = Field(..., min_length=2, max_length=2)
    center: Optional[GeoLocation] = None


class TripContent(BaseModel):
    """Complete trip content structure matching frontend TripStoreState."""
    meta: TripMeta
    days: List[DayPlan]


class ItineraryCreate(BaseModel):
    """Schema for creating a new itinerary."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    content: TripContent


class ItineraryUpdate(BaseModel):
    """Schema for updating an itinerary."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    content: Optional[TripContent] = None


class ItineraryResponse(BaseModel):
    """Schema for itinerary response."""
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    content: TripContent
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ItineraryListResponse(BaseModel):
    """Schema for itinerary list item (without full content)."""
    id: str
    title: str
    description: Optional[str] = None
    city: str
    dates: List[str]
    days_count: int
    created_at: datetime
    updated_at: datetime
