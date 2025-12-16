# LiteTravel Backend API

FastAPI 后端服务，提供用户认证和行程计划持久化存储。

## 前端设计系统 (v2.2)

前端采用高端美学设计，统一使用 **Zinc 深色主题** + **Emerald 强调色**：

- **配色**: Zinc grays (bg-zinc-900, bg-zinc-950) + Emerald accents (emerald-500/600)
- **边框**: 超细边框 `border-white/[0.04]` ~ `border-white/[0.08]`
- **圆角**: 统一使用 `rounded-xl` / `rounded-2xl`
- **字体**: 精细字号 `text-[11px]` ~ `text-[13px]`，tracking-tight
- **动效**: 200-300ms 过渡，hover 状态变化
- **玻璃态**: `backdrop-blur-xl` + 半透明背景

### 核心 UI 组件

| 组件 | 用途 |
|------|------|
| `AnalysisCard` | LLM 分析结果展示（景点/美食/住宿/交通） |
| `ContextMenu` | 右键菜单（支持子菜单） |
| `NodeCard` | 行程节点卡片 |
| `AuthModal` | 登录/注册弹窗 |

## 技术栈

- **框架**: FastAPI
- **包管理**: **uv** 
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **ORM**: SQLAlchemy
- **认证**: JWT (JSON Web Token)
- **密码加密**: bcrypt
- **代码检查**: Ruff
- **测试**: Pytest

## 快速开始

### 前置条件

确保已安装 [uv](https://docs.astral.sh/uv/):

```bash
# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 1. 安装依赖

```bash
cd backend
uv sync
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并修改配置：

```bash
cp .env.example .env
```

**重要**: 生产环境必须修改 `JWT_SECRET_KEY`！

### 3. 启动服务

```bash
# 开发模式（自动重载）
uv run uvicorn main:app --reload --port 8000
```

### 4. 访问 API 文档

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 常用 uv 命令

```bash
# 安装/同步依赖
uv sync

# 添加生产依赖
uv add <package>

# 添加开发依赖
uv add --dev <package>

# 运行 Python 脚本
uv run python <script.py>

# 运行测试
uv run pytest

# 代码检查
uv run ruff check .

# 更新依赖
uv lock --upgrade
```

> ⚠️ **重要**: 禁止使用 `pip install` 或手动创建 `venv`，所有操作必须通过 `uv` 完成。

## API 端点

### 认证 (Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| GET | `/api/auth/me` | 获取当前用户信息 |
| POST | `/api/auth/logout` | 用户登出 |

### 内容服务 (Content) - v2.1+

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/content/search` | 搜索景点/住宿/美食等内容 |

**搜索参数**:
- `keyword` (必填): 搜索关键词
- `city` (必填): 城市名称
- `category`: 内容类别 (`attraction`, `hotel`, `dining`, `commute`)
- `page`: 页码 (默认 1)
- `page_size`: 每页数量 (默认 20, 最大 50)

### LLM 分析服务 (Analysis) - v2.1+

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze/text` | 分析单条文本内容 |
| POST | `/api/analyze/search` | 搜索并批量分析 |
| GET | `/api/analyze/templates` | 获取可用 Prompt 模板 |
| GET | `/api/analyze/status` | 获取 Pipeline 状态 |
| POST | `/api/analyze/mock-demo` | 运行 Mock 数据演示 |

**环境变量配置**:
```env
VOLCENGINE_API_KEY=your-api-key
VOLCENGINE_MODEL=doubao-seed-1.6-flash
```

**分析文本请求示例**:
```json
POST /api/analyze/text
{
    "title": "长沙三日游攻略",
    "content": "第一天去橘子洲头...",
    "tags": ["长沙旅游", "攻略"],
    "city": "长沙"
}
```

**搜索并分析请求示例**:
```json
POST /api/analyze/search
{
    "keyword": "长沙美食",
    "city": "长沙",
    "source": "mock",
    "limit": 5
}
```

### 行程计划 (Itinerary Plans)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/plans` | 获取用户所有行程 |
| POST | `/api/plans` | 创建新行程 |
| GET | `/api/plans/{id}` | 获取指定行程详情 |
| PUT | `/api/plans/{id}` | 更新行程 |
| DELETE | `/api/plans/{id}` | 删除行程 |

## 数据模型

### User
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "is_active": true,
  "created_at": "2025-12-11T00:00:00Z"
}
```

### ItineraryPlan
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "长沙旅行计划",
  "description": "可选描述",
  "content": {
    "meta": {
      "city": "长沙",
      "dates": ["2025-01-01", "2025-01-03"],
      "center": { "lat": 28.2, "lng": 112.97 }
    },
    "days": [
      {
        "day_index": 1,
        "date": "2025-01-01",
        "nodes": [...]
      }
    ]
  },
  "created_at": "2025-12-11T00:00:00Z",
  "updated_at": "2025-12-11T00:00:00Z"
}
```

## 目录结构

```
backend/
├── app/
│   ├── api/           # API 路由
│   │   ├── auth.py    # 认证端点
│   │   ├── plans.py   # 行程端点
│   │   └── deps.py    # 依赖项 (get_current_user)
│   ├── core/          # 核心配置
│   │   ├── config.py  # 环境配置
│   │   └── security.py # JWT & 密码处理
│   ├── db/            # 数据库
│   │   └── base.py    # 数据库连接
│   ├── models/        # SQLAlchemy 模型
│   │   ├── user.py
│   │   └── itinerary.py
│   └── schemas/       # Pydantic Schemas
│       ├── user.py
│       └── itinerary.py
├── .env               # 环境变量 (不提交)
├── .env.example       # 环境变量示例
├── .venv/             # 虚拟环境 (uv 自动管理，不提交)
├── main.py            # 应用入口
├── pyproject.toml     # 项目配置和依赖声明 (uv 管理)
└── uv.lock            # 依赖锁定文件 (需提交)
```

## 前端集成

前端通过 `analyzeService` 调用后端 LLM 分析接口：

```typescript
// src/services/api/analyzeService.ts
import { analyzeService } from './services/api/analyzeService';

// 搜索并分析
const response = await analyzeService.analyzeSearch({
  keyword: "长沙景点",
  city: "长沙",
  source: "mock",  // 或 "xiaohongshu"
  limit: 5
});

// 返回结果包含 sentiment, summary, tips, places 等
response.data.results.forEach(result => {
  console.log(result.summary);     // 摘要
  console.log(result.sentiment);   // 情感: positive/negative/neutral
  console.log(result.tips);        // 实用建议
});
```

**已集成的视图组件**:
- `AttractionsView` - 景点 AI 探索 + 收藏
- `DiningView` - 美食探店推荐
- `AccommodationView` - 住宿推荐
- `CommuteView` - 出行交通攻略

## 安全注意事项

1. **永远不要**在代码中硬编码密钥
2. 生产环境必须使用强密码作为 `JWT_SECRET_KEY`
3. `.env` 文件已在 `.gitignore` 中，不会被提交
4. 密码使用 bcrypt 加盐哈希存储
