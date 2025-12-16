# LiteTravel 常用命令参考

本文档记录项目开发中最常用的命令，方便快速查阅。

```bash
# 启动前端
cd "d:\个人资料\MyCode\travel tool"
npm install
npm run dev

# 启动后端
cd "d:\个人资料\MyCode\travel tool\backend"
uv sync
uv run uvicorn main:app --reload --port 8000
```

---

## 📦 后端命令 (uvicorn)

### 环境安装
```bash
# 安装所有依赖（首次运行或新增依赖后）
uvicorn main:app --reload --port 8000
```

### 开发
```bash
# 启动开发服务器（默认 http://localhost:8000）
uvicorn main:app --reload --port 8000

# 启动开发服务器并指定端口
uv run uvicorn main:app --reload --port 8000
```

---

## 📦 前端命令 (npm)

### 环境安装
```bash
# 安装所有依赖（首次运行或新增依赖后）
npm install
```

### 开发
```bash
# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 启动开发服务器并指定端口
npm run dev -- --port 3000
```

### 构建与预览
```bash
# 构建生产版本
npm run build

# 预览生产构建（构建后运行）
npm run preview
```

### 代码检查
```bash
# 运行 ESLint 检查
npm run lint
```

### 依赖管理
```bash
# 添加新依赖
npm install <package-name>

# 添加开发依赖
npm install -D <package-name>

# 移除依赖
npm uninstall <package-name>

# 更新依赖
npm update

# 查看过时的依赖
npm outdated
```

---

## 🐍 后端命令 (uv)

### 环境安装
```bash
cd backend

# 同步所有依赖（安装/更新到最新版本）
uv sync

# 同步依赖并包含开发依赖组
uv sync --all-groups
```

### 开发
```bash
cd backend

# 启动开发服务器（自动重载）
uv run uvicorn main:app --reload --port 8000

# 启动开发服务器（不重载）
uv run uvicorn main:app --port 8000

# 直接运行 Python 脚本
uv run python main.py
```

### 依赖管理
```bash
cd backend

# 添加生产依赖
uv add <package-name>

# 添加开发依赖（到 dev 组）
uv add --group dev <package-name>

# 添加带版本的依赖
uv add fastapi==0.109.2

# 移除依赖
uv remove <package-name>

# 更新依赖到最新版本
uv lock --upgrade

# 查看已安装的包
uv pip list

# 查看项目依赖树
uv tree
```

### 其他 uv 命令
```bash
# 创建新的 Python 项目
uv init

# 运行任意 Python 脚本（自动管理虚拟环境）
uv run python <script.py>

# 运行任意命令（在虚拟环境中）
uv run <command>
```

---

## 🚀 快速启动

### 首次运行（完整设置）

```bash
# 1. 安装前端依赖
npm install

# 2. 安装后端依赖（使用 uv）
cd backend
uv sync
cd ..

# 3. 配置环境变量（后端）
# 复制 backend/.env.example 到 backend/.env 并修改配置
cp backend/.env.example backend/.env
```

### 日常开发启动（需要在两个终端中运行）

```bash
# 终端 1：启动后端
cd backend
uv run uvicorn main:app --reload --port 8000

# 终端 2：启动前端
npm run dev
```

---

## 🗄️ 数据库命令

### SQLite（开发环境）

```bash
cd backend

# 使用 SQLite CLI 打开数据库
uv run sqlite3 litetravel.db

# 在 SQLite CLI 中常用命令：
# .tables          # 查看所有表
# .schema <table>  # 查看表结构
# SELECT * FROM users;  # 查询数据
# .quit            # 退出
```

### 数据库迁移（如果未来使用 Alembic）

```bash
cd backend

# 创建迁移
uv run alembic revision --autogenerate -m "描述信息"

# 应用迁移
uv run alembic upgrade head

# 回滚迁移
uv run alembic downgrade -1
```

---

## 🧪 测试命令

### 前端测试（如果配置）

```bash
# 运行测试
npm test

# 运行测试（监听模式）
npm test -- --watch
```

### 后端测试（使用 pytest）

```bash
cd backend

# 运行所有测试
uv run pytest

# 运行测试并显示详细输出
uv run pytest -v

# 运行特定测试文件
uv run pytest tests/test_auth.py

# 运行测试并显示覆盖率
uv run pytest --cov=app
```

---

## 📝 代码格式化与检查

### 前端

```bash
# ESLint 检查
npm run lint

# 手动格式化（如果配置了 Prettier）
npx prettier --write "src/**/*.{ts,tsx,json,css}"
```

### 后端（使用 ruff）

```bash
cd backend

# 检查代码
uv run ruff check .

# 自动修复
uv run ruff check --fix .

# 格式化代码
uv run ruff format .
```

---

## 🌐 API 文档

启动后端服务后，访问以下地址查看 API 文档：

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 🔑 环境变量配置

### 前端 (`.env.local`)

```env
VITE_AMAP_KEY=<your-amap-key>
VITE_GOOGLE_API_KEY=<your-gemini-key>
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK=false
```

### 后端 (`backend/.env`)

```env
JWT_SECRET_KEY=<strong-secret-key>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL=sqlite:///./litetravel.db
```

---

## 🔍 数据采集与内容服务

### 内容 API 测试

```bash
# 搜索景点 (需要配置 AMAP_KEY)
curl "http://localhost:8000/api/content/search?keyword=岳麓山&city=长沙&category=attraction"

# 搜索美食
curl "http://localhost:8000/api/content/search?keyword=臭豆腐&city=长沙&category=dining"

# 搜索住宿
curl "http://localhost:8000/api/content/search?keyword=酒店&city=长沙&category=hotel"
```

### 后台任务（未来扩展）

```bash
cd backend

# 运行 Celery Worker（如果配置）
uv run celery -A worker worker --loglevel=info

# 运行数据采集任务
uv run python -m app.services.sources.amap  # 测试高德 API
```

---

## 📚 其他有用命令

### 清理命令

```bash
# 清理前端构建产物
rm -rf dist
# Windows: rmdir /s /q dist

# 清理 node_modules（需要重新安装）
rm -rf node_modules package-lock.json
npm install

# 清理后端缓存（uv）
cd backend
rm -rf .venv
uv sync
```

---

## 📖 相关文档

- [项目架构文档](./ARCHITECTURE.md)
- [后端 README](./backend/README.md)
- [TODO 列表](./TODO)
- [uv 官方文档](https://docs.astral.sh/uv/)
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [Vite 文档](https://vitejs.dev/)
