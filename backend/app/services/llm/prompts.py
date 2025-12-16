"""
Prompt Manager and Templates

管理和组装各类 Prompt 模板
"""
from .interfaces import PromptManager
from .models import PromptTemplate, NoteData, ContentType


# ==================== Prompt 模板定义 ====================

TRAVEL_ANALYSIS_SYSTEM_PROMPT = """你是一位资深的社交媒体分析师，专注于旅游内容分析。

你的任务是分析用户发布的旅游相关笔记，提取关键信息并给出结构化的分析结果。

分析维度：
1. **情感倾向**：判断笔记的整体情感（positive/negative/neutral/mixed）
2. **情感分数**：1-5分，5分最正面
3. **SEO关键词**：提取3-5个核心关键词
4. **内容摘要**：50字以内的精炼摘要
5. **用户意图**：种草推荐(recommend)、拔草避坑(warn)、体验评测(review)、求助提问(question)、经验分享(share)
6. **地点提取**：识别笔记中提到的具体地点
7. **价格信息**：如有提及价格，提取出来
8. **实用建议**：提取对读者有用的建议
9. **内容质量**：1-5分评估内容价值
10. **广告判断**：是否疑似商业广告

输出要求：
- 必须输出纯净的JSON格式
- 不要包含markdown代码块标记
- 不要添加任何额外解释文字
- 所有字段必须填写，没有信息则留空字符串或空数组

JSON输出格式：
{
    "sentiment": "positive|negative|neutral|mixed",
    "sentiment_score": 1-5,
    "sentiment_reason": "判断理由",
    "keywords": ["关键词1", "关键词2", "关键词3"],
    "summary": "50字以内摘要",
    "user_intent": "recommend|warn|review|question|share",
    "places": ["地点1", "地点2"],
    "price_info": "价格信息",
    "tips": ["建议1", "建议2"],
    "quality_score": 1-5,
    "is_ad": false
}"""

TRAVEL_ANALYSIS_USER_TEMPLATE = """请分析以下旅游笔记：

【标题】
{title}

【内容】
{content}

【标签】
{tags}

【地点】
{location}

【互动数据】
点赞: {likes} | 收藏: {collects} | 评论: {comments}

请按要求输出JSON分析结果："""


DINING_ANALYSIS_SYSTEM_PROMPT = """你是一位资深的美食探店分析师。

你的任务是分析美食探店类笔记，提取餐厅信息和用餐体验。

分析维度：
1. 餐厅名称和地址
2. 人均消费
3. 推荐菜品
4. 环境评价
5. 服务评价
6. 口味评价
7. 整体推荐度
8. 是否值得排队

输出JSON格式：
{
    "sentiment": "positive|negative|neutral|mixed",
    "sentiment_score": 1-5,
    "keywords": ["关键词1", "关键词2", "关键词3"],
    "summary": "50字以内摘要",
    "user_intent": "recommend|warn|review|question|share",
    "restaurant_name": "餐厅名",
    "price_per_person": "人均消费",
    "recommended_dishes": ["菜品1", "菜品2"],
    "environment_score": 1-5,
    "service_score": 1-5,
    "taste_score": 1-5,
    "worth_queuing": true|false,
    "tips": ["建议1"],
    "is_ad": false
}"""


HOTEL_ANALYSIS_SYSTEM_PROMPT = """你是一位资深的酒店住宿分析师。

你的任务是分析酒店/民宿相关笔记，提取住宿体验信息。

分析维度：
1. 酒店名称和位置
2. 房型和价格
3. 设施评价
4. 服务评价
5. 卫生评价
6. 交通便利度
7. 性价比
8. 适合人群

输出JSON格式：
{
    "sentiment": "positive|negative|neutral|mixed",
    "sentiment_score": 1-5,
    "keywords": ["关键词1", "关键词2", "关键词3"],
    "summary": "50字以内摘要",
    "user_intent": "recommend|warn|review|question|share",
    "hotel_name": "酒店名",
    "room_type": "房型",
    "price_range": "价格区间",
    "facility_score": 1-5,
    "service_score": 1-5,
    "hygiene_score": 1-5,
    "location_score": 1-5,
    "value_score": 1-5,
    "suitable_for": ["情侣", "家庭"],
    "tips": ["建议1"],
    "is_ad": false
}"""


# ==================== 模板注册表 ====================

TEMPLATES = {
    "travel_analysis": PromptTemplate(
        name="travel_analysis",
        system_prompt=TRAVEL_ANALYSIS_SYSTEM_PROMPT,
        user_prompt_template=TRAVEL_ANALYSIS_USER_TEMPLATE,
        output_format="json",
    ),
    "dining_analysis": PromptTemplate(
        name="dining_analysis",
        system_prompt=DINING_ANALYSIS_SYSTEM_PROMPT,
        user_prompt_template=TRAVEL_ANALYSIS_USER_TEMPLATE,
        output_format="json",
    ),
    "hotel_analysis": PromptTemplate(
        name="hotel_analysis",
        system_prompt=HOTEL_ANALYSIS_SYSTEM_PROMPT,
        user_prompt_template=TRAVEL_ANALYSIS_USER_TEMPLATE,
        output_format="json",
    ),
}


# ==================== Prompt 管理器实现 ====================

class DefaultPromptManager(PromptManager):
    """
    默认 Prompt 管理器
    
    管理预定义的 Prompt 模板，支持动态扩展
    """
    
    def __init__(self):
        self._templates = TEMPLATES.copy()
    
    def get_template(self, name: str) -> PromptTemplate:
        """获取模板"""
        if name not in self._templates:
            raise ValueError(f"Template '{name}' not found. Available: {list(self._templates.keys())}")
        return self._templates[name]
    
    def register_template(self, template: PromptTemplate) -> None:
        """注册新模板"""
        self._templates[template.name] = template
    
    def list_templates(self) -> list[str]:
        """列出所有模板名称"""
        return list(self._templates.keys())
    
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
        template = self.get_template(template_name)
        
        # 格式化用户提示词
        user_prompt = template.user_prompt_template.format(
            title=note.title,
            content=note.content[:2000],  # 限制内容长度
            tags=", ".join(note.tags) if note.tags else "无",
            location=note.location or note.city or "未知",
            likes=note.likes,
            collects=note.collects,
            comments=note.comments,
            **kwargs,
        )
        
        return template.system_prompt, user_prompt
    
    def select_template(self, content_type: ContentType) -> str:
        """
        根据内容类型选择合适的模板
        
        Args:
            content_type: 内容类型
            
        Returns:
            str: 模板名称
        """
        mapping = {
            ContentType.ATTRACTION: "travel_analysis",
            ContentType.DINING: "dining_analysis",
            ContentType.HOTEL: "hotel_analysis",
            ContentType.COMMUTE: "travel_analysis",
            ContentType.GENERAL: "travel_analysis",
        }
        return mapping.get(content_type, "travel_analysis")
