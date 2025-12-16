"""
Pipeline Orchestrator

编排整个 ETL 处理流程：获取 -> 清洗 -> LLM分析 -> 结构化输出
"""
import asyncio
import time
from typing import Callable, Awaitable

from loguru import logger

from .interfaces import DataSource, LLMProvider, PromptManager
from .models import (
    NoteData,
    AnalysisResult,
    BatchAnalysisResult,
    ContentType,
    DataSourceType,
)
from .processor import TextCleaner, ResponseParser
from .prompts import DefaultPromptManager
from .volcengine_provider import VolcengineProvider


class Pipeline:
    """
    数据处理流水线
    
    编排完整的 ETL 流程：
    1. Extract: 从数据源获取原始数据
    2. Transform: 清洗文本 + LLM 分析
    3. Load: 结构化输出
    
    支持：
    - 多数据源（小红书、携程、美团等）
    - 多 LLM 提供商（火山引擎、OpenAI 等）
    - 可配置的 Prompt 模板
    - 批量处理与并发控制
    - 错误处理与重试
    """
    
    def __init__(
        self,
        llm_provider: LLMProvider | None = None,
        prompt_manager: PromptManager | None = None,
        text_cleaner: TextCleaner | None = None,
        response_parser: ResponseParser | None = None,
        concurrency: int = 3,
    ):
        """
        初始化流水线
        
        Args:
            llm_provider: LLM 提供商，默认使用火山引擎
            prompt_manager: Prompt 管理器
            text_cleaner: 文本清洗器
            response_parser: 响应解析器
            concurrency: 并发数量
        """
        self.llm = llm_provider or VolcengineProvider()
        self.prompt_manager = prompt_manager or DefaultPromptManager()
        self.cleaner = text_cleaner or TextCleaner()
        self.parser = response_parser or ResponseParser()
        self.concurrency = concurrency
        
        # 数据源注册表
        self._data_sources: dict[DataSourceType, DataSource] = {}
        
        # 处理钩子
        self._pre_process_hooks: list[Callable[[NoteData], Awaitable[NoteData]]] = []
        self._post_process_hooks: list[Callable[[AnalysisResult], Awaitable[AnalysisResult]]] = []
        
        logger.info(f"Pipeline initialized with LLM: {self.llm.provider_name}")
    
    def register_data_source(self, source: DataSource) -> None:
        """注册数据源"""
        self._data_sources[source.source_type] = source
        logger.info(f"Registered data source: {source.source_type}")
    
    def add_pre_process_hook(
        self,
        hook: Callable[[NoteData], Awaitable[NoteData]],
    ) -> None:
        """添加预处理钩子"""
        self._pre_process_hooks.append(hook)
    
    def add_post_process_hook(
        self,
        hook: Callable[[AnalysisResult], Awaitable[AnalysisResult]],
    ) -> None:
        """添加后处理钩子"""
        self._post_process_hooks.append(hook)
    
    async def process_note(
        self,
        note: NoteData,
        template_name: str | None = None,
    ) -> AnalysisResult:
        """
        处理单条笔记
        
        Args:
            note: 笔记数据
            template_name: Prompt 模板名称，为空则自动选择
            
        Returns:
            AnalysisResult: 分析结果
        """
        start_time = time.time()
        
        try:
            # 1. 预处理钩子
            for hook in self._pre_process_hooks:
                note = await hook(note)
            
            # 2. 文本清洗
            cleaned_content = self.cleaner.clean(note.full_text)
            if not cleaned_content:
                return AnalysisResult.empty(
                    note_id=note.id,
                    source=note.source,
                    error="Empty content after cleaning",
                )
            
            # 3. 选择模板并构建 Prompt
            if not template_name:
                template_name = self.prompt_manager.select_template(note.content_type)
            
            system_prompt, user_prompt = self.prompt_manager.build_prompt(
                template_name=template_name,
                note=note,
            )
            
            # 4. 调用 LLM
            logger.debug(f"Processing note {note.id} with template {template_name}")
            response = await self.llm.chat_completion(
                system_prompt=system_prompt,
                user_content=user_prompt,
            )
            
            # 5. 解析响应
            response_data = self.cleaner.parse_response(response)
            
            # 6. 构建结果
            processing_time = time.time() - start_time
            result = self.parser.parse(
                response_data=response_data,
                note_id=note.id,
                source=note.source,
                model_used=self.llm.get_config().model,
                processing_time=processing_time,
            )
            
            # 7. 后处理钩子
            for hook in self._post_process_hooks:
                result = await hook(result)
            
            logger.info(
                f"Processed note {note.id}: sentiment={result.sentiment}, "
                f"intent={result.user_intent}, time={processing_time:.2f}s"
            )
            return result
            
        except Exception as e:
            logger.error(f"Failed to process note {note.id}: {e}")
            return AnalysisResult.empty(
                note_id=note.id,
                source=note.source,
                error=str(e),
            )
    
    async def process_batch(
        self,
        notes: list[NoteData],
        template_name: str | None = None,
    ) -> BatchAnalysisResult:
        """
        批量处理笔记
        
        使用信号量控制并发数量
        
        Args:
            notes: 笔记列表
            template_name: Prompt 模板名称
            
        Returns:
            BatchAnalysisResult: 批量处理结果
        """
        start_time = time.time()
        semaphore = asyncio.Semaphore(self.concurrency)
        
        async def process_with_semaphore(note: NoteData) -> AnalysisResult:
            async with semaphore:
                return await self.process_note(note, template_name)
        
        # 并发处理
        results = await asyncio.gather(
            *[process_with_semaphore(note) for note in notes],
            return_exceptions=True,
        )
        
        # 统计结果
        analysis_results = []
        success_count = 0
        failed_count = 0
        
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Batch processing error for note {i}: {result}")
                analysis_results.append(
                    AnalysisResult.empty(
                        note_id=notes[i].id if i < len(notes) else "unknown",
                        source=notes[i].source if i < len(notes) else DataSourceType.MOCK,
                        error=str(result),
                    )
                )
                failed_count += 1
            else:
                analysis_results.append(result)
                if result.error:
                    failed_count += 1
                else:
                    success_count += 1
        
        processing_time = time.time() - start_time
        logger.info(
            f"Batch processing complete: {success_count} success, "
            f"{failed_count} failed, {processing_time:.2f}s total"
        )
        
        return BatchAnalysisResult(
            results=analysis_results,
            total_count=len(notes),
            success_count=success_count,
            failed_count=failed_count,
            processing_time=processing_time,
        )
    
    async def fetch_and_process(
        self,
        source_type: DataSourceType,
        keyword: str,
        city: str = "",
        limit: int = 20,
        template_name: str | None = None,
    ) -> BatchAnalysisResult:
        """
        从数据源获取数据并处理
        
        完整的 ETL 流程
        
        Args:
            source_type: 数据源类型
            keyword: 搜索关键词
            city: 城市
            limit: 数量限制
            template_name: Prompt 模板
            
        Returns:
            BatchAnalysisResult: 批量处理结果
        """
        if source_type not in self._data_sources:
            raise ValueError(
                f"Data source {source_type} not registered. "
                f"Available: {list(self._data_sources.keys())}"
            )
        
        source = self._data_sources[source_type]
        
        # 1. 获取数据
        logger.info(f"Fetching data from {source_type}: keyword={keyword}, city={city}")
        notes = await source.fetch_notes(
            keyword=keyword,
            city=city,
            limit=limit,
        )
        
        if not notes:
            logger.warning(f"No notes found for keyword: {keyword}")
            return BatchAnalysisResult(total_count=0)
        
        logger.info(f"Fetched {len(notes)} notes from {source_type}")
        
        # 2. 批量处理
        return await self.process_batch(notes, template_name)


# ==================== 便捷函数 ====================

async def process_single_note(
    title: str,
    content: str,
    source: DataSourceType = DataSourceType.MOCK,
    tags: list[str] | None = None,
    location: str = "",
    **kwargs,
) -> AnalysisResult:
    """
    处理单条笔记的便捷函数
    
    Args:
        title: 标题
        content: 内容
        source: 数据来源
        tags: 标签
        location: 地点
        
    Returns:
        AnalysisResult: 分析结果
    """
    note = NoteData(
        id=f"temp_{int(time.time())}",
        source=source,
        title=title,
        content=content,
        tags=tags or [],
        location=location,
        **kwargs,
    )
    
    pipeline = Pipeline()
    return await pipeline.process_note(note)


def create_pipeline(
    api_key: str | None = None,
    concurrency: int = 3,
) -> Pipeline:
    """
    创建流水线实例的便捷函数
    
    Args:
        api_key: 火山引擎 API Key
        concurrency: 并发数
        
    Returns:
        Pipeline: 流水线实例
    """
    from .volcengine_provider import create_volcengine_provider
    
    llm = create_volcengine_provider(api_key) if api_key else VolcengineProvider()
    return Pipeline(llm_provider=llm, concurrency=concurrency)
