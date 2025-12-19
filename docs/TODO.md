# TODO 任务列表

## LiteTravel 项目待办事项

- [ ] feature：后端实现数据同步机制（离线/在线状态处理）

- [x] refactor：统一收藏功能到 FloatingNavLayer，移除景点页面收藏 Tab，所有收藏显示类型标识

- [x] feature：四个 View 页面（景点/美食/住宿/出行）均配置 AI 智能分析功能，使用 auto 数据源策略
- [x] 第三方数据接入 (v2.5)
  - [x] 小红书数据获取
    - [x] 实现 XhsAdapter 集成 MediaCrawler
    - [x] 实现游记/攻略内容提取
    - [x] 实现图片和标签信息提取
  - [x] 数据整合与展示
    - [x] 统一数据格式 (NoteData, AnalysisResult)
    - [x] 实现 auto 数据源策略（真实数据优先 + Mock 降级）
  - [ ] 携程 API 接入 (待实现)
  - [ ] 美团 API 接入 (待实现)
  - [ ] 数据缓存策略 (待实现)

## 归档部分
- [x] docs：文档瘦身与口径一致性对齐（README/ARCHITECTURE/BACKEND_API/COMMANDS/LLM_PIPELINE_FLOW）

- [x] bug：右键节点弹窗距离右键点击位置遥远（使用 Portal 渲染到 body 解决 transform 影响）
- [x] bug：无法搜索到其他城市，考虑为rules中强制使用mock数据的原因
- [x] bug：同样，在搜索景点的时候也只能搜索到一个固定位置的地点，考虑为rules中强制使用mock数据的原因
- [x] bug：右键收藏的位置以经纬度形式保存在收藏夹中，考虑修改为保存到附近的景点/标志地点
- [x] new：行程日选择（Day1 2 3）只能通过shift+鼠标滚轮滑动 → 添加悬停显示的左右箭头控制滚动
- [x] new：行程节点变多或展开时左侧栏滚动条导致布局抖动 → 使用 overflow-y-scroll + no-scrollbar
- [x] new：点击节点的...按钮时，在按钮位置呼出菜单（使用 getBoundingClientRect 定位）
- [x] feature：不只是景点，住宿和美食都需要有各自独立的收藏夹（已实现后端 API + 前端组件 + 拖拽功能）
- [x] feature：使用 react-hot-toast 替换浏览器默认 alert 提示，提升用户体验

- [x] Phase 0: 基础架构搭建
  - [x] 创建 services 目录结构 (sources/, llm/, content/)
  - [x] 定义统一数据 Schema (ContentCategory, AttractionItem, HotelItem, DiningItem, CommuteItem)
  - [x] 创建高德地图 API 集成 (AmapSource)
  - [x] 创建 Content API 端点 (/api/content/search)
- [x] Phase 1: 小红书爬虫集成
  - [x] 创建 scrapers/ 目录结构
  - [x] 实现 XhsAdapter 适配 MediaCrawler
  - [x] 创建 XhsNote, XhsSearchResult 数据模型
  - [x] 实现 ScraperService 统一接口
  - [x] 集成 XiaohongshuSource 到后端
- [x] Phase 2: LLM 整合
  - [x] 定义 ETL Pipeline 架构 (Ingestion → Processing → Application)
  - [x] 实现接口抽象 (DataSource, LLMProvider, DataProcessor, PromptManager)
  - [x] 实现火山引擎适配器 (VolcengineProvider)
  - [x] 实现文本清洗器和响应解析器
  - [x] 实现 Prompt 模板管理
  - [x] 实现 Pipeline 编排器
  - [x] 集成小红书数据源适配器
  - [x] 创建 API 端点暴露 LLM 功能 (/api/analyze/*)
- [x] Phase 3: 前端集成
  - [x] 创建 analyzeService 前端服务层
  - [x] 景点页面 UI (AttractionsView - AI探索 + 收藏)
  - [x] 美食页面 UI (DiningView - 美食探店)
  - [x] 住宿页面 UI (AccommodationView - 住宿推荐)
  - [x] 出行页面 UI (CommuteView - 交通出行)
- [x] Phase 4: UI 视觉重构 (高端美学)
  - [x] 全局样式优化 (index.css, tailwind.config.cjs)
  - [x] Shell/ResizeHandle 布局组件精修
  - [x] FloatingNavLayer/DayTabs 导航组件精修
  - [x] ItineraryPanel/NodeCard 行程组件精修
  - [x] View 组件统一使用 AnalysisCard
  - [x] ContextMenu 右键菜单精修
  - [x] MapContainer/LocationDetailBar 地图组件精修
  - [x] Auth 组件 (AuthModal/PlansModal/UserMenu) 精修
- [x] Phase 5: 项目整理与清洗 (Housekeeping)
  - [x] 删除垃圾文件 (__dummy__, .env.memory, 空目录)
  - [x] 删除死代码 (llmService.ts, mockLLMService.ts)
  - [x] 清理 __pycache__ 缓存目录
  - [x] 移动 scrapers/ 到 backend/scrapers/
  - [x] 整合 types.ts 到 src/types/index.ts
  - [x] 重命名 TODO → TODO.md
  - [x] 重命名 docs/README.md → docs/BACKEND_API.md
  - [x] 更新 api/index.ts 导出 analyzeService
- [x] Phase 6: Bug 修复与体验打磨 (Polishing)
  - [x] 预算输入框禁用负数 & 修复 0 值展示
  - [x] DayTabs 横向滚动支持 (flex-nowrap + no-scrollbar)
  - [x] ContextMenu 子菜单纵向滚动 (max-h + overflow-y-auto)
  - [x] 用 ConfirmModal 替换原生 confirm (删除天/删除行程)
  - [x] 修复首次地图右键菜单延迟（先弹出菜单，再异步补全地址）
  - [x] 升级地图选中点样式（Apple-style emerald halo + pulse）

- [x] 加入后端的用户个人行程计划的存储
  - [x] 设计用户认证系统（登录/注册）
  - [x] 设计行程计划数据模型（关联用户ID）
  - [x] 实现后端 API（保存/加载/删除行程）
  - [x] 前端集成：替换 localStorage 为 API 调用

## 使用说明：
- 未勾选框：`- [ ] 任务内容`
- 已勾选框：`- [x] 任务内容`
- 可直接在支持Markdown的编辑器中点击勾选