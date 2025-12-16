"""
LLM Analysis API Endpoints

提供内容分析功能的 API 接口
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel, Field
from loguru import logger

from ..services.llm import (
    Pipeline,
    MockDataSource,
    XiaohongshuDataSource,
    DataSourceType,
    ContentType,
    NoteData,
    AnalysisResult,
    BatchAnalysisResult,
)

router = APIRouter(prefix="/analyze", tags=["Analysis"])

# 全局 Pipeline 实例
_pipeline: Pipeline | None = None


def get_pipeline() -> Pipeline:
    """获取或创建 Pipeline 实例"""
    global _pipeline
    if _pipeline is None:
        _pipeline = Pipeline(concurrency=3)
        
        # 注册数据源
        _pipeline.register_data_source(MockDataSource())
        logger.info("Registered MockDataSource")
        
        # 尝试注册小红书数据源
        try:
            _pipeline.register_data_source(XiaohongshuDataSource())
            logger.info("Registered XiaohongshuDataSource")
        except Exception as e:
            logger.warning(f"XiaohongshuDataSource not available: {e}")
    
    return _pipeline


# ==================== Request/Response Models ====================

class AnalyzeTextRequest(BaseModel):
    """单条文本分析请求"""
    title: str = Field(..., description="标题", max_length=200)
    content: str = Field(..., description="内容", max_length=5000)
    tags: list[str] = Field(default_factory=list, description="标签")
    location: str = Field(default="", description="地点")
    city: str = Field(default="", description="城市")
    content_type: str = Field(default="general", description="内容类型")


class AnalyzeSearchRequest(BaseModel):
    """搜索并分析请求"""
    keyword: str = Field(..., description="搜索关键词", min_length=1)
    city: str = Field(default="", description="城市")
    source: str = Field(default="mock", description="数据源: mock, xiaohongshu")
    limit: int = Field(default=5, ge=1, le=20, description="数量限制")
    template: str | None = Field(default=None, description="Prompt 模板名称")


class AnalyzeResponse(BaseModel):
    """分析响应"""
    success: bool
    data: AnalysisResult | None = None
    error: str | None = None


class BatchAnalyzeResponse(BaseModel):
    """批量分析响应"""
    success: bool
    data: BatchAnalysisResult | None = None
    error: str | None = None


# ==================== API Endpoints ====================

@router.post("/text", response_model=AnalyzeResponse)
async def analyze_text(request: AnalyzeTextRequest):
    """
    分析单条文本内容
    
    使用 LLM 分析文本，提取情感、关键词、摘要等信息。
    
    **注意**: 需要配置 VOLCENGINE_API_KEY 环境变量
    """
    try:
        pipeline = get_pipeline()
        
        # 构建 NoteData
        content_type_map = {
            "attraction": ContentType.ATTRACTION,
            "dining": ContentType.DINING,
            "hotel": ContentType.HOTEL,
            "commute": ContentType.COMMUTE,
            "general": ContentType.GENERAL,
        }
        
        note = NoteData(
            id=f"api_{hash(request.title + request.content) & 0xFFFFFFFF:08x}",
            source=DataSourceType.MOCK,
            title=request.title,
            content=request.content,
            tags=request.tags,
            location=request.location,
            city=request.city,
            content_type=content_type_map.get(request.content_type, ContentType.GENERAL),
        )
        
        # 分析
        result = await pipeline.process_note(note)
        
        return AnalyzeResponse(
            success=not bool(result.error),
            data=result,
            error=result.error if result.error else None,
        )
        
    except Exception as e:
        logger.error(f"Analyze text failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search", response_model=BatchAnalyzeResponse)
async def analyze_search(request: AnalyzeSearchRequest):
    """
    搜索并分析内容
    
    从指定数据源搜索内容，然后使用 LLM 进行分析。
    
    **数据源**:
    - `mock`: 使用模拟数据（测试用）
    - `xiaohongshu`: 从小红书获取数据（需要先配置 MediaCrawler）
    
    **注意**: 需要配置 VOLCENGINE_API_KEY 环境变量
    """
    try:
        pipeline = get_pipeline()
        
        # 映射数据源类型
        source_map = {
            "mock": DataSourceType.MOCK,
            "xiaohongshu": DataSourceType.XIAOHONGSHU,
            "xhs": DataSourceType.XIAOHONGSHU,
        }
        
        source_type = source_map.get(request.source.lower())
        if not source_type:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown source: {request.source}. Available: mock, xiaohongshu"
            )
        
        # 执行搜索和分析
        result = await pipeline.fetch_and_process(
            source_type=source_type,
            keyword=request.keyword,
            city=request.city,
            limit=request.limit,
            template_name=request.template,
        )
        
        return BatchAnalyzeResponse(
            success=result.success_count > 0,
            data=result,
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Analyze search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates")
async def list_templates():
    """
    获取可用的 Prompt 模板列表
    """
    from ..services.llm import DefaultPromptManager
    
    manager = DefaultPromptManager()
    templates = manager.list_templates()
    
    return {
        "templates": templates,
        "descriptions": {
            "travel_analysis": "通用旅游内容分析（景点攻略）",
            "dining_analysis": "美食探店分析",
            "hotel_analysis": "酒店住宿分析",
        }
    }


@router.get("/status")
async def pipeline_status():
    """
    获取 Pipeline 状态
    
    返回当前配置和可用数据源
    """
    pipeline = get_pipeline()
    
    # 从 pipeline 的 config 读取 API Key 状态
    api_key_set = bool(pipeline.llm.get_config().api_key)
    
    return {
        "llm_provider": pipeline.llm.provider_name,
        "llm_model": pipeline.llm.get_config().model,
        "api_key_configured": api_key_set,
        "registered_sources": [s.value for s in pipeline._data_sources.keys()],
        "concurrency": pipeline.concurrency,
    }


@router.post("/mock-demo")
async def mock_demo():
    """
    运行 Mock 数据演示
    
    使用模拟数据测试完整的分析流程，无需配置 API Key。
    """
    pipeline = get_pipeline()
    
    # 获取 Mock 数据
    mock_source = MockDataSource()
    notes = await mock_source.fetch_notes(keyword="长沙旅游", limit=1)
    
    if not notes:
        return {"success": False, "error": "No mock data available"}
    
    note = notes[0]
    
    # 返回数据结构（不调用 LLM）
    return {
        "success": True,
        "note": {
            "id": note.id,
            "title": note.title,
            "content": note.content[:200] + "...",
            "tags": note.tags,
            "engagement": {
                "likes": note.likes,
                "collects": note.collects,
                "comments": note.comments,
            }
        },
        "message": "Mock data retrieved. Call /analyze/text to analyze with LLM.",
    }
