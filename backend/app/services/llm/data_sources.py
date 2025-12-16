"""
Data Source Adapters

将各平台数据源适配为统一的 DataSource 接口
"""
import sys
from pathlib import Path
from typing import Any

from loguru import logger

from .interfaces import DataSource
from .models import NoteData, DataSourceType, ContentType


class XiaohongshuDataSource(DataSource):
    """
    小红书数据源适配器
    
    将 scrapers 模块的 XhsAdapter 适配为 Pipeline 的 DataSource 接口
    """
    
    def __init__(self):
        self._adapter = None
    
    @property
    def source_type(self) -> DataSourceType:
        return DataSourceType.XIAOHONGSHU
    
    @property
    def adapter(self):
        """懒加载小红书适配器"""
        if self._adapter is None:
            try:
                # 添加 scrapers 路径
                scrapers_path = Path(__file__).parent.parent.parent.parent.parent / "scrapers"
                sys.path.insert(0, str(scrapers_path.parent))
                
                from scrapers.xhs import XhsAdapter
                self._adapter = XhsAdapter()
                logger.info("XhsAdapter loaded successfully")
            except ImportError as e:
                logger.error(f"Failed to import XhsAdapter: {e}")
                raise RuntimeError(
                    "XhsAdapter not available. Please ensure scrapers module is set up."
                )
        return self._adapter
    
    async def fetch_notes(
        self,
        keyword: str,
        city: str = "",
        limit: int = 20,
        **kwargs,
    ) -> list[NoteData]:
        """
        从小红书获取笔记
        
        Args:
            keyword: 搜索关键词
            city: 城市名称
            limit: 返回数量
            
        Returns:
            list[NoteData]: 标准化的笔记列表
        """
        try:
            # 组合搜索词
            search_query = f"{city} {keyword}" if city else keyword
            
            # 调用适配器
            result = await self.adapter.search(
                keyword=search_query,
                limit=limit,
            )
            
            # 转换为 NoteData
            notes = []
            for xhs_note in result.notes:
                note = self._convert_note(xhs_note, city)
                notes.append(note)
            
            logger.info(f"Fetched {len(notes)} notes from Xiaohongshu")
            return notes
            
        except Exception as e:
            logger.error(f"Failed to fetch Xiaohongshu notes: {e}")
            return []
    
    async def fetch_note_detail(self, note_id: str) -> NoteData | None:
        """获取单条笔记详情"""
        try:
            xhs_note = await self.adapter.get_note_detail(note_id)
            if xhs_note:
                return self._convert_note(xhs_note, "")
            return None
        except Exception as e:
            logger.error(f"Failed to fetch note detail {note_id}: {e}")
            return None
    
    def _convert_note(self, xhs_note: Any, city: str) -> NoteData:
        """将 XhsNote 转换为 NoteData"""
        # 推断内容类型
        content_type = self._infer_content_type(xhs_note.tags)
        
        return NoteData(
            id=xhs_note.note_id,
            source=DataSourceType.XIAOHONGSHU,
            title=xhs_note.title,
            content=xhs_note.desc,
            content_type=content_type,
            tags=xhs_note.tags,
            location=xhs_note.location,
            city=city,
            author_id=xhs_note.user_id,
            author_name=xhs_note.nickname,
            likes=xhs_note.liked_count,
            collects=xhs_note.collected_count,
            comments=xhs_note.comment_count,
            images=xhs_note.image_urls,
            video_url=xhs_note.video_url,
            publish_time=xhs_note.time,
            raw_data=xhs_note.model_dump() if hasattr(xhs_note, 'model_dump') else {},
        )
    
    def _infer_content_type(self, tags: list[str]) -> ContentType:
        """根据标签推断内容类型"""
        tags_lower = [t.lower() for t in tags]
        tags_text = " ".join(tags_lower)
        
        if any(kw in tags_text for kw in ["美食", "探店", "餐厅", "火锅", "烧烤", "小吃"]):
            return ContentType.DINING
        if any(kw in tags_text for kw in ["酒店", "民宿", "住宿", "hotel"]):
            return ContentType.HOTEL
        if any(kw in tags_text for kw in ["景点", "攻略", "旅游", "打卡", "风景"]):
            return ContentType.ATTRACTION
        if any(kw in tags_text for kw in ["交通", "地铁", "高铁", "机票", "出行"]):
            return ContentType.COMMUTE
        
        return ContentType.GENERAL


