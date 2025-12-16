# LiteTravel LLM 处理流程全解析

> **小红书爬取 → LLM 分析 → 前端渲染** 完整数据流文档

---

## 📊 架构总览

```
┌─────────────┐
│   前端用户   │ 输入: "长沙美食推荐"
└──────┬──────┘
       │ 1. 用户交互
       ↓
┌──────────────────────────────────────────────┐
│          Frontend (React + Zustand)          │
│  src/components/views/DiningView.tsx         │
│  - 用户输入搜索关键词                          │
│  - 调用 analyzeService.analyzeSearch()       │
└──────┬───────────────────────────────────────┘
       │ 2. HTTP POST /api/analyze/search
       │    { keyword, city, source, limit }
       ↓
┌──────────────────────────────────────────────┐
│     Backend API (FastAPI)                    │
│  backend/app/api/analyze.py                  │
│  - 接收搜索请求                               │
│  - 调用 Pipeline.fetch_and_process()         │
└──────┬───────────────────────────────────────┘
       │ 3. 数据获取
       ↓
┌──────────────────────────────────────────────┐
│     Data Source Layer                        │
│  backend/app/services/llm/data_sources.py    │
│  - MockDataSource (测试数据)                 │
│  - XiaohongshuDataSource (爬虫适配器)        │
└──────┬───────────────────────────────────────┘
       │ 4. 爬取数据
       ↓
┌──────────────────────────────────────────────┐
│     Scraper (MediaCrawler)                   │
│  scrapers/xhs/adapter.py                     │
│  - 调用 MediaCrawler 爬取小红书              │
│  - 返回 XhsNote[] (标题、内容、标签、互动)    │
└──────┬───────────────────────────────────────┘
       │ 5. 数据标准化
       ↓
┌──────────────────────────────────────────────┐
│     Data Normalization                       │
│  转换为统一的 NoteData 格式:                  │
│  - id, title, content                        │
│  - tags, location, city                      │
│  - likes, collects, comments                 │
│  - content_type (景点/美食/住宿/出行)         │
└──────┬───────────────────────────────────────┘
       │ 6. LLM 处理 Pipeline
       ↓
┌──────────────────────────────────────────────┐
│     LLM Pipeline                             │
│  backend/app/services/llm/pipeline.py        │
│                                              │
│  Step 1: TextCleaner 文本清洗                │
│    - 移除特殊字符、emoji                      │
│    - 标准化格式                               │
│                                              │
│  Step 2: PromptManager 构建 Prompt          │
│    - 根据 content_type 选择模板              │
│    - travel_analysis (景点)                  │
│    - dining_analysis (美食)                  │
│    - hotel_analysis (住宿)                   │
│                                              │
│  Step 3: LLMProvider (Volcengine)           │
│    - 调用豆包大模型 API                       │
│    - model: doubao-seed-1.6-flash                   │
│    - temperature: 0.3                        │
│    - max_tokens: 4096                        │
│                                              │
│  Step 4: ResponseParser 解析响应             │
│    - 提取 JSON 结构                          │
│    - 验证字段完整性                           │
└──────┬───────────────────────────────────────┘
       │ 7. 结构化输出
       ↓
┌──────────────────────────────────────────────┐
│     AnalysisResult                           │
│  {                                           │
│    sentiment: "positive" | "negative" | ...  │
│    user_intent: "recommendation" | ...       │
│    summary: "核心内容摘要"                    │
│    keywords: ["关键词1", "关键词2"]          │
│    places: [                                 │
│      { name: "橘子洲", type: "景点" }        │
│    ],                                        │
│    price_info: { min: 80, max: 150 },       │
│    tips: ["实用建议1", "实用建议2"],         │
│    highlights: ["亮点1", "亮点2"]            │
│  }                                           │
└──────┬───────────────────────────────────────┘
       │ 8. API 响应
       ↓
┌──────────────────────────────────────────────┐
│     BatchAnalysisResult                      │
│  {                                           │
│    results: [AnalysisResult, ...],          │
│    total_count: 5,                          │
│    success_count: 5,                        │
│    failed_count: 0,                         │
│    processing_time: 3.24                    │
│  }                                           │
└──────┬───────────────────────────────────────┘
       │ 9. 前端渲染
       ↓
┌──────────────────────────────────────────────┐
│     UI Rendering                             │
│  - AnalysisResultCard 组件展示结果           │
│  - 情感标签 (正面/负面/中性)                  │
│  - 摘要和关键词                               │
│  - 提取的地点列表                             │
│  - 价格区间                                   │
│  - 实用建议列表                               │
│  - 可展开查看详情                             │
└──────────────────────────────────────────────┘
```

