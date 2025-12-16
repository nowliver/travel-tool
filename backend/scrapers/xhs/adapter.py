"""Xiaohongshu adapter - integrates with MediaCrawler."""
import asyncio
import json
import subprocess
import sys
from pathlib import Path
from typing import Optional
from datetime import datetime

from .config import XhsScraperConfig, default_config
from .models import XhsNote, XhsSearchResult


class XhsAdapter:
    """
    小红书爬虫适配器
    
    通过调用 MediaCrawler 获取小红书数据，
    并转换为 travel-tool 统一格式。
    """
    
    def __init__(self, config: Optional[XhsScraperConfig] = None):
        self.config = config or default_config
        self.config.ensure_dirs()
        
        if not self.config.media_crawler_exists:
            raise RuntimeError(
                f"MediaCrawler not found at {self.config.media_crawler_path}. "
                "Please ensure MediaCrawler is installed."
            )
    
    async def search(
        self,
        keyword: str,
        limit: int = 20,
        sort_type: str = "general",  # general, time_desc, popularity_desc
    ) -> XhsSearchResult:
        """
        搜索小红书笔记
        
        Args:
            keyword: 搜索关键词
            limit: 返回数量限制
            sort_type: 排序方式
            
        Returns:
            XhsSearchResult: 搜索结果
        """
        # 检查缓存
        cached = self._get_cached_result(keyword)
        if cached:
            return cached
        
        # 调用 MediaCrawler 执行搜索
        notes = await self._run_media_crawler_search(keyword, limit)
        
        result = XhsSearchResult(
            keyword=keyword,
            notes=notes,
            total_count=len(notes),
            has_more=len(notes) >= limit,
            search_time=datetime.now(),
        )
        
        # 缓存结果
        if self.config.cache_enabled:
            self._cache_result(keyword, result)
        
        return result
    
    async def get_note_detail(self, note_id: str) -> Optional[XhsNote]:
        """
        获取笔记详情
        
        Args:
            note_id: 笔记ID
            
        Returns:
            XhsNote: 笔记详情
        """
        notes = await self._run_media_crawler_detail([note_id])
        return notes[0] if notes else None
    
    async def _run_media_crawler_search(
        self,
        keyword: str,
        limit: int,
    ) -> list[XhsNote]:
        """
        通过 subprocess 调用 MediaCrawler 执行搜索
        
        注意: 这是一个简化实现，实际使用时建议：
        1. 使用 MediaCrawler 的 Python API 直接调用
        2. 或者设置消息队列进行异步任务调度
        """
        # 构建临时配置
        temp_config = self._create_temp_config(keyword, limit)
        
        try:
            # 运行 MediaCrawler
            result = await self._execute_crawler(
                platform="xhs",
                crawl_type="search",
                config_file=temp_config,
            )
            
            # 解析结果
            notes = self._parse_crawler_output(result)
            return notes[:limit]
            
        except Exception as e:
            print(f"MediaCrawler search failed: {e}")
            return []
        finally:
            # 清理临时配置
            if temp_config.exists():
                temp_config.unlink()
    
    async def _run_media_crawler_detail(
        self,
        note_ids: list[str],
    ) -> list[XhsNote]:
        """获取笔记详情"""
        # 类似 search 的实现
        return []
    
    async def _execute_crawler(
        self,
        platform: str,
        crawl_type: str,
        config_file: Path,
    ) -> dict:
        """
        执行 MediaCrawler
        
        实际项目中，建议改为：
        1. 直接 import MediaCrawler 模块
        2. 或使用 Celery 等任务队列
        """
        cmd = [
            "uv", "run", "main.py",
            "--platform", platform,
            "--lt", "cookie",  # 使用已保存的 cookie
            "--type", crawl_type,
        ]
        
        # 在 MediaCrawler 目录执行
        process = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=str(self.config.media_crawler_path),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        
        stdout, stderr = await asyncio.wait_for(
            process.communicate(),
            timeout=self.config.request_timeout * 3,
        )
        
        if process.returncode != 0:
            raise RuntimeError(f"Crawler failed: {stderr.decode()}")
        
        return {"stdout": stdout.decode(), "stderr": stderr.decode()}
    
    def _create_temp_config(self, keyword: str, limit: int) -> Path:
        """创建临时配置文件"""
        config_content = {
            "KEYWORDS": keyword,
            "CRAWLER_MAX_NOTES_COUNT": limit,
        }
        
        temp_file = self.config.data_dir / f"temp_config_{keyword[:10]}.json"
        temp_file.write_text(json.dumps(config_content, ensure_ascii=False))
        return temp_file
    
    def _parse_crawler_output(self, result: dict) -> list[XhsNote]:
        """
        解析 MediaCrawler 输出
        
        MediaCrawler 默认将结果存储到 data/xhs/ 目录下的 JSON 文件
        """
        notes = []
        
        # 读取 MediaCrawler 输出目录
        output_dir = self.config.media_crawler_path / "data" / "xhs"
        if not output_dir.exists():
            return notes
        
        # 查找最新的输出文件
        json_files = sorted(output_dir.glob("*.json"), key=lambda x: x.stat().st_mtime, reverse=True)
        
        for json_file in json_files[:1]:  # 只读取最新的
            try:
                data = json.loads(json_file.read_text(encoding="utf-8"))
                for item in data if isinstance(data, list) else [data]:
                    note = self._convert_to_note(item)
                    if note:
                        notes.append(note)
            except Exception as e:
                print(f"Failed to parse {json_file}: {e}")
        
        return notes
    
    def _convert_to_note(self, raw: dict) -> Optional[XhsNote]:
        """将 MediaCrawler 原始数据转换为 XhsNote"""
        try:
            return XhsNote(
                note_id=raw.get("note_id", ""),
                title=raw.get("title", ""),
                desc=raw.get("desc", raw.get("content", "")),
                type=raw.get("type", "normal"),
                user_id=raw.get("user_id", ""),
                nickname=raw.get("nickname", raw.get("user", {}).get("nickname", "")),
                avatar=raw.get("avatar", raw.get("user", {}).get("avatar", "")),
                liked_count=int(raw.get("liked_count", 0)),
                collected_count=int(raw.get("collected_count", 0)),
                comment_count=int(raw.get("comment_count", raw.get("comments_count", 0))),
                share_count=int(raw.get("share_count", 0)),
                cover_url=raw.get("cover", raw.get("image_list", [""])[0] if raw.get("image_list") else ""),
                image_urls=raw.get("image_list", []),
                video_url=raw.get("video_url", ""),
                tags=raw.get("tag_list", []),
                location=raw.get("ip_location", ""),
                time=raw.get("time", raw.get("create_time", "")),
                source_url=raw.get("note_url", ""),
            )
        except Exception as e:
            print(f"Failed to convert note: {e}")
            return None
    
    def _get_cached_result(self, keyword: str) -> Optional[XhsSearchResult]:
        """获取缓存结果"""
        if not self.config.cache_enabled:
            return None
        
        cache_file = self.config.data_dir / f"cache_{keyword}.json"
        if not cache_file.exists():
            return None
        
        try:
            data = json.loads(cache_file.read_text(encoding="utf-8"))
            result = XhsSearchResult(**data)
            
            # 检查是否过期
            cache_age = datetime.now() - result.search_time
            if cache_age.total_seconds() > self.config.cache_expire_hours * 3600:
                cache_file.unlink()
                return None
            
            return result
        except Exception:
            return None
    
    def _cache_result(self, keyword: str, result: XhsSearchResult):
        """缓存搜索结果"""
        cache_file = self.config.data_dir / f"cache_{keyword}.json"
        cache_file.write_text(
            result.model_dump_json(indent=2),
            encoding="utf-8"
        )
