# Design & Architecture — Vela AI

> **版本历史**
> | 版本 | 日期 | 变更摘要 |
> |------|------|---------|
> | v0.4 | 2026-03-28 | MDX Content Engine, SharedDocView unifying Web/OS doc rendering, Global LangDropdown |
> | v0.3 | 2026-03-26 | AI Knowledge OS v4 架构重构：五层导航、i18n 完善、Web 模式重写、OS 窗口缩放 |
> | v0.2 | 2026-03 | AppShell web 模式、Settings 面板、语言切换 |
> | v0.1 | 2026-03 | 初始版本，OS 桌面、Supabase Auth、双模式切换 |

---

## 1. System Architecture

```
Browser
  │
  ├── Next.js 14 (port 3000)
  │     ├── Server Components  →  Supabase session check
  │     ├── Client Components  →  OS Desktop / AppShell
  │     └── API Rewrites
  │           ├── /api/pathway, /api/nodes, /api/lineages  →  Go :8080
  │           └── /api/*                                   →  Python :8000
  │
  ├── Python FastAPI (port 8000)   — main app data
  └── Go Gin (port 8080)           — knowledge graph + pgvector
        └── PostgreSQL (Supabase)
```

## 2. Frontend Architecture

### Mode System

The app has two rendering modes managed by `AppContext`:

| Mode | Component | Description |
|---|---|---|
| `os` | `Desktop.tsx` | OS-style desktop, draggable/resizable windows, icon grid |
| `web` | `AppShell.tsx` | Traditional collapsible sidebar + main content layout |

Mode state lives in `PageClient.tsx` via `AppProvider`. Switching is instant with no page reload.
Both modes are accessible without login (guest-friendly).

### Global State (`lib/appContext.tsx`)

```ts
interface AppCtx {
  lang: 'zh' | 'en'       // default: 'en'
  theme: 'light' | 'dark'  // default: 'light'
  mode: 'os' | 'web'       // default: 'os'
}
```

Theme is applied via `data-theme` attribute on `<html>`, driven by CSS custom properties.

### Knowledge OS Navigation (v0.3)

Five top-level modules replacing the old task/profile/group demo content:

| ID | ZH | EN | Layer |
|---|---|---|---|
| `frontier` | 前沿探索 | Frontier | Tag system (maturity/certainty/freshness/type) |
| `applications` | 应用落地 | Applications | Capability × Domain matrix |
| `agents` | 智能体 | Agents | Decision layer (no execution logic) |
| `execution` | 执行层 | Execution | Orchestration, Context, Harness Engineering, Observability |
| `ai-infra` | AI基础设施 | AI Infra | Foundations, Systems, Hardware, Resources |

Architecture rule: `AI Infrastructure → Execution → Agents → Applications`. Frontier is a tag system, not a layer.

### Desktop OS UI (v0.3 updates)

- Icons on the left column, draggable via `@use-gesture/react`
- Double-click icon → opens a draggable, **resizable** window
- Window resize: 8 handles (4 edges + 4 corners), min size 280×180px
- Window size/position stored in local `useState` — survives parent re-renders
- Window titlebar: drag to move, double-click to maximize/restore
- Traffic-light buttons: red = close, yellow = minimize, green = maximize
- Minimized windows appear in a bottom taskbar
- Settings panel: fixed bottom-left, includes account info + sign-out
- Mode toggle (OS/Web) removed from top nav → moved into Settings panel

### Web Mode UI (v0.3 updates)

- Collapsible sidebar: 180px expanded → 56px icon-only, toggle button in header
- Sidebar header height matches top nav (48px) for visual alignment
- Light color scheme matching `var(--card)` / `var(--surface)` — no dark sidebar
- Top nav: theme toggle + language toggle only (mode toggle in user menu)
- User menu (click avatar, bottom-left): mode switch + sign-out
- Guest-accessible: shows login button when not authenticated

### Content System (v0.4 updates)

The previous hardcoded `TOPIC_CONTENT` dictionary in AppShell has been replaced with a file-system driven **MDX Architecture**.
- Content lives in `frontend/content/` organized by layer and module (e.g. `execution/rag/conceptual.mdx`).
- `SharedDocView.tsx` handles dynamic fetching via `/api/content`, reading MDX, generating dynamic TOCs, and rendering custom components (like `<RagConceptual />`).
- OS Mode (`Desktop.tsx`) and Web Mode (`AppShell.tsx`) both mount `SharedDocView`, ensuring 100% parity in content rendering, layout, and component interactivity without dropping out of the desktop window experience.
- All language toggles are unified using `LangDropdown.tsx` with Globe icons.