---

## 🔧 核心组件详解

### 1. 前端交互层

**文件**: `src/components/views/AttractionsView.tsx` (及其他 View)

```typescript
const handleSearch = async () => {
  const response = await analyzeService.analyzeSearch({
    keyword: searchQuery,      // 用户输入
    city: confirmedCity,       // 当前城市
    source: "mock",            // 数据源: mock 或 xiaohongshu
    limit: 5,                  // 返回数量
  });
  
  if (response.success) {
    setSearchResults(response.data.results);
  }
};
```

**关键状态**:
- `isSearching`: 加载状态
- `searchError`: 错误信息
- `searchResults`: AnalysisResult[]

---

### 2. API 客户端

**文件**: `src/services/api/analyzeService.ts`

```typescript
export const analyzeService = {
  async analyzeSearch(request: AnalyzeSearchRequest) {
    return apiClient.post<BatchAnalysisResponse>(
      '/analyze/search',
      request,
      false  // 不需要认证
    );
  }
};
```

**Mock 回退机制**:
```typescript
// 如果后端不可用，自动使用 mock
try {
  return await realService.analyzeSearch(request);
} catch {
  return mockAnalyzeService.analyzeSearch(request);
}
```

---

### 3. 后端 API 端点

**文件**: `backend/app/api/analyze.py`

```python
@router.post("/search", response_model=BatchAnalyzeResponse)
async def analyze_search(request: AnalyzeSearchRequest):
    pipeline = get_pipeline()
    
    # 执行搜索和分析
    result = await pipeline.fetch_and_process(
        source_type=DataSourceType.MOCK,  # 或 XIAOHONGSHU
        keyword=request.keyword,
        city=request.city,
        limit=request.limit,
    )
    
    return BatchAnalyzeResponse(
        success=result.success_count > 0,
        data=result,
    )
```

---

### 4. 数据源适配器

#### Mock 数据源 (测试用)

**文件**: `backend/app/services/llm/data_sources.py`

```python
class MockDataSource(DataSource):
    MOCK_NOTES = [
        {
            "id": "mock_001",
            "title": "长沙三天两夜超全攻略！",
            "content": "Day1: 橘子洲头...",
            "tags": ["长沙旅游", "攻略"],
            "likes": 5234,
        },
        # ...
    ]
    
    async def fetch_notes(self, keyword, city, limit):
        return [NoteData(**note) for note in self.MOCK_NOTES[:limit]]
```

#### 小红书数据源

```python
class XiaohongshuDataSource(DataSource):
    async def fetch_notes(self, keyword, city, limit):
        # 1. 调用 XhsAdapter
        result = await self.adapter.search(keyword, limit)
        
        # 2. 转换为 NoteData
        notes = [self._convert_note(xhs_note, city) 
                 for xhs_note in result.notes]
        
        return notes
```

---

### 5. LLM Pipeline 核心

**文件**: `backend/app/services/llm/pipeline.py`

#### Step 1: 文本清洗

```python
class TextCleaner:
    def clean(self, text: str) -> str:
        # 移除 emoji、特殊字符
        text = self.remove_emojis(text)
        # 标准化空白字符
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
```

#### Step 2: Prompt 构建

```python
class DefaultPromptManager:
    TEMPLATES = {
        "travel_analysis": {
            "system": "你是旅游内容分析专家...",
            "user": """分析以下内容：
标题: {title}
内容: {content}
标签: {tags}

返回 JSON:
{
  "sentiment": "positive",
  "summary": "...",
  "keywords": [...],
  "places": [...]
}"""
        }
    }
```

#### Step 3: LLM 调用

```python
class VolcengineProvider:
    async def chat_completion(self, system_prompt, user_content):
        response = await self._client.chat.completions.create(
            model="doubao-seed-1.6-flash",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            temperature=0.3,
            max_tokens=4096,
        )
        return response.choices[0].message.content
```

#### Step 4: 响应解析

```python
class ResponseParser:
    def parse(self, response_data: dict) -> AnalysisResult:
        return AnalysisResult(
            sentiment=response_data.get("sentiment", "neutral"),
            user_intent=response_data.get("user_intent", "unknown"),
            summary=response_data.get("summary", ""),
            keywords=response_data.get("keywords", []),
            places=self._parse_places(response_data.get("places", [])),
            price_info=self._parse_price(response_data.get("price_info")),
            tips=response_data.get("tips", []),
        )
```

