"""Base class for all data sources."""
from abc import ABC, abstractmethod
from typing import Any
from pydantic import BaseModel
from enum import Enum


class SourceType(str, Enum):
    """Supported data source types."""
    AMAP = "amap"
    CTRIP = "ctrip"
    XIAOHONGSHU = "xiaohongshu"
    MEITUAN = "meituan"


class SourceResult(BaseModel):
    """Standardized result from any data source."""
    source: SourceType
    success: bool
    data: list[dict[str, Any]] = []
    error: str | None = None
    total_count: int = 0


class BaseSource(ABC):
    """Abstract base class for data sources."""
    
    source_type: SourceType
    
    @abstractmethod
    async def search(
        self,
        keyword: str,
        city: str,
        category: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> SourceResult:
        """Search for content by keyword and city."""
        pass
    
    @abstractmethod
    async def get_detail(self, item_id: str) -> dict[str, Any] | None:
        """Get detailed information for a specific item."""
        pass
