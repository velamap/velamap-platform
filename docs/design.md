# Design & Architecture — Vela AI

> **版本历史**
> | 版本 | 日期 | 变更摘要 |
> |------|------|---------|
> | v0.5 | 2026-04-07 | 去除 Supabase，本地 PostgreSQL，导航数据动态化，seed 脚本 |
> | v0.4 | 2026-03-28 | MDX Content Engine, SharedDocView 统一 Web/OS 渲染 |
> | v0.3 | 2026-03-26 | AI Knowledge OS v4 架构重构：五层导航、i18n、OS 窗口缩放 |
> | v0.2 | 2026-03 | AppShell web 模式、Settings 面板、语言切换 |
> | v0.1 | 2026-03 | 初始版本，OS 桌面、Supabase Auth、双模式切换 |

---

## 1. System Architecture

```
Browser
  │
  ├── Next.js 14 (port 3000)
  │     ├── Server Components  →  page.tsx (无鉴权，user=null)
  │     ├── Client Components  →  OS Desktop / AppShell
  │     └── API Routes
  │           ├── /api/nav      →  代理到 Python :8000/api/nav
  │           └── /api/content  →  GitHub 知识库 / 本地 MDX fallback
  │
  ├── Python FastAPI (port 8000)
  │     ├── /api/nav            →  导航分类 + 概念列表
  │     ├── /api/concepts       →  概念列表
  │     └── /api/concept/{slug} →  概念详情 + 上下游关系
  │
  └── PostgreSQL 15 (port 5432)
        ├── nav_categories      →  一级导航
        ├── concepts            →  知识概念
        └── concept_relations   →  上游/同级/下游关系
```

## 2. Frontend Architecture

### Mode System

| Mode | Component | Description |
|---|---|---|
| `web` | `AppShell.tsx` | 可收缩侧边栏 + 主内容区，默认模式 |
| `os` | `Desktop.tsx` | OS 风格桌面，可拖拽/缩放窗口 |

Mode 状态由 `AppProvider` 管理，切换无需刷新页面。

### Global State (`lib/appContext.tsx`)

```ts
interface AppCtx {
  lang: 'zh' | 'en'
  theme: 'light' | 'dark'
  mode: 'os' | 'web'
  activeLens: LensId
}
```

### 导航数据流（v0.5 新增）

导航数据不再硬编码，完整流程：

```
PostgreSQL (nav_categories + concepts)
  ↓
Python /api/nav
  ↓
Next.js /api/nav (代理, ISR 60s 缓存)
  ↓
AppShell.tsx / Desktop.tsx (useEffect fetch)
  ↓
SharedDocView.tsx (props: topics + pageLabel)
```

`AppShell.tsx` 导出 `getIcon(name)` 工具函数，将后端返回的 lucide 图标名字符串映射到组件。

### Content System

内容加载优先级：

1. GitHub 知识库：`nodes/{topic}/content/{lang}/index.md`（ISR 60s）
2. 本地 MDX fallback：`frontend/content/{topic}/{lens}.mdx`

`SharedDocView.tsx` 统一处理两种模式（Web/OS）的内容渲染，通过 props 接收 `topics` 和 `pageLabel`，不再依赖硬编码常量。

> **注意**：概念卡片（名称、描述）来自 PostgreSQL，通过 `db/seed.py` 管理。
> 点进概念后的 Lens 正文内容来自 GitHub 知识库，两者相互独立。
> 用 `db/seed.py` 新增概念后，正文内容需要同步在 GitHub 知识库中创建对应文件，否则详情页显示"内容未录入"。

### Auth（v0.5 暂时关闭）

登录功能已注释，`user` 固定为 `null`：
- `app/page.tsx`：Supabase 鉴权调用已注释
- `middleware.ts`：Supabase middleware 已注释，所有请求直接放行
- `AppShell.tsx`：登录/退出 UI 已注释

恢复登录：取消上述三处注释即可。

## 3. Directory Structure

