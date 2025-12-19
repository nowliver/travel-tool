from typing import Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime


class GeoLocation(BaseModel):
    """Geographic location."""
    lat: float
    lng: float


class FavoriteBase(BaseModel):
    """Base schema for favorite items."""
    type: Literal["spot", "hotel", "dining"]
    name: str = Field(..., min_length=1, max_length=255)
    address: Optional[str] = Field(None, max_length=500)
    location: GeoLocation


class FavoriteCreate(FavoriteBase):
    """Schema for creating a new favorite."""
    pass


class FavoriteResponse(FavoriteBase):
    """Schema for favorite response."""
    id: str
    user_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class FavoriteListResponse(BaseModel):
    """Schema for list of favorites grouped by type."""
    spot: list[FavoriteResponse] = []
    hotel: list[FavoriteResponse] = []
    dining: list[FavoriteResponse] = []