class MockDataSource(DataSource):
    """
    Mock 数据源
    
    用于测试和演示
    """
    
    MOCK_NOTES = [
        {
            "id": "mock_001",
            "title": "长沙三天两夜超全攻略！本地人带你玩转星城",
            "content": """来长沙一定要去这些地方！
            
Day1: 橘子洲头看日落，岳麓山爬山看风景，晚上去太平老街逛吃
Day2: 湖南省博物馆看马王堆，下午去文和友排队，晚上解放西路走一走
Day3: 茶颜悦色打卡，买点特产回家

人均花费：1500左右
交通：地铁很方便，打车也不贵

tips：
1. 臭豆腐要吃黑色经典
2. 茶颜悦色推荐幽兰拿铁
3. 夏天很热注意防晒！""",
            "tags": ["长沙旅游", "长沙攻略", "湖南旅游", "周末游"],
            "location": "长沙",
            "likes": 5234,
            "collects": 3421,
            "comments": 234,
        },
        {
            "id": "mock_002",
            "title": "长沙本地人推荐！这家湘菜馆真的绝了",
            "content": """在长沙吃了这么多年湘菜，这家真的是我心中的top1！

店名：xxx湘菜馆
地址：五一广场附近
人均：80-100

必点菜品：
- 剁椒鱼头（一定要点！）
- 小炒黄牛肉
- 口味虾
- 辣椒炒肉

环境很好，服务态度也不错，就是太火了要排队。建议工作日去！""",
            "tags": ["长沙美食", "湘菜", "探店", "美食推荐"],
            "location": "长沙·五一广场",
            "likes": 2341,
            "collects": 1892,
            "comments": 156,
        },
        {
            "id": "mock_003",
            "title": "避坑！这家网红酒店千万别住",
            "content": """被小红书骗了！说好的江景房结果看出去是工地...

优点：
- 位置还行，离地铁近
- 价格便宜

缺点：
- 隔音太差，走廊说话都能听到
- 空调不制冷
- 卫生堪忧，浴室有异味
- 服务态度很差

真的很失望，建议大家避开这家。宁愿多花点钱住好点的。""",
            "tags": ["长沙住宿", "酒店避坑", "差评"],
            "location": "长沙",
            "likes": 892,
            "collects": 432,
            "comments": 89,
        },
    ]
    
    @property
    def source_type(self) -> DataSourceType:
        return DataSourceType.MOCK
    
    async def fetch_notes(
        self,
        keyword: str,
        city: str = "",
        limit: int = 20,
        **kwargs,
    ) -> list[NoteData]:
        """返回 Mock 数据"""
        notes = []
        for i, data in enumerate(self.MOCK_NOTES[:limit]):
            content_type = ContentType.GENERAL
            if "美食" in " ".join(data["tags"]):
                content_type = ContentType.DINING
            elif "住宿" in " ".join(data["tags"]) or "酒店" in " ".join(data["tags"]):
                content_type = ContentType.HOTEL
            elif "攻略" in " ".join(data["tags"]) or "旅游" in " ".join(data["tags"]):
                content_type = ContentType.ATTRACTION
            
            notes.append(NoteData(
                id=data["id"],
                source=DataSourceType.MOCK,
                title=data["title"],
                content=data["content"],
                content_type=content_type,
                tags=data["tags"],
                location=data["location"],
                city=city or "长沙",
                likes=data["likes"],
                collects=data["collects"],
                comments=data["comments"],
            ))
        
        logger.info(f"Generated {len(notes)} mock notes")
        return notes
    
    async def fetch_note_detail(self, note_id: str) -> NoteData | None:
        """获取单条 Mock 数据"""
        for data in self.MOCK_NOTES:
            if data["id"] == note_id:
                return NoteData(
                    id=data["id"],
                    source=DataSourceType.MOCK,
                    title=data["title"],
                    content=data["content"],
                    tags=data["tags"],
                    location=data["location"],
                )
        return None
