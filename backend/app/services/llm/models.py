"""
LLM Pipeline Data Models

定义输入输出数据结构，使用 Pydantic 确保类型安全和验证。
"""
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class DataSourceType(str, Enum):
    """数据源类型"""
    XIAOHONGSHU = "xiaohongshu"
    CTRIP = "ctrip"
    MEITUAN = "meituan"
    AMAP = "amap"
    MOCK = "mock"


class ContentType(str, Enum):
    """内容类型"""
    ATTRACTION = "attraction"  # 景点攻略
    DINING = "dining"          # 美食探店
    HOTEL = "hotel"            # 住宿推荐
    COMMUTE = "commute"        # 出行交通
    GENERAL = "general"        # 通用内容


class SentimentType(str, Enum):
    """情感倾向"""
    POSITIVE = "positive"      # 种草/推荐
    NEGATIVE = "negative"      # 拔草/避坑
    NEUTRAL = "neutral"        # 中立/客观
    MIXED = "mixed"            # 混合情感


class UserIntent(str, Enum):
    """用户意图"""
    RECOMMEND = "recommend"    # 种草推荐
    WARN = "warn"              # 拔草避坑
    REVIEW = "review"          # 体验评测
    QUESTION = "question"      # 求助提问
    SHARE = "share"            # 经验分享


# ==================== 输入数据模型 ====================

class NoteData(BaseModel):
    """
    笔记数据 - 统一输入格式
    
    无论数据来自哪个平台，都转换为此格式进行处理
    """
    # 基础信息
    id: str = Field(..., description="笔记唯一ID")
    source: DataSourceType = Field(..., description="数据来源平台")
    title: str = Field(..., description="标题")
    content: str = Field(default="", description="正文内容")
    
    # 分类信息
    content_type: ContentType = Field(default=ContentType.GENERAL, description="内容类型")
    tags: list[str] = Field(default_factory=list, description="标签列表")
    location: str = Field(default="", description="地点信息")
    city: str = Field(default="", description="城市")
    
    # 作者信息
    author_id: str = Field(default="", description="作者ID")
    author_name: str = Field(default="", description="作者昵称")
    
    # 互动数据
    likes: int = Field(default=0, description="点赞数")
    collects: int = Field(default=0, description="收藏数")
    comments: int = Field(default=0, description="评论数")
    
    # 媒体资源
    images: list[str] = Field(default_factory=list, description="图片URL列表")
    video_url: str = Field(default="", description="视频URL")
    
    # 时间信息
    publish_time: str = Field(default="", description="发布时间")
    crawl_time: datetime = Field(default_factory=datetime.now, description="爬取时间")
    
    # 原始数据
    raw_data: dict = Field(default_factory=dict, description="原始数据备份")

    @property
    def full_text(self) -> str:
        """获取完整文本（标题+内容）"""
        return f"{self.title}\n\n{self.content}"
    
    @property
    def engagement_score(self) -> float:
        """计算互动分数"""
        return self.likes + self.collects * 2 + self.comments * 1.5


# ==================== 输出数据模型 ====================

class AnalysisResult(BaseModel):
    """
    LLM 分析结果 - 统一输出格式
    """
    # 关联原始数据
    note_id: str = Field(..., description="原始笔记ID")
    source: DataSourceType = Field(..., description="数据来源")
    
    # 情感分析
    sentiment: SentimentType = Field(default=SentimentType.NEUTRAL, description="情感倾向")
    sentiment_score: float = Field(default=3.0, ge=1.0, le=5.0, description="情感分数(1-5)")
    sentiment_reason: str = Field(default="", description="情感判断理由")
    
    # 关键词提取
    keywords: list[str] = Field(default_factory=list, description="SEO关键词(3-5个)")
    
    # 内容摘要
    summary: str = Field(default="", max_length=100, description="内容摘要(50字以内)")
    
    # 用户意图
    user_intent: UserIntent = Field(default=UserIntent.SHARE, description="用户意图")
    
    # 实体提取 (旅游相关)
    places: list[str] = Field(default_factory=list, description="提及的地点")
    price_info: str = Field(default="", description="价格信息")
    tips: list[str] = Field(default_factory=list, description="实用建议")
    
    # 质量评估
    quality_score: float = Field(default=3.0, ge=1.0, le=5.0, description="内容质量分")
    is_ad: bool = Field(default=False, description="是否疑似广告")
    
    # 处理元数据
    model_used: str = Field(default="", description="使用的模型")
    processing_time: float = Field(default=0.0, description="处理耗时(秒)")
    error: str = Field(default="", description="处理错误信息")
    
    @classmethod
    def empty(cls, note_id: str, source: DataSourceType, error: str = "") -> "AnalysisResult":
        """创建空结果（用于错误处理）"""
        return cls(
            note_id=note_id,
            source=source,
            error=error or "Processing failed",
        )


class BatchAnalysisResult(BaseModel):
    """批量分析结果"""
    results: list[AnalysisResult] = Field(default_factory=list)
    total_count: int = Field(default=0)
    success_count: int = Field(default=0)
    failed_count: int = Field(default=0)
    processing_time: float = Field(default=0.0)


# ==================== 配置模型 ====================

class PromptTemplate(BaseModel):
    """Prompt 模板配置"""
    name: str = Field(..., description="模板名称")
    system_prompt: str = Field(..., description="系统提示词")
    user_prompt_template: str = Field(..., description="用户提示词模板")
    output_format: str = Field(default="json", description="输出格式")
    
    def format_user_prompt(self, **kwargs) -> str:
        """格式化用户提示词"""
        return self.user_prompt_template.format(**kwargs)


class LLMConfig(BaseModel):
    """LLM 配置"""
    provider: str = Field(default="volcengine", description="提供商")
    model: str = Field(default="doubao-seed-1.6-flash", description="模型名称")
    api_key: str = Field(default="", description="API Key (从环境变量读取)")
    base_url: str = Field(default="https://ark.cn-beijing.volces.com/api/v3", description="API Base URL")
    temperature: float = Field(default=0.3, ge=0.0, le=2.0, description="生成温度")
    max_tokens: int = Field(default=2000, description="最大token数")
    timeout: int = Field(default=60, description="请求超时(秒)")
    max_retries: int = Field(default=3, description="最大重试次数")
