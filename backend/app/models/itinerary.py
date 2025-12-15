import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from app.db.base import Base


class ItineraryPlan(Base):
    """Itinerary plan model for storing user travel plans."""
    
    __tablename__ = "itinerary_plans"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    
    # Store the complete trip data as JSON
    # Contains: meta (city, dates, center), days (array of DayPlan)
    content_json = Column(JSON, nullable=False)
    
    # Optional description
    description = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationship to user
    owner = relationship("User", back_populates="itineraries")
    
    def __repr__(self):
        return f"<ItineraryPlan(id={self.id}, title={self.title})>"
