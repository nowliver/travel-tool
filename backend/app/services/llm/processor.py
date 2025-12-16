"""
Data Processor Implementation

文本清洗和响应解析
"""
import json
import re
from typing import Any

from loguru import logger

from .interfaces import DataProcessor
from .models import AnalysisResult, SentimentType, UserIntent, DataSourceType


class TextCleaner(DataProcessor):
    """
    文本清洗器
    
    清洗社交媒体文本：去除 Emoji、广告标签、特殊字符等
    """
    
    # Emoji 正则 (Unicode ranges)
    EMOJI_PATTERN = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map symbols
        "\U0001F1E0-\U0001F1FF"  # flags
        "\U00002702-\U000027B0"
        "\U000024C2-\U0001F251"
        "]+",
        flags=re.UNICODE,
    )
    
    # 常见广告标签
    AD_PATTERNS = [
        r"#广告#",
        r"#推广#",
        r"#合作#",
        r"@\S+\s*",  # @mentions
        r"点击链接.*",
        r"戳链接.*",
        r"复制.*口令.*",
        r"优惠券.*",
        r"领取.*福利.*",
    ]
    
    # 小红书特有标签
    XHS_PATTERNS = [
        r"\[.*?\]",  # [表情]
        r"#\S+#",    # #话题#
    ]
    
    def __init__(
        self,
        remove_emoji: bool = True,
        remove_ads: bool = True,
        remove_hashtags: bool = False,
        min_length: int = 10,
    ):
        self.remove_emoji = remove_emoji
        self.remove_ads = remove_ads
        self.remove_hashtags = remove_hashtags
        self.min_length = min_length
    
    def clean(self, text: str) -> str:
        """
        清洗文本
        
        Args:
            text: 原始文本
            
        Returns:
            str: 清洗后的文本
        """
        if not text:
            return ""
        
        result = text
        
        # 移除 Emoji
        if self.remove_emoji:
            result = self.EMOJI_PATTERN.sub("", result)
        
        # 移除广告标签
        if self.remove_ads:
            for pattern in self.AD_PATTERNS:
                result = re.sub(pattern, "", result, flags=re.IGNORECASE)
        
        # 移除话题标签 (可选)
        if self.remove_hashtags:
            for pattern in self.XHS_PATTERNS:
                result = re.sub(pattern, "", result)
        
        # 清理多余空白
        result = re.sub(r"\s+", " ", result)
        result = result.strip()
        
        # 检查最小长度
        if len(result) < self.min_length:
            logger.debug(f"Text too short after cleaning: {len(result)} chars")
        
        return result
    
    def parse_response(self, response: str) -> dict:
        """
        解析 LLM 响应为字典
        
        Args:
            response: LLM 原始响应
            
        Returns:
            dict: 解析后的数据
        """
        if not response:
            return {}
        
        # 清理 markdown 代码块
        cleaned = response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parse error: {e}")
            # 尝试提取 JSON 对象
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group())
                except json.JSONDecodeError:
                    pass
            return {"raw_response": response, "parse_error": str(e)}


class ResponseParser:
    """
    LLM 响应解析器
    
    将 LLM 返回的 JSON 转换为 AnalysisResult
    """
    
    # 情感映射
    SENTIMENT_MAP = {
        "positive": SentimentType.POSITIVE,
        "negative": SentimentType.NEGATIVE,
        "neutral": SentimentType.NEUTRAL,
        "mixed": SentimentType.MIXED,
        "种草": SentimentType.POSITIVE,
        "拔草": SentimentType.NEGATIVE,
        "中立": SentimentType.NEUTRAL,
    }
    
    # 意图映射
    INTENT_MAP = {
        "recommend": UserIntent.RECOMMEND,
        "warn": UserIntent.WARN,
        "review": UserIntent.REVIEW,
        "question": UserIntent.QUESTION,
        "share": UserIntent.SHARE,
        "种草": UserIntent.RECOMMEND,
        "拔草": UserIntent.WARN,
        "评测": UserIntent.REVIEW,
        "提问": UserIntent.QUESTION,
        "分享": UserIntent.SHARE,
    }
    
    def parse(
        self,
        response_data: dict,
        note_id: str,
        source: DataSourceType,
        model_used: str = "",
        processing_time: float = 0.0,
    ) -> AnalysisResult:
        """
        解析 LLM 响应为 AnalysisResult
        
        Args:
            response_data: LLM 返回的 JSON 数据
            note_id: 笔记ID
            source: 数据来源
            model_used: 使用的模型
            processing_time: 处理耗时
            
        Returns:
            AnalysisResult: 结构化分析结果
        """
        # 检查是否有解析错误
        if "parse_error" in response_data:
            return AnalysisResult.empty(
                note_id=note_id,
                source=source,
                error=response_data.get("parse_error", "Parse failed"),
            )
        
        # 提取情感
        sentiment_raw = response_data.get("sentiment", "neutral")
        sentiment = self.SENTIMENT_MAP.get(
            sentiment_raw.lower() if isinstance(sentiment_raw, str) else "neutral",
            SentimentType.NEUTRAL,
        )
        
        # 提取意图
        intent_raw = response_data.get("user_intent", response_data.get("intent", "share"))
        user_intent = self.INTENT_MAP.get(
            intent_raw.lower() if isinstance(intent_raw, str) else "share",
            UserIntent.SHARE,
        )
        
        # 构建结果
        return AnalysisResult(
            note_id=note_id,
            source=source,
            sentiment=sentiment,
            sentiment_score=self._safe_float(response_data.get("sentiment_score", 3.0), 3.0),
            sentiment_reason=str(response_data.get("sentiment_reason", "")),
            keywords=self._safe_list(response_data.get("keywords", [])),
            summary=str(response_data.get("summary", ""))[:100],
            user_intent=user_intent,
            places=self._safe_list(response_data.get("places", [])),
            price_info=str(response_data.get("price_info", "")),
            tips=self._safe_list(response_data.get("tips", [])),
            quality_score=self._safe_float(response_data.get("quality_score", 3.0), 3.0),
            is_ad=bool(response_data.get("is_ad", False)),
            model_used=model_used,
            processing_time=processing_time,
        )
    
    def _safe_float(self, value: Any, default: float) -> float:
        """安全转换为浮点数"""
        try:
            result = float(value)
            return max(1.0, min(5.0, result))  # 限制在 1-5 范围
        except (TypeError, ValueError):
            return default
    
    def _safe_list(self, value: Any) -> list[str]:
        """安全转换为字符串列表"""
        if isinstance(value, list):
            return [str(item) for item in value]
        if isinstance(value, str):
            return [value] if value else []
        return []
