# LiteTravel 常用命令（速查）

本文档仅保留“日常开发最常用命令”。

---

## 快速启动

### 前端
```bash
npm install
npm run dev
```

### 后端（必须使用 uv）
```bash
cd backend
uv sync
# 配置环境变量（Windows PowerShell: Copy-Item .env.example .env）
cp .env.example .env
uv run uvicorn main:app --reload --port 8000
```

---

## 后端依赖与质量检查（uv）

```bash
# 添加生产依赖
uv add <package>

# 添加开发依赖
uv add --dev <package>

# 运行测试
uv run pytest

# 代码检查 / 格式化
uv run ruff check .
uv run ruff format .
```

---

## 常用地址

- 前端: http://localhost:5173
- 后端 Swagger: http://localhost:8000/docs

---

## 约束

- 所有 Python 相关命令必须通过 `uv` 执行（不要直接运行 `uvicorn`，不要使用 pip/venv）。
- 本文档不提供删除/清理类命令模板；如确需清理请你手动确认后执行。
