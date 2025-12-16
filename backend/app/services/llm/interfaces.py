"""
LLM Pipeline Interface Definitions

使用 ABC (Abstract Base Class) 定义核心接口，确保功能解耦。
所有数据源和 LLM 提供商必须实现这些接口。
"""
from abc import ABC, abstractmethod
from typing import AsyncIterator

from .models import (
    NoteData,
    AnalysisResult,
    PromptTemplate,
    LLMConfig,
    DataSourceType,
)


class DataSource(ABC):
    """
    数据源抽象接口
    
    所有数据源（小红书、携程、美团等）必须实现此接口
    """
    
    @property
    @abstractmethod
    def source_type(self) -> DataSourceType:
        """数据源类型"""
        pass
    
    @abstractmethod
    async def fetch_notes(
        self,
        keyword: str,
        city: str = "",
        limit: int = 20,
        **kwargs,
    ) -> list[NoteData]:
        """
        获取笔记数据
        
        Args:
            keyword: 搜索关键词
            city: 城市名称
            limit: 返回数量限制
            **kwargs: 其他平台特定参数
            
        Returns:
            list[NoteData]: 标准化的笔记数据列表
        """
        pass
    
    @abstractmethod
    async def fetch_note_detail(self, note_id: str) -> NoteData | None:
        """
        获取单条笔记详情
        
        Args:
            note_id: 笔记ID
            
        Returns:
            NoteData | None: 笔记数据或 None
        """
        pass


class LLMProvider(ABC):
    """
    LLM 提供商抽象接口
    
    支持火山引擎、OpenAI、Claude 等多种 LLM
    """
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """提供商名称"""
        pass
    
    @abstractmethod
    async def chat_completion(
        self,
        system_prompt: str,
        user_content: str,
        **kwargs,
    ) -> str:
        """
        对话补全
        
        Args:
            system_prompt: 系统提示词
            user_content: 用户内容
            **kwargs: 其他参数（temperature, max_tokens 等）
            
        Returns:
            str: 模型响应内容
        """
        pass
    
    @abstractmethod
    async def chat_completion_stream(
        self,
        system_prompt: str,
        user_content: str,
        **kwargs,
    ) -> AsyncIterator[str]:
        """
        流式对话补全
        
        Args:
            system_prompt: 系统提示词
            user_content: 用户内容
            
        Yields:
            str: 模型响应片段
        """
        pass
    
    @abstractmethod
    def get_config(self) -> LLMConfig:
        """获取当前配置"""
        pass


class DataProcessor(ABC):
    """
    数据处理器抽象接口
    
    负责文本清洗和响应解析
    """
    
    @abstractmethod
    def clean(self, text: str) -> str:
        """
        清洗文本
        
        Args:
            text: 原始文本
            
        Returns:
            str: 清洗后的文本
        """
        pass
    
    @abstractmethod
    def parse_response(self, response: str) -> dict:
        """
        解析 LLM 响应
        
        Args:
            response: LLM 原始响应
            
        Returns:
            dict: 解析后的结构化数据
        """
        pass


class PromptManager(ABC):
    """
    Prompt 管理器抽象接口
    
    管理和组装各类 Prompt 模板
    """
    
    @abstractmethod
    def get_template(self, name: str) -> PromptTemplate:
        """
        获取 Prompt 模板
        
        Args:
            name: 模板名称
            
        Returns:
            PromptTemplate: Prompt 模板
        """
        pass
    
    @abstractmethod
    def build_prompt(
        self,
        template_name: str,
        note: NoteData,
        **kwargs,
    ) -> tuple[str, str]:
        """
        构建完整的 Prompt
        
        Args:
            template_name: 模板名称
            note: 笔记数据
            **kwargs: 额外参数
            
        Returns:
            tuple[str, str]: (system_prompt, user_prompt)
        """
        pass


class ResultCache(ABC):
    """
    结果缓存抽象接口
    
    缓存 LLM 分析结果，避免重复处理
    """
    
    @abstractmethod
    async def get(self, note_id: str) -> AnalysisResult | None:
        """获取缓存的分析结果"""
        pass
    
    @abstractmethod
    async def set(self, result: AnalysisResult, ttl: int = 86400) -> None:
        """
        缓存分析结果
        
        Args:
            result: 分析结果
            ttl: 缓存时间(秒)，默认24小时
        """
        pass
    
    @abstractmethod
    async def delete(self, note_id: str) -> None:
        """删除缓存"""
        pass
