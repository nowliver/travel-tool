"""Xiaohongshu scraper configuration."""
import os
from pathlib import Path
from pydantic import BaseModel, Field


# MediaCrawler 项目路径 (相对于 travel-tool 根目录)
MEDIA_CRAWLER_PATH = Path(__file__).parent.parent.parent.parent / "MediaCrawler"


class XhsScraperConfig(BaseModel):
    """小红书爬虫配置"""
    
    # MediaCrawler 路径
    media_crawler_path: Path = Field(
        default=MEDIA_CRAWLER_PATH,
        description="MediaCrawler 项目路径"
    )
    
    # 搜索配置
    max_notes_per_search: int = Field(
        default=20,
        description="每次搜索最大笔记数"
    )
    
    # 请求配置
    request_timeout: int = Field(
        default=60,
        description="请求超时时间(秒)"
    )
    
    # 缓存配置
    cache_enabled: bool = Field(
        default=True,
        description="是否启用缓存"
    )
    cache_expire_hours: int = Field(
        default=24,
        description="缓存过期时间(小时)"
    )
    
    # 数据存储
    data_dir: Path = Field(
        default=Path(__file__).parent.parent / "data",
        description="数据存储目录"
    )
    
    def ensure_dirs(self):
        """确保目录存在"""
        self.data_dir.mkdir(parents=True, exist_ok=True)
    
    @property
    def media_crawler_exists(self) -> bool:
        """检查 MediaCrawler 是否存在"""
        return (self.media_crawler_path / "main.py").exists()


# 默认配置实例
default_config = XhsScraperConfig()