---

### 6. 批量处理与并发控制

```python
async def process_batch(self, notes: list[NoteData]):
    semaphore = asyncio.Semaphore(self.concurrency)  # 最多 3 个并发
    
    async def process_with_semaphore(note):
        async with semaphore:
            return await self.process_note(note)
    
    # 并发处理所有笔记
    results = await asyncio.gather(
        *[process_with_semaphore(note) for note in notes]
    )
    
    return BatchAnalysisResult(
        results=results,
        success_count=sum(1 for r in results if not r.error),
    )
```

---

## 🎯 数据模型

### NoteData (输入)

```python
class NoteData:
    id: str
    source: DataSourceType  # MOCK | XIAOHONGSHU
    title: str
    content: str
    content_type: ContentType  # ATTRACTION | DINING | HOTEL | COMMUTE
    tags: list[str]
    location: str
    city: str
    likes: int
    collects: int
    comments: int
    images: list[str]
```

### AnalysisResult (输出)

```python
class AnalysisResult:
    note_id: str
    source: DataSourceType
    sentiment: str  # positive | negative | neutral
    user_intent: str  # recommendation | warning | sharing | questioning
    summary: str
    keywords: list[str]
    places: list[PlaceInfo]
    price_info: PriceInfo | None
    tips: list[str]
    highlights: list[str]
    concerns: list[str]
    metadata: dict
    error: str | None
```

---

## 🚀 完整调用示例

### 测试 Mock 数据流程

```bash
# 1. 启动后端
cd backend && uv run uvicorn main:app --reload --port 8000

# 2. 测试搜索 API
curl -X POST http://localhost:8000/api/analyze/search \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "长沙美食",
    "city": "长沙",
    "source": "mock",
    "limit": 3
  }'

# 3. 查看状态
curl http://localhost:8000/api/analyze/status
```

### 前端调用

```typescript
// 1. 用户点击搜索
<button onClick={handleSearch}>AI 智能分析</button>

// 2. 调用后端
const response = await analyzeService.analyzeSearch({
  keyword: "长沙美食推荐",
  city: "长沙",
  source: "mock",
  limit: 5,
});

// 3. 渲染结果
{response.data.results.map(result => (
  <AnalysisResultCard
    key={result.note_id}
    result={result}
    onAddToFavorites={() => {}}
  />
))}
```

---

## ⚙️ 环境配置

### 必需环境变量 (backend/.env)

```bash
# Volcengine (豆包) API Key
VOLCENGINE_API_KEY=your-api-key-here
VOLCENGINE_MODEL=doubao-seed-1.6-flash
VOLCENGINE_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
VOLCENGINE_TEMPERATURE=0.3
VOLCENGINE_MAX_TOKENS=4096
```

### 检查配置

```bash
curl http://localhost:8000/api/analyze/status
# 应返回: "api_key_configured": true
```

---

## 🐛 常见问题排查

### 1. "搜索失败" 但无错误信息

**原因**: `success_count=0` - LLM 处理失败

**排查步骤**:
```bash
# 检查 API Key 配置
curl http://localhost:8000/api/analyze/status
# 期望: api_key_configured: true

# 查看后端日志
# 应显示: "Processing note mock_001: sentiment=positive, ..."
```

### 2. CORS 错误

**原因**: 浏览器预览代理地址未添加到 CORS 白名单

**解决**: 在 `backend/main.py` 添加:
```python
allow_origins=[
    "http://127.0.0.1:4698",  # Windsurf browser preview
]
```

### 3. 小红书爬虫不可用

**原因**: MediaCrawler 未配置或登录态失效

**临时方案**: 使用 `source: "mock"` 测试流程

---

## 📈 性能指标

- **单条笔记处理时间**: ~2-3秒 (取决于 LLM API)
- **批量处理 5 条**: ~3-5秒 (并发数=3)
- **文本清洗**: <0.01秒
- **Prompt 构建**: <0.01秒
- **JSON 解析**: <0.01秒

---

## 🔮 后续优化方向

1. **缓存层**: Redis 缓存 LLM 响应，避免重复调用
2. **流式响应**: 支持 SSE 实时返回分析结果
3. **多模态**: 支持图片内容分析
4. **个性化**: 根据用户偏好调整 Prompt
5. **A/B 测试**: 不同 Prompt 模板效果对比

---

**最后更新**: 2025-12-15
**维护者**: LiteTravel Team
