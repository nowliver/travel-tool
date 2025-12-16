"""
火山引擎 (Volcengine) LLM Provider

使用 OpenAI 兼容模式调用豆包模型。
"""
import os
import asyncio
from typing import AsyncIterator

from openai import AsyncOpenAI, APIError, APITimeoutError, RateLimitError
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)
from loguru import logger

from .interfaces import LLMProvider
from .models import LLMConfig


class VolcengineProvider(LLMProvider):
    """
    火山引擎 LLM 提供商
    
    使用 OpenAI SDK 的兼容模式调用豆包大模型。
    
    环境变量:
        VOLCENGINE_API_KEY: API 密钥
        VOLCENGINE_MODEL: 模型名称 (默认: doubao-seed-1.6-flash)
        VOLCENGINE_BASE_URL: API 地址
    """
    
    # 火山引擎 Endpoint ID 映射
    MODEL_ENDPOINTS = {
        "doubao-seed-1.6-flash": "ep-20241215000000-xxxxx",  # 需要替换为实际 endpoint
        "doubao-lite-32k": "ep-20241215000000-xxxxx",
    }
    
    def __init__(self, config: LLMConfig | None = None):
        """
        初始化火山引擎提供商
        
        Args:
            config: LLM 配置，为空则从环境变量读取
        """
        self._config = config or self._load_config_from_env()
        self._client = self._create_client()
        logger.info(f"VolcengineProvider initialized with model: {self._config.model}")
    
    def _load_config_from_env(self) -> LLMConfig:
        """从配置系统加载配置"""
        # 优先使用 pydantic-settings 配置，回退到环境变量
        try:
            from ...core.config import get_settings
            settings = get_settings()
            api_key = settings.VOLCENGINE_API_KEY or ""
            model = settings.VOLCENGINE_MODEL
            base_url = settings.VOLCENGINE_BASE_URL
            temperature = settings.VOLCENGINE_TEMPERATURE
            max_tokens = settings.VOLCENGINE_MAX_TOKENS
        except Exception as e:
            logger.warning(f"Failed to load from settings, falling back to env: {e}")
            api_key = os.environ.get("VOLCENGINE_API_KEY", "")
            model = os.environ.get("VOLCENGINE_MODEL", "doubao-seed-1.6-flash")
            base_url = os.environ.get("VOLCENGINE_BASE_URL", "https://ark.cn-beijing.volces.com/api/v3")
            temperature = float(os.environ.get("VOLCENGINE_TEMPERATURE", "0.3"))
            max_tokens = int(os.environ.get("VOLCENGINE_MAX_TOKENS", "4096"))
        
        if not api_key:
            logger.warning("VOLCENGINE_API_KEY not configured")
        
        return LLMConfig(
            provider="volcengine",
            model=model,
            api_key=api_key,
            base_url=base_url,
            temperature=temperature,
            max_tokens=max_tokens,
            timeout=int(os.environ.get("VOLCENGINE_TIMEOUT", "60")),
            max_retries=int(os.environ.get("VOLCENGINE_MAX_RETRIES", "3")),
        )
    
    def _create_client(self) -> AsyncOpenAI:
        """创建异步 OpenAI 客户端"""
        return AsyncOpenAI(
            api_key=self._config.api_key,
            base_url=self._config.base_url,
            timeout=self._config.timeout,
        )
    
    @property
    def provider_name(self) -> str:
        return "volcengine"
    
    def get_config(self) -> LLMConfig:
        return self._config
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((APITimeoutError, RateLimitError)),
        before_sleep=lambda retry_state: logger.warning(
            f"Retrying LLM call, attempt {retry_state.attempt_number}"
        ),
    )
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
            **kwargs: 覆盖默认参数
            
        Returns:
            str: 模型响应
        """
        temperature = kwargs.get("temperature", self._config.temperature)
        max_tokens = kwargs.get("max_tokens", self._config.max_tokens)
        model = kwargs.get("model", self._config.model)
        
        try:
            logger.debug(f"Calling Volcengine API, model: {model}")
            
            response = await self._client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            
            result = response.choices[0].message.content or ""
            logger.debug(f"Volcengine response length: {len(result)}")
            return result
            
        except APIError as e:
            logger.error(f"Volcengine API error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in chat_completion: {e}")
            raise
    
    async def chat_completion_stream(
        self,
        system_prompt: str,
        user_content: str,
        **kwargs,
    ) -> AsyncIterator[str]:
        """
        流式对话补全
        """
        temperature = kwargs.get("temperature", self._config.temperature)
        max_tokens = kwargs.get("max_tokens", self._config.max_tokens)
        model = kwargs.get("model", self._config.model)
        
        try:
            stream = await self._client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            logger.error(f"Stream error: {e}")
            raise
    
    async def analyze_note(
        self,
        system_prompt: str,
        note_content: str,
        **kwargs,
    ) -> dict:
        """
        分析笔记内容 (便捷方法)
        
        返回解析后的 JSON 结果
        """
        import json
        
        response = await self.chat_completion(
            system_prompt=system_prompt,
            user_content=note_content,
            **kwargs,
        )
        
        # 尝试解析 JSON
        try:
            # 清理可能的 markdown 代码块标记
            cleaned = response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            
            return json.loads(cleaned.strip())
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse JSON response: {e}")
            return {"raw_response": response, "parse_error": str(e)}


# 便捷函数：创建默认提供商实例
def create_volcengine_provider(api_key: str | None = None) -> VolcengineProvider:
    """
    创建火山引擎提供商实例
    
    Args:
        api_key: API 密钥，为空则从环境变量读取
    """
    if api_key:
        config = LLMConfig(
            provider="volcengine",
            api_key=api_key,
        )
        return VolcengineProvider(config)
    return VolcengineProvider()
