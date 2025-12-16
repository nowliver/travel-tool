"""Xiaohongshu data source integration for travel-tool backend."""
import sys
from pathlib import Path
from typing import Any

# Add scrapers path
SCRAPERS_PATH = Path(__file__).parent.parent.parent.parent.parent / "scrapers"
sys.path.insert(0, str(SCRAPERS_PATH.parent))

from .base import BaseSource, SourceType, SourceResult


class XiaohongshuSource(BaseSource):
    """
    小红书数据源
    
    通过 scrapers 模块集成 MediaCrawler 获取数据。
    
    注意：
    1. 首次使用需要通过 MediaCrawler 扫码登录
    2. 请遵守小红书平台规则，控制请求频率
    3. 仅用于学习和研究目的
    """
    
    source_type = SourceType.XIAOHONGSHU
    
    def __init__(self):
        self._service = None
    
    @property
    def scraper_service(self):
        """懒加载爬虫服务"""
        if self._service is None:
            try:
                from scrapers.integration.service import ScraperService
                self._service = ScraperService()
            except ImportError as e:
                raise RuntimeError(
                    f"Failed to import ScraperService: {e}. "
                    "Please ensure scrapers module is properly set up."
                )
        return self._service
    
    async def search(
        self,
        keyword: str,
        city: str,
        category: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> SourceResult:
        """
        搜索小红书内容
        
        Args:
            keyword: 搜索关键词
            city: 城市名称
            category: 内容类别 (attraction/dining)
            page: 页码 (暂不支持分页)
            page_size: 每页数量
        """
        try:
            # 组合搜索词
            search_query = f"{city} {keyword}"
            if category == "attraction":
                search_query += " 攻略 景点"
            elif category == "dining":
                search_query += " 美食 探店"
            
            result = await self.scraper_service.search_xhs_raw(
                keyword=search_query,
                limit=page_size,
            )
            
            # 转换为统一格式
            data = []
            for note in result.notes:
                data.append(self._normalize_note(note, city))
            
            return SourceResult(
                source=self.source_type,
                success=True,
                data=data,
                total_count=result.total_count,
            )
            
        except Exception as e:
            return SourceResult(
                source=self.source_type,
                success=False,
                error=str(e),
            )
    
    async def get_detail(self, item_id: str) -> dict[str, Any] | None:
        """获取笔记详情"""
        try:
            note = await self.scraper_service.xhs.get_note_detail(item_id)
            if note:
                return self._normalize_note(note, "")
            return None
        except Exception:
            return None
    
    def _normalize_note(self, note, city: str) -> dict[str, Any]:
        """将小红书笔记转换为统一格式"""
        return {
            "id": note.note_id,
            "name": note.title,
            "address": note.location or city,
            "city": city,
            "location": None,  # 小红书通常不提供精确坐标
            "category": "attraction",  # 默认为景点
            "description": note.desc,
            "tags": note.tags,
            "rating": self._calculate_rating(note),
            "review_count": note.comment_count,
            "photos": note.image_urls,
            "source": self.source_type.value,
            "source_url": note.note_url,
            "author": {
                "id": note.user_id,
                "name": note.nickname,
                "avatar": note.avatar,
            },
            "engagement": {
                "likes": note.liked_count,
                "collects": note.collected_count,
                "comments": note.comment_count,
                "shares": note.share_count,
            },
            "raw": note.model_dump(),
        }
    
    def _calculate_rating(self, note) -> float:
        """根据互动数据估算评分"""
        total = (
            note.liked_count +
            note.collected_count * 2 +
            note.comment_count * 1.5
        )
        
        if total > 10000:
            return 5.0
        elif total > 5000:
            return 4.8
        elif total > 1000:
            return 4.5
        elif total > 500:
            return 4.2
        elif total > 100:
            return 4.0
        else:
            return 3.8
