# Vela AI

> AI Knowledge OS — 帮助每个专业人士系统掌握 AI，一天一步。

**Live**: [velamap.com](https://velamap.com)

---

## 项目简介

Vela AI 是一个 AI 知识图谱平台，通过结构化的概念体系和多视角内容，帮助专业人士系统性地理解和应用 AI 技术。

- **知识图谱** — 概念分类、上下游关系、多维度 Lens 视角
- **向量搜索** — 基于 Qdrant 的语义检索
- **多语言** — 中英文切换
- **主题** — 亮色 / 暗色模式

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Vanilla CSS |
| Content | MDX (`next-mdx-remote`) |
| Auth | 暂未开放 |
| Main API | Python FastAPI — port 8000 |
| Relational DB | PostgreSQL 15 |
| Vector DB | Qdrant |
| Deployment | Docker Compose |

---

## Project Structure

```
velamap-platform/
├── frontend/                   # Next.js 14 App Router
│   ├── app/
│   │   ├── api/content/        # MDX 内容代理路由
│   │   ├── api/nav/            # 导航数据代理路由
│   │   ├── api/concept/[slug]/ # 概念详情代理路由
│   │   └── auth/callback/      # Auth callback（暂未启用）
│   ├── components/
│   │   ├── AppShell.tsx        # 侧边栏布局
│   │   ├── SharedDocView.tsx   # MDX 文档查看器（含概念关系）
│   │   ├── PageClient.tsx      # 模式路由 (OS ↔ Web)
│   │   ├── Desktop.tsx         # OS 风格桌面
│   │   └── DraggableCard.tsx   # 可拖拽卡片
│   └── content/                # 本地 MDX fallback 内容
├── backend/
│   └── python/                 # FastAPI 主服务 (port 8000)
│   │   ├── main.py             # App 入口 + 路由注册
│   │   ├── db.py               # SQLAlchemy engine
│   │   ├── routers/
│   │   │   ├── concepts.py     # 导航 / 概念 / 关系图谱
│   │   │   ├── qdrant_router.py# Qdrant 向量数据库 CRUD
│   │   │   ├── tasks.py        # 任务 / 用户 / 小组
│   │   │   └── stats.py        # 统计数据
│   │   └── Dockerfile
├── db/
│   ├── postgresql/
│   │   ├── init.sql            # 建表 + 初始数据（Docker 挂载）
│   │   ├── schema.sql          # 完整 schema
│   │   ├── seed.py             # 概念数据管理脚本
│   │   └── import.py           # 内容批量导入脚本
│   ├── qdrant/
│   │   ├── collections.json    # 集合定义
│   │   └── init_collections.py # 初始化 Qdrant 集合
│   └── content/                # 原始 HTML 内容
├── docs/
├── docker-compose.yml          # 生产
└── docker-compose.dev.yml      # 本地开发
```

---

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Python 3.11+（数据管理脚本）
- Node.js 18+（本地前端开发）

### 本地开发（推荐）

```bash
# 首次启动 / 重置
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d --build
```

启动后：
- 前端：http://localhost:3000
- API Docs：http://localhost:8000/docs
- Qdrant：http://localhost:6333/dashboard

### 单独重建某个服务

```bash
docker compose -f docker-compose.dev.yml up -d --build frontend
docker compose -f docker-compose.dev.yml up -d --build api
```

---

## API Routes

### Python FastAPI (port 8000)

**概念图谱**

| Method | Path | Description |
|---|---|---|
| GET | `/api/nav` | 导航分类 + 概念列表 |
| GET | `/api/concepts` | 所有概念 |
| GET | `/api/concept/{slug}` | 概念详情（含上下游关系） |

**Qdrant 向量数据库**

| Method | Path | Description |
|---|---|---|
| GET | `/api/qdrant/collections` | 列出所有集合 |
| POST | `/api/qdrant/collections` | 创建集合 |
| DELETE | `/api/qdrant/collections/{name}` | 删除集合 |
| POST | `/api/qdrant/{collection}/points` | 新增 / 更新 point |
| GET | `/api/qdrant/{collection}/points/{id}` | 查询 point |
| PUT | `/api/qdrant/{collection}/points/{id}/payload` | 更新 payload |
| DELETE | `/api/qdrant/{collection}/points/{id}` | 删除 point |
| POST | `/api/qdrant/{collection}/search` | 向量相似搜索 |

**其他**

| Method | Path | Description |
|---|---|---|
| GET | `/api/tasks` | 今日任务 |
| POST | `/api/tasks/{id}/complete` | 完成任务 |
| GET | `/api/profile` | 用户信息 |
| GET | `/api/group` | 小组排行 |
| GET | `/api/stats` | 统计数据 |

### Go Gin (port 8080)

| Method | Path | Description |
|---|---|---|
| GET | `/api/pathway` | AI 演进路径节点 |
| POST | `/api/nodes` | 创建知识节点 |
| POST | `/api/lineages` | 创建节点关系 |

---

## 数据管理

### PostgreSQL

```bash
# 列出所有概念
python3 db/postgresql/seed.py list

# 交互式添加概念
python3 db/postgresql/seed.py add-concept

# 为已有概念补充 MDX 内容
python3 db/postgresql/seed.py add-content <slug>

# 从 JSON 批量导入
python3 db/postgresql/seed.py from-json db/seed_example.json
```

### Qdrant

```bash
# 初始化默认集合（concepts / content）
QDRANT_HOST=localhost python3 db/qdrant/init_collections.py
```

---

## Environment Variables

参考 `.env.example`，后端环境变量（`docker-compose.dev.yml` 已内置默认值）：

```env
POSTGRES_HOST=postgres
POSTGRES_DB=velamap
POSTGRES_USER=vela_user
POSTGRES_PASSWORD=vela_secure_pass
QDRANT_HOST=qdrant
QDRANT_PORT=6333
```

---

## Docs

- [Design & Architecture](docs/design.md)
- [Dev Guide](docs/dev.md)
- [Roadmap](docs/roadmap.md)