### Auth Flow

```
User clicks "Get Started"
  → Supabase signInWithOAuth({ provider: 'google' })
  → Google OAuth consent
  → Redirect to /auth/callback
  → Supabase exchanges code for session
  → Redirect to /
  → page.tsx reads session server-side
  → Renders Desktop/AppShell with user prop
```

## 3. Directory Structure

```
frontend/
├── app/
│   ├── layout.tsx              # Root layout, font imports
│   ├── page.tsx                # Server component, session gate
│   ├── globals.css             # All styles (no CSS modules, no Tailwind)
│   └── auth/callback/route.ts  # OAuth callback handler
├── components/
│   ├── PageClient.tsx          # AppProvider wrapper + mode router
│   ├── Desktop.tsx             # Full OS desktop (icons, windows, resize)
│   ├── AppShell.tsx            # Web mode (collapsible sidebar + pages)
│   └── DraggableCard.tsx       # Standalone draggable card (utility)
└── lib/
    ├── appContext.tsx           # React context: lang/theme/mode
    └── supabase/
        ├── client.ts           # Browser Supabase client
        └── server.ts           # Server-side Supabase client (cookies)

db/
├── schema.sql                  # PostgreSQL schema (nodes/edges/tags/content/resources)
├── import.py                   # Content import script (node.json + HTML files)
└── content/
    └── harness-engineering/    # Example node with concept/guide/failure HTML
```

## 4. Database Schema (v0.3)

Full schema in `db/schema.sql`. Key tables:

| Table | Purpose |
|---|---|
| `nodes` | Knowledge nodes (layer, sub_layer, maturity, certainty, freshness, type) |
| `edges` | Directed relationships (depends_on / extends / replaces / uses / related_to) |
| `tags` | Frontier tag system (maturity / certainty / freshness / type categories) |
| `node_tags` | Many-to-many node ↔ tag |
| `content` | HTML content per node (concept / guide / playbook / case_study / failure) |
| `resources` | External resources (datasets / repos / tools / benchmarks) |

Layer values: `AI Infrastructure` | `Execution` | `Agents` | `Applications`

## 5. Backend Architecture

### Python FastAPI (`backend/python/`)

Handles all main application data. Currently mock data, designed for easy swap to real DB.

### Go Gin (`backend/go/`)

Handles the AI knowledge graph with pgvector support for future semantic search.

```
cmd/server/main.go
internal/
├── handler/pathway.go      → HTTP handlers
├── model/node.go           → Node, Lineage structs
└── repository/node_repo.go → pgx database queries
```

## 6. Styling System

No CSS framework. All styles in `globals.css` using CSS custom properties.

### Design Tokens

```css
--ink: #1a1a2e          /* primary text */
--teal: #048a81         /* brand accent */
--surface: #f8f8fc      /* page/content background */
--card: #ffffff         /* sidebar, window, card background */
--border: #e8e8f0
```

Dark mode overrides via `[data-theme="dark"]` selector.

### Typography

| Usage | Font |
|---|---|
| Logo (EN) | Playfair Display, italic 800 |
| Logo (ZH) / headings | Noto Serif SC 600 |
| Body | DM Sans 300–500 |

### Window Chrome

Neo-brutalism style: `2px solid #1a1a2e` border + `6px 6px 0 #1a1a2e` offset shadow.

## 7. Deployment

### Docker Compose Services

| Service | Image | Port |
|---|---|---|
| `db` | pgvector/pgvector:pg16 | 5432 |
| `api` | backend/python | 8000 |
| `pathway` | backend/go | 8080 |
| `frontend` | frontend (standalone) | 3000 |

### Environment Variables

Frontend (`frontend/.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Production Notes

- Frontend uses `output: 'standalone'` for minimal Docker image
- Auth uses Supabase cloud — no local DB needed for login/session
- Local PostgreSQL (in `docker-compose.yml`) is for the Go knowledge graph service only
- Set `ALLOWED_ORIGIN` in Go backend to your production domain before deploying
