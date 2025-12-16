# LiteTravel 🗺️

> 地图可视化规划 + 记事本式记录 + 云端同步

一个全栈旅行规划应用，结合地图可视化与行程管理。

## ✨ 特性

- **地图可视化**: 高德地图集成，POI 搜索与标注
- **行程规划**: 拖拽式日程管理，支持景点/美食/住宿节点
- **AI 分析**: LLM 驱动的内容分析与推荐
- **云端同步**: JWT 认证，行程计划云端存储
- **高端美学**: Zinc 深色主题 + Emerald 强调色
- **体验打磨**: 自定义确认弹窗（替换原生 confirm），地图右键菜单秒开，选中点高亮动效

## 🛠️ 技术栈

### Frontend
- React 18 + TypeScript + Vite
- Zustand (状态管理)
- TailwindCSS (样式)
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
# 编辑 .env 设置 JWT_SECRET_KEY, AMAP_KEY 等

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

### 前端 (.env.local)
```
VITE_AMAP_KEY=your_amap_key
VITE_API_BASE_URL=http://localhost:8000
```

### 后端 (backend/.env)
```
JWT_SECRET_KEY=your_secret_key
DATABASE_URL=sqlite:///./litetravel.db
AMAP_KEY=your_amap_key
VOLCENGINE_API_KEY=your_volcengine_key
```

## 📝 License

MIT
