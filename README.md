# Deep Research

一个基于 LangGraph 的深度研究应用。项目由 FastAPI 后端和 React/Vite 前端组成，可围绕研究主题生成澄清问题、研究 brief、检索计划、资料发现和最终报告。

## 项目结构

```text
.
├── backend/   # FastAPI + LangGraph 后端
└── frontend/  # React + Vite 前端
```

## 环境要求

- Python 3.11+
- uv
- Bun

## 本地启动

### 1. 配置后端

```bash
cd backend
cp .env.example .env
```

按需填写 `.env`：

```bash
LLM_API_FORMAT=openai
LLM_API_KEY=你的模型 API Key
LLM_BASE_URL=模型服务地址
LLM_MODEL=模型名称
SEARCH_PROVIDER=tavily
TAVILY_API_KEY=你的 Tavily API Key
```

启动后端：

```bash
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8011
```

健康检查：

```bash
curl http://localhost:8011/health
```

### 2. 配置前端

```bash
cd frontend
cp .env.example .env
```

默认 API 地址为：

```bash
VITE_API_BASE_URL=http://localhost:8011
```

安装依赖并启动：

```bash
bun install
bun run dev
```

浏览器访问 Vite 输出的本地地址，通常是 `http://localhost:5173`。

## 常用命令

后端代码检查：

```bash
cd backend
uv run ruff check .
```

前端构建：

```bash
cd frontend
bun run build
```

## 配置说明

- `LLM_API_FORMAT`：模型接口格式，支持 `openai` 或 `anthropic`。
- `LLM_API_KEY`：模型服务 API Key。
- `LLM_BASE_URL`：OpenAI 兼容接口的基础地址，可按服务商要求配置。
- `LLM_MODEL`：使用的模型名称。
- `SEARCH_PROVIDER`：搜索提供商，支持 `tavily` 或 `duckduckgo`。
- `TAVILY_API_KEY`：使用 Tavily 时需要填写。
- `CORS_ALLOWED_ORIGINS`：允许访问后端的前端来源，多个地址用逗号分隔。