```
.
├── sql/
│   └── init.sql              # 表结构 + 初始数据（容器首次启动自动执行）
├── db/
│   ├── seed.py               # 数据管理脚本（list/add/from-json）
│   ├── seed_example.json     # 批量导入 JSON 示例
│   └── schema.sql            # 旧版 schema（保留参考）
├── backend/
│   └── python/
│       ├── main.py           # FastAPI：导航 API + 概念 API + 原有接口
│       ├── requirements.txt
│       └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── page.tsx          # Server component，user=null
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── api/
│   │       ├── nav/route.ts      # 代理 /api/nav → Python
│   │       └── content/route.ts  # MDX 内容加载
│   ├── components/
│   │   ├── AppShell.tsx      # Web 模式，动态加载导航
│   │   ├── SharedDocView.tsx # 内容渲染（Web/OS 共用）
│   │   ├── Desktop.tsx       # OS 桌面模式
│   │   └── PageClient.tsx    # AppProvider + 模式路由
│   ├── content/              # 本地 MDX fallback 内容
│   └── lib/
│       ├── appContext.tsx
│       └── useKeyboardShortcuts.ts
├── docker-compose.yml        # 生产：postgres + api + frontend
└── docker-compose.dev.yml    # 开发：同上 + 暴露 5432
```

## 4. Database Schema (v0.5)

完整 DDL 见 `sql/init.sql`。

| 表 | 用途 |
|---|---|
| `nav_categories` | 一级导航分类（slug, zh_label, en_label, icon, sort_order） |
| `concepts` | 知识概念（slug, category_id, zh/en 名称和描述, icon, sort_order） |
| `concept_relations` | 概念关系（source_id, target_id, rel_type: upstream/parallel/downstream） |

### /api/nav 返回格式

```json
{
  "categories": [
    {
      "id": "execution",
      "zhLabel": "工程化",
      "enLabel": "Engineering",
      "icon": "Cpu",
      "topics": [
        {
          "id": "rag",
          "zh": "检索增强生成",
          "en": "RAG",
          "icon": "Database",
          "descZh": "检索外部知识增强生成",
          "descEn": "Retrieve external knowledge to enhance generation"
        }
      ]
    }
  ]
}
```

## 5. Backend API

所有接口由 `backend/python/main.py` 提供：

| 接口 | 说明 |
|---|---|
| `GET /api/nav` | 完整导航树（分类 + 概念） |
| `GET /api/concepts` | 概念列表 |
| `GET /api/concept/{slug}` | 概念详情 + upstream/parallel/downstream |
| `GET /api/tasks` | 原有任务数据（mock） |
| `GET /api/profile` | 原有用户数据（mock） |

数据库连接通过环境变量配置，`POSTGRES_HOST` 未设置时自动降级（不连接 DB）。

## 6. Data Management

### 初始化

postgres 容器首次启动时自动执行 `sql/init.sql`（仅 volume 为空时触发）。

### 增量更新

使用 `db/seed.py`：

```bash
# 列出所有概念
python3 db/seed.py list

# 交互式添加
python3 db/seed.py add-concept
python3 db/seed.py add-category

# 从 JSON 批量导入（推荐）
python3 db/seed.py from-json db/seed_example.json
```

JSON 格式见 `db/seed_example.json`，建议提交到 git 作为数据版本记录。

重置数据库：
```bash
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

## 7. Styling System

无 CSS 框架，所有样式在 `globals.css` 使用 CSS 自定义属性。

### Design Tokens

```css
--ink: #1a1a2e
--teal: #048a81
--teal-light: rgba(4,138,129,0.08)
--surface: #f8f8fc
--card: #ffffff
--border: #e8e8f0
--muted: #8a8a9a
```

Dark mode 通过 `[data-theme="dark"]` 覆盖。

### Typography

| 用途 | 字体 |
|---|---|
| Logo (ZH) | Noto Serif SC 900 |
| Body | DM Sans / Outfit |

## 8. Deployment

### Docker Compose Services

| Service | Image | Port | 内存限制 |
|---|---|---|---|
| `postgres` | postgres:15-alpine | 5432 | 256M |
| `api` | backend/python | 8000 (dev) / 8201 (prod) | 256M |
| `frontend` | frontend Next.js | 3000 (dev) / 8200 (prod) | 256M |

### Environment Variables

```env
# PostgreSQL
POSTGRES_DB=velamap
POSTGRES_USER=vela_user
POSTGRES_PASSWORD=vela_secure_pass

# Frontend → Python 内部通信
INTERNAL_API_URL=http://api:8000

# 可选（不用 Supabase 时留空）
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### 本地启动

```bash
docker-compose -f docker-compose.dev.yml up -d --build
# 前端: http://localhost:3000
# API:  http://localhost:8000/api/nav
```
