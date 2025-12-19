# LiteTravel 🗺️

> 地图可视化规划 + 记事本式记录 + 云端同步

一个全栈旅行规划应用，结合地图可视化与行程管理。

## ✨ 特性

- **地图可视化**: 高德地图集成，POI 搜索与标注
- **行程规划**: 拖拽式日程管理，支持景点/美食/住宿节点
- **AI 智能分析**: LLM 驱动的内容分析与推荐，四个视图页面全覆盖
- **云端同步**: JWT 认证，行程计划云端存储
- **分类收藏**: 景点/美食/住宿独立收藏夹，支持拖拽到行程
- **高端美学**: Zinc 深色主题 + 毛玻璃效果 + Toast 通知
- **体验打磨**: 自定义确认弹窗，地图右键菜单秒开，选中点高亮动效，Toast 替代原生 alert

## 🛠️ 技术栈

### Frontend
- React 18 + TypeScript + Vite
- Zustand (状态管理)
- TailwindCSS (样式)
- react-hot-toast (通知提示)
- @amap/amap-jsapi-loader (高德地图)
- @dnd-kit (拖拽排序)

### Backend
- Python FastAPI
- SQLAlchemy + SQLite/PostgreSQL
- JWT 认证 + bcrypt
- 火山引擎 LLM (Doubao)

## 🚀 快速开始

### 前端

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build
```

### 后端

```bash
cd backend

# 安装依赖 (使用 uv)
uv sync

# 配置环境变量
cp .env.example .env
# 编辑 .env 设置 JWT_SECRET_KEY, AMAP_KEY_WEB 等

# 启动服务
uv run uvicorn main:app --reload --port 8000
```

## 📁 项目结构

```
travel-tool/
├── src/                    # 前端源码
│   ├── components/         # UI 组件
│   │   ├── auth/           # 认证组件
│   │   ├── itinerary/      # 行程组件
│   │   ├── layout/         # 布局组件
│   │   ├── map/            # 地图组件
│   │   ├── ui/             # 通用 UI
│   │   └── views/          # 功能视图
│   ├── services/           # 服务层
│   │   ├── api/            # API 客户端
│   │   └── mock/           # Mock 实现
│   ├── store/              # Zustand 状态
│   ├── types/              # TypeScript 类型
│   └── utils/              # 工具函数
│
├── backend/                # 后端源码
│   ├── app/
│   │   ├── api/            # API 端点
│   │   ├── core/           # 核心配置
│   │   ├── db/             # 数据库层
│   │   ├── models/         # SQLAlchemy 模型
│   │   ├── schemas/        # Pydantic 模式
│   │   └── services/       # 业务逻辑
│   └── scrapers/           # 数据爬虫
│
└── docs/                   # 文档
    ├── ARCHITECTURE.md     # 架构文档
    ├── BACKEND_API.md      # 后端 API 文档
    └── COMMANDS.md         # 常用命令
```

## 📖 文档

- [架构文档](docs/ARCHITECTURE.md) - 系统架构与设计决策
- [后端 API](docs/BACKEND_API.md) - API 端点与使用说明
- [LLM Pipeline](docs/LLM_PIPELINE_FLOW.md) - LLM 处理流程

## 🔑 环境变量

**统一配置**: 所有环境变量统一在 `backend/.env` 中管理，前端通过 Vite 的 `envDir` 配置自动读取。

```bash
# 复制模板文件
cp backend/.env.example backend/.env

# 编辑配置
nano backend/.env  # 或使用任意编辑器
```

### 配置文件 (`backend/.env`)
```bash
# JWT 认证
JWT_SECRET_KEY=your_secret_key        # 必须修改！

# 数据库
DATABASE_URL=sqlite:///./litetravel.db

# 高德地图 API Keys
AMAP_KEY_WEB=your_amap_web_service_key    # 后端 POI 搜索
AMAP_KEY_WEB_JS=your_amap_js_api_key      # 后端配置 API
VITE_AMAP_KEY_WEB_JS=your_amap_js_api_key # 前端地图加载 (同上)

# Google API
GOOGLE_API_KEY=your_google_key

# 火山引擎 LLM (Doubao)
VOLCENGINE_API_KEY=your_volcengine_key
VOLCENGINE_MODEL=doubao-seed-1-6-251015
```

> **注意**: `VITE_` 前缀的变量会被 Vite 暴露给前端，仅放置公开配置。

## 📝 License

MIT
