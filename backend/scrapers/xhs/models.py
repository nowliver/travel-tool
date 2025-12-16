"""Xiaohongshu data models for travel-tool integration."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class XhsNote(BaseModel):
    """小红书笔记数据模型"""
    note_id: str = Field(..., description="笔记ID")
    title: str = Field(..., description="笔记标题")
    desc: str = Field(default="", description="笔记描述/正文")
    type: str = Field(default="normal", description="笔记类型: normal/video")
    
    # 作者信息
    user_id: str = Field(default="", description="作者ID")
    nickname: str = Field(default="", description="作者昵称")
    avatar: str = Field(default="", description="作者头像URL")
    
    # 互动数据
    liked_count: int = Field(default=0, description="点赞数")
    collected_count: int = Field(default=0, description="收藏数")
    comment_count: int = Field(default=0, description="评论数")
    share_count: int = Field(default=0, description="分享数")
    
    # 媒体资源
    cover_url: str = Field(default="", description="封面图URL")
    image_urls: list[str] = Field(default_factory=list, description="图片列表")
    video_url: str = Field(default="", description="视频URL")
    
    # 标签和位置
    tags: list[str] = Field(default_factory=list, description="标签列表")
    location: str = Field(default="", description="发布位置")
    
    # 时间
    time: str = Field(default="", description="发布时间")
    last_update_time: str = Field(default="", description="最后更新时间")
    
    # 原始数据
    source_url: str = Field(default="", description="笔记链接")
    
    @property
    def note_url(self) -> str:
        """获取笔记完整URL"""
        return f"https://www.xiaohongshu.com/explore/{self.note_id}"


class XhsSearchResult(BaseModel):
    """小红书搜索结果"""
    keyword: str = Field(..., description="搜索关键词")
    notes: list[XhsNote] = Field(default_factory=list, description="笔记列表")
    total_count: int = Field(default=0, description="结果总数")
    has_more: bool = Field(default=False, description="是否有更多")
    search_time: datetime = Field(default_factory=datetime.now, description="搜索时间")


class XhsComment(BaseModel):
    """小红书评论数据模型"""
    comment_id: str = Field(..., description="评论ID")
    note_id: str = Field(..., description="所属笔记ID")
    content: str = Field(default="", description="评论内容")
    
    # 评论者信息
    user_id: str = Field(default="", description="评论者ID")
    nickname: str = Field(default="", description="评论者昵称")
    avatar: str = Field(default="", description="评论者头像")
    
    # 互动数据
    liked_count: int = Field(default=0, description="点赞数")
    sub_comment_count: int = Field(default=0, description="子评论数")
    
    # 时间
    create_time: str = Field(default="", description="评论时间")
