# LiteTravel 🗺️

> 地图可视化规划 + 记事本式记录 + 云端同步

一个全栈旅行规划应用，结合地图可视化与行程管理。

## ✨ 特性

- **地图可视化**: 高德地图集成，POI 搜索与标注
- **行程规划**: 拖拽式日程管理，支持景点/美食/住宿节点
- **AI 智能分析**: LLM 驱动的内容分析与推荐，四个视图页面全覆盖，真实数据优先 + Mock 降级
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

## 快速开始

说明：更完整的启动命令与日常命令速查在 `./COMMANDS.md`。

```bash
# 前端
npm install
npm run dev

# 后端
cd backend
uv sync
uv run uvicorn main:app --reload --port 8000
```

## 项目结构

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
    ├── COMMANDS.md         # 常用命令
    └── LLM_PIPELINE_FLOW.md # LLM 处理流程
```

## 文档

- [架构文档](./ARCHITECTURE.md) - 系统架构与设计决策
- [后端 API](./BACKEND_API.md) - API 端点与使用说明
- [常用命令](./COMMANDS.md) - 启动/测试/检查命令速查
- [LLM Pipeline](./LLM_PIPELINE_FLOW.md) - LLM 处理流程

## 环境变量

**统一配置**：所有环境变量统一在 `backend/.env` 中管理，完整清单以 `backend/.env.example` 为准。

```bash
# 复制模板文件
# Windows PowerShell: Copy-Item backend/.env.example backend/.env
cp backend/.env.example backend/.env
```

**关键变量（最小可跑）**：
- `JWT_SECRET_KEY`
- `DATABASE_URL`
- `AMAP_KEY_WEB`（后端 POI 搜索）
- `VITE_AMAP_KEY_WEB_JS`（前端地图加载）

**可选（启用更多能力）**：
- `VOLCENGINE_API_KEY` / `VOLCENGINE_MODEL`（启用真实 LLM）
- `VITE_USE_MOCK=true`（强制走 mock，调试用）

> 注意：只有“可公开配置”才使用 `VITE_` 前缀。

## 数据源策略

LiteTravel 采用 **真实数据优先 + Mock 降级** 策略：

### 前端 (mapService)
- 配置了 `VITE_AMAP_KEY_WEB_JS` → 使用真实高德地图 API
- 未配置或 API 调用失败 → 自动降级到 Mock 数据

### 后端 (LLM Pipeline)
- `source: "auto"` (默认) → 优先尝试小红书数据源，失败则降级到 Mock
- `source: "xiaohongshu"` → 强制使用小红书（需配置 MediaCrawler）
- `source: "mock"` → 强制使用 Mock 数据

### 配置小红书数据源
```bash
# 1. 将 MediaCrawler 放到项目根目录下（与 backend/ 同级）
git clone https://github.com/NanmiCoder/MediaCrawler.git

# 2. 安装依赖 + 安装浏览器
cd MediaCrawler
uv sync
uv run playwright install

# 3. 首次运行：扫码登录（生成登录态）
uv run main.py --platform xhs --lt qrcode
```

## License

MIT
