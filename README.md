# Vela AI

> AI Transformation OS — helping every professional master AI, one day at a time.

**Live**: [skillmarket.top](https://skillmarket.top)

---

## What is this?

Vela AI is a daily AI training system, not another tool list. It helps professionals systematically integrate AI into their real workflows through:

- **Daily 5-min tasks** — role-specific, actionable, done in one sitting
- **Group check-ins** — 5-person accountability groups with leaderboards
- **AI Readiness Score** — baseline assessment → continuous tracking → quarterly reports
- **AI Evolution Path** — from Prompt Engineering to Harness Engineering

The UI is an OS-style desktop: double-click icons to open draggable windows, switch between OS mode and Web mode, supports light/dark theme and EN/ZH language.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Vanilla CSS (no Tailwind) |
| Content | MDX (`next-mdx-remote`) |
| Auth | Supabase (Google OAuth) |
| Drag & Animation | `@use-gesture/react` + `@react-spring/web` |
| Main API | Python FastAPI — port 8000 |
| Knowledge Graph API | Go (Gin) — port 8080 |
| Database | Supabase (PostgreSQL + pgvector) |
| Deployment | Docker Compose |

---

## Project Structure

```
SkillMarket/
├── frontend/                  # Next.js 14 App Router
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Server component, reads Supabase session
│   │   ├── globals.css
│   │   ├── api/content/       # MDX fetch API route
│   │   └── auth/callback/     # Supabase OAuth callback
│   ├── components/
│   │   ├── PageClient.tsx     # Mode router (OS ↔ Web)
│   │   ├── Desktop.tsx        # OS-style desktop with draggable windows
│   │   ├── AppShell.tsx       # Web mode sidebar layout
│   │   ├── SharedDocView.tsx  # Universal MDX document viewer
│   │   ├── LangDropdown.tsx   # Global language toggle
│   │   └── DraggableCard.tsx  # Reusable draggable card
│   ├── content/               # MDX content files for knowledge base
│   ├── lib/
│   │   ├── appContext.tsx      # Global state: lang / theme / mode
│   │   └── supabase/          # Supabase client & server helpers
│   └── middleware.ts
├── backend/
│   ├── python/                # FastAPI — main app APIs (port 8000)
│   │   ├── main.py
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   └── go/                    # Gin — knowledge graph + vector search (port 8080)
│       ├── cmd/server/main.go
│       ├── internal/
│       ├── go.mod
│       └── Dockerfile
├── db/                        # Database schemas & seed SQL (for Supabase)
├── docs/
└── docker-compose.yml
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Go 1.22+
- Docker & Docker Compose (optional, for full stack)

### 1. Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Fill in your Supabase keys in .env.local
npm install
npm run dev        # http://localhost:3000
```

### 2. Python Backend (main APIs)

```bash
cd backend/python
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Go Backend (knowledge graph)

```bash
cd backend/go
go run ./cmd/server   # port 8080
```

### 4. Full stack with Docker

```bash
# 先设置环境变量（Supabase keys + 数据库连接）
export NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
export DATABASE_URL=postgres://...  # Supabase connection string

docker-compose up --build
```

---

## Environment Variables

Copy `frontend/.env.local.example` to `frontend/.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these from your [Supabase project settings](https://supabase.com/dashboard).

> `.env.local` is gitignored and never committed.

For the Go backend, set `DATABASE_URL` and `ALLOWED_ORIGIN` via environment or a `.env` file in `backend/go/`.

> Note: Supabase handles auth — the local PostgreSQL in `docker-compose.yml` is only used by the Go knowledge graph service.

---

## API Routes

### Python FastAPI (port 8000)

| Method | Path | Description |
|---|---|---|
| GET | `/api/profile` | User profile & AI readiness score |
| GET | `/api/tasks` | Today's tasks |
| POST | `/api/tasks/{id}/complete` | Mark task complete |
| GET | `/api/group` | Group leaderboard |
| GET | `/api/stats` | Current date & stats |

### Go Gin (port 8080)

| Method | Path | Description |
|---|---|---|
| GET | `/api/pathway` | AI evolution path nodes |
| POST | `/api/nodes` | Create knowledge node |
| POST | `/api/lineages` | Create node relationship |

Frontend proxies all `/api/*` requests via `next.config.js` rewrites — Go-specific paths go to 8080, everything else to 8000.

---

## Docs

- [Requirements](docs/requirements.md)
- [Design & Architecture](docs/design.md)
- [Roadmap](docs/roadmap.md)
