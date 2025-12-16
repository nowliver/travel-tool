"""
Scraper service - integrates scrapers with travel-tool backend.

This service provides a unified interface to fetch data from various
scrapers and convert them to travel-tool's content schema.
"""
import sys
from pathlib import Path
from typing import Optional

# Add parent path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.app.schemas.content import (
    AttractionItem,
    DiningItem,
    ContentCategory,
    DataSource,
    GeoLocation,
)
from scrapers.xhs import XhsAdapter, XhsNote, XhsSearchResult


class ScraperService:
    """
    爬虫服务 - 统一数据采集接口
    
    将各平台数据转换为 travel-tool 统一格式
    """
    
    def __init__(self):
        self._xhs_adapter: Optional[XhsAdapter] = None
    
    @property
    def xhs(self) -> XhsAdapter:
        """懒加载小红书适配器"""
        if self._xhs_adapter is None:
            self._xhs_adapter = XhsAdapter()
        return self._xhs_adapter
    
    async def search_attractions(
        self,
        keyword: str,
        city: str,
        limit: int = 20,
    ) -> list[AttractionItem]:
        """
        搜索景点攻略
        
        Args:
            keyword: 景点名称或关键词
            city: 城市名称
            limit: 返回数量
            
        Returns:
            list[AttractionItem]: 景点信息列表
        """
        # 组合搜索词
        search_query = f"{city} {keyword} 攻略"
        
        try:
            result = await self.xhs.search(search_query, limit=limit)
            return [
                self._note_to_attraction(note, city)
                for note in result.notes
            ]
        except Exception as e:
            print(f"Search attractions failed: {e}")
            return []
    
    async def search_dining(
        self,
        keyword: str,
        city: str,
        limit: int = 20,
    ) -> list[DiningItem]:
        """
        搜索美食推荐
        
        Args:
            keyword: 美食名称或关键词
            city: 城市名称
            limit: 返回数量
            
        Returns:
            list[DiningItem]: 美食信息列表
        """
        # 组合搜索词
        search_query = f"{city} {keyword} 美食探店"
        
        try:
            result = await self.xhs.search(search_query, limit=limit)
            return [
                self._note_to_dining(note, city)
                for note in result.notes
            ]
        except Exception as e:
            print(f"Search dining failed: {e}")
            return []
    
    async def search_xhs_raw(
        self,
        keyword: str,
        limit: int = 20,
    ) -> XhsSearchResult:
        """
        原始小红书搜索（不转换格式）
        
        Args:
            keyword: 搜索关键词
            limit: 返回数量
            
        Returns:
            XhsSearchResult: 原始搜索结果
        """
        return await self.xhs.search(keyword, limit=limit)
    
    def _note_to_attraction(self, note: XhsNote, city: str) -> AttractionItem:
        """将小红书笔记转换为景点信息"""
        # 提取标签作为攻略要点
        tips = []
        if note.tags:
            tips = note.tags[:5]
        
        return AttractionItem(
            name=note.title[:50] if note.title else "未知景点",
            address=note.location or city,
            city=city,
            category=ContentCategory.ATTRACTION,
            source=DataSource.XIAOHONGSHU,
            source_id=note.note_id,
            description=note.desc[:500] if note.desc else None,
            tags=note.tags,
            rating=self._calculate_rating(note),
            review_count=note.comment_count,
            photos=note.image_urls[:5],
            tips=tips,
            ai_summary=self._generate_summary(note),
        )
    
    def _note_to_dining(self, note: XhsNote, city: str) -> DiningItem:
        """将小红书笔记转换为美食信息"""
        # 尝试从标签中提取推荐菜品
        recommended_dishes = [
            tag for tag in note.tags
            if any(keyword in tag for keyword in ["推荐", "必点", "招牌", "特色"])
        ][:5]
        
        return DiningItem(
            name=note.title[:50] if note.title else "未知店铺",
            address=note.location or city,
            city=city,
            category=ContentCategory.DINING,
            source=DataSource.XIAOHONGSHU,
            source_id=note.note_id,
            rating=self._calculate_rating(note),
            review_count=note.comment_count,
            photos=note.image_urls[:5],
            recommended_dishes=recommended_dishes,
            tips=[note.desc[:200]] if note.desc else [],
        )
    
    def _calculate_rating(self, note: XhsNote) -> float:
        """
        根据互动数据估算评分
        
        简单算法: 基于点赞、收藏、评论数计算
        """
        # 互动总数
        total_engagement = (
            note.liked_count + 
            note.collected_count * 2 +  # 收藏权重更高
            note.comment_count * 1.5
        )
        
        # 简单映射到 1-5 分
        if total_engagement > 10000:
            return 5.0
        elif total_engagement > 5000:
            return 4.8
        elif total_engagement > 1000:
            return 4.5
        elif total_engagement > 500:
            return 4.2
        elif total_engagement > 100:
            return 4.0
        else:
            return 3.8
    
    def _generate_summary(self, note: XhsNote) -> Optional[str]:
        """
        生成简短摘要
        
        后续可接入 LLM 生成更智能的摘要
        """
        if not note.desc:
            return None
        
        # 简单截取前 100 字符
        summary = note.desc[:100]
        if len(note.desc) > 100:
            summary += "..."
        
        return summary
