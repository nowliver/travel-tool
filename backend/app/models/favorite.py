import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from app.db.base import Base


class Favorite(Base):
    """Favorite location model for storing user's favorite spots/hotels/dining."""
    
    __tablename__ = "favorites"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Type: spot, hotel, dining
    type = Column(String(20), nullable=False, index=True)
    
    # Basic info
    name = Column(String(255), nullable=False)
    address = Column(String(500), nullable=True)
    
    # Location stored as JSON {lat: float, lng: float}
    location = Column(JSON, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationship to user
    owner = relationship("User", back_populates="favorites")
    
    def __repr__(self):
        return f"<Favorite(id={self.id}, type={self.type}, name={self.name})>"
