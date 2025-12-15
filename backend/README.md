# LiteTravel Backend API

FastAPI 后端服务，提供用户认证和行程计划持久化存储。

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

## 安全注意事项

1. **永远不要**在代码中硬编码密钥
2. 生产环境必须使用强密码作为 `JWT_SECRET_KEY`
3. `.env` 文件已在 `.gitignore` 中，不会被提交
4. 密码使用 bcrypt 加盐哈希存储
