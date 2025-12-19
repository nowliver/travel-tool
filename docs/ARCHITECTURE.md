# LiteTravel 架构文档
 
 > **最后更新**: 2025-12-19  
 > **版本**: 2.5.0  
 > **状态**: 开发中
 
 ---
 
 ## 📐 系统概览
 
 LiteTravel 是一个旅行规划应用：前端使用 **React + Zustand**，后端使用 **FastAPI** 提供认证与数据持久化，并集成多数据源（高德/小红书等）。
 
 ### 核心概念
 - **全栈架构**：React 前端 + FastAPI 后端 + SQLite/PostgreSQL
 - **JWT 认证**：基于 Token 的用户会话
 - **本地优先**：未登录可本地使用；登录后支持云端同步
 - **多源内容**：高德 / 小红书（未来：携程/美团）
 - **真实数据优先**：`source=auto` 自动选择，失败降级到 mock
 - **POI 驱动交互**：围绕地图 POI 的选择、收藏、加入行程
 - **服务层隔离**：UI 不直接调用外部 API，统一通过 `src/services/*`
 
 ---
 
 ## 🔐 后端架构（v2.0+）
 
 ### 技术栈
 - **框架**: Python FastAPI
 - **数据库**: SQLite（开发） / PostgreSQL（生产）
 - **ORM**: SQLAlchemy
 - **认证**: JWT + bcrypt（密码哈希）
 - **校验**: Pydantic schemas
 
 ### 目录结构
 - 入口：`backend/main.py`
 - API 路由：`backend/app/api/*`
 - 配置与安全：`backend/app/core/*`
 - 数据库：`backend/app/db/*`、`backend/app/models/*`
 - Schema：`backend/app/schemas/*`
 - 业务服务：`backend/app/services/*`
 - 爬虫：`backend/scrapers/*`
 
 ### 内容服务架构（v2.1+）
 
 ``` 
 用户请求 → /api/content/search
     ↓
 Content API（`backend/app/api/content.py`）
     ↓
 数据源层（`backend/app/services/sources/*`）
     ├── AmapSource (amap.py)     → 高德地图 POI API
     ├── CtripSource (future)     → 携程酒店/机票
     └── XiaohongshuSource (future) → 小红书攻略
     ↓
 统一 Schema 转换（`backend/app/schemas/content.py`）
     ↓
 (Future) LLM 整合层 (llm/)
     ↓
 返回标准化响应
```
 
 #### 内容分类
 
 | 类别 | 数据源 | Schema |
 |------|--------|--------|
 | 景点 (attraction) | 高德 + 小红书 | `AttractionItem` |
 | 住宿 (hotel) | 携程 + 美团 | `HotelItem` |
 | 美食 (dining) | 高德 + 小红书 | `DiningItem` |
 | 出行 (commute) | 携程 + 高德 | `CommuteItem` |
 
 ---
 
 ## 🗺️ 核心模块与入口
 
 - **布局/导航**：`src/components/layout/*`
 - **地图**：`src/components/map/*`
 - **行程**：`src/components/itinerary/*`
 - **视图页（AI 分析）**：`src/components/views/*`
 - **服务层**：`src/services/*`
 - **状态**：`src/store/*`
 
 ---
 
 ## 🏗️ 交互与逻辑架构
 
 ### 用户交互流
 
#### 流程 1：地图空白区域右键
``` 
 用户在地图空白区域右键
     ↓
 `MapContainer` 获取 `e.pixel` → 转为视口坐标
     ↓
 `mapService.fetchAddressByLocation(lng, lat)` 获取地址
     ↓
 `ContextMenu` 展示操作：加入收藏 / 加入行程（Day 1/2/3...）
     ↓
 用户选择动作 → `favoriteService.addFavorite()`（后端 API）或 `tripStore.addNode()`
     ↓
 地图右键默认类型为 `spot`
```
 
 **定位说明**：右键菜单需要把 AMap 的 `e.pixel` 转换为浏览器视口坐标（实现见 `src/components/map/MapContainer.tsx`）。
 
#### 流程 2：点击 Marker（POI 交互）
``` 
 用户点击 Marker
     ↓
 `MapContainer` 判断是否 Marker 点击（通过 DOM target）
     ↓
 `mapService.fetchAddressByLocation()` 获取 POI 详情
     ↓
 `MapContainer` 设置 selectedPOI 并打开详情栏
     ↓
 `LocationDetailBar` 从底部弹出，支持：
     - POI 名称/地址
     - 加入收藏
     - 加入行程（Day 1/2/3...）
```
 
 **点击判定**：通过 DOM target 判断是否 Marker 点击（实现见 `src/components/map/MapContainer.tsx`）。
 
#### 流程 3：点击地图空白区域（清理状态）
``` 
 用户点击地图非 Marker 区域
     ↓
 `MapContainer` 清理：
     - highlightedLocation（黄色 Marker）
     - contextMenu
     - clickedLocation
     - selectedPOI + isDetailBarOpen
```
 
#### 流程 4：右键行程条目
``` 
 用户右键 `NodeCard`
     ↓
 `ContextMenu` 展示：
     - 加入收藏
     - 在地图中定位
     - 删除（危险操作）
     ↓
 用户选择 → 执行对应的 Store action
```
 
 ---
 
 ## 📦 状态管理
 
### Zustand Store (`src/store/tripStore.ts`)
 
 **文件**：`src/store/tripStore.ts`
 
 **关键点**：
 - 行程结构：`meta` + `days`
 - UI 状态：侧栏宽度、确认城市、地图高亮点
 - 收藏：按类型管理，支持拖拽加入行程
 
 ---
 
 ## 🛠️ 服务层
 
### API Services（v2.0+）

前端与后端通信统一放在 `src/services/api/`，以代码为准：

- `apiClient`：`src/services/api/apiClient.ts`
- `authService`：`src/services/api/authService.ts`
- `planService`：`src/services/api/planService.ts`
- `favoriteService`：`src/services/api/favoriteService.ts`
 
 **关键点**：
 - `apiClient` 负责 token 注入与错误处理（`src/services/api/apiClient.ts`）
 - `authService` / `planService` / `favoriteService` 对应后端资源（见 `src/services/api/*`）
 
 ---
 
 ## 🔧 技术约束
 
 ### 坐标系统
 
 - **AMap `e.pixel`**：相对地图容器坐标（需要转换）
 - **浏览器 `clientX/Y`**：浏览器视口坐标（菜单定位使用）
 - **AMap `lnglat`**：地理坐标
 
 ---
 
 ## 📝 代码风格
 
 本项目的代码风格与硬约束以 `.windsurfrules` 为准（避免重复维护）。
 
 - **服务调用**：UI 不直接 fetch，必须通过 `src/services/*`
 - **Zustand**：selector 不创建新数组/对象
 - **后端**：只用 `uv`；只用 SQLAlchemy ORM；路由与 schema 分层
 
 ---
 
 ## 🚀 近期变更
 
 - 主要变更以 `docs/TODO.md` 与 Git 历史为准。
 - 与架构相关的关键点：POI 清洗（`src/services/utils/formatPOI.ts`）、AI 分析 `source=auto`。
 - 细节实现以代码为准。
 
 ---
 
 ## 🔮 后续计划
 
 - 后续待办以 `docs/TODO.md` 为准。
 - 新数据源（携程/美团）与缓存策略：计划中。
 - 与本文件重复的细节不再维护。
 
 ---
 
 ## 📚 参考链接
 
- [高德地图 JS API v2.0](https://lbs.amap.com/api/javascript-api/summary)
- [高德地图逆地理编码（Regeo）](https://lbs.amap.com/api/webservice/guide/api/georegeo)
- [Zustand](https://docs.pmnd.rs/zustand)
- [@dnd-kit](https://docs.dndkit.com/)
 
 ---
 
 *本文档用于描述架构主线；新增组件或修改关键数据流时请同步更新。*
