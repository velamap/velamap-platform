# Requirements — Vela AI

> **版本历史**
> | 版本 | 日期 | 变更摘要 |
> |------|------|---------|
> | v0.3 | 2026-03-26 | 产品定位转型为 AI Knowledge OS；五层知识体系替代任务/打卡 demo |
> | v0.2 | 2026-03 | 双模式切换、i18n、Settings 面板 |
> | v0.1 | 2026-03 | 初始版本，任务系统、打卡、成长档案 |

---

## 1. Background

Vela AI is an **AI Knowledge OS** — a structured knowledge system for AI practitioners and professionals who want to understand and apply AI at depth.

The core insight: AI knowledge is fragmented across papers, blogs, and tools. Vela AI organizes it into a layered architecture (Infrastructure → Execution → Agents → Applications) with a Frontier tag system for tracking maturity and relevance.

Target users: AI engineers, product managers, researchers, and knowledge workers building AI-powered systems.

## 2. Knowledge Architecture

### 2.1 Four-Layer Model

```
AI Infrastructure → Execution → Agents → Applications
```

| Layer | Role | Key Concepts |
|---|---|---|
| AI Infrastructure | Capability source | Transformer, MoE, vLLM, KV Cache, Datasets |
| Execution | Core runtime | Orchestration, RAG, Harness Engineering, Observability |
| Agents | Decision logic | Planning, ReAct, Multi-Agent, Cognitive Modeling |
| Applications | Use cases | Capability × Domain matrix |

**Rule**: Each node belongs to exactly one layer. Cross-layer relationships expressed via `edges` table.

### 2.2 Frontier Tag System

Frontier is a **tag system**, not a layer. Tags classify nodes by:

| Dimension | Values |
|---|---|
| maturity | foundation / mainstream / emerging / speculative |
| certainty | validated / experimental / speculative |
| freshness | new / trending / stable |
| type | research / paradigm / system / application |

### 2.3 Content Types

Each node can have multiple content pieces:
- `concept` — what it is
- `guide` — how to use it
- `playbook` — step-by-step workflow
- `case_study` — real-world example
- `failure` — common failure modes

## 3. UI Requirements

### 3.1 OS Mode (Desktop)

- Icon grid on left, each icon opens a draggable window
- Windows: drag to move, resize from any edge/corner (min 280×180px)
- Maximize/minimize/close controls
- Multiple windows open simultaneously, z-index stacking
- Settings panel (bottom-left): language, theme, mode switch, account

### 3.2 Web Mode (AppShell)

- Collapsible sidebar (180px ↔ 56px icon-only)
- Five navigation items matching the five modules
- Top nav: theme + language toggles
- User menu (avatar click): mode switch + sign-out
- Guest-accessible without login

### 3.3 Internationalization

- Full EN/ZH switching for all UI text
- Technical terms preserved in English (RAG, Transformer, ReAct, etc.)
- Translatable: section titles, capability names, domain names, UI labels

### 3.4 Authentication

- Google OAuth via Supabase
- Both modes accessible as guest
- Logged-in users see account info and sign-out in user menu

## 4. Data Requirements

### 4.1 Node Schema

```sql
nodes (id, name, slug, layer, sub_layer, description,
       capabilities[], domains[], maturity, certainty,
       freshness, type, cost, created_at, updated_at)
```

### 4.2 Content Import

- Content stored as HTML files in `db/content/<slug>/`
- `node.json` defines node metadata
- `import.py` script reads directory and writes to Supabase

### 4.3 Graph Queries

- Dependency query: `edges WHERE from_node = X AND relation_type = 'depends_on'`
- Related query: all edges from a node

## 5. Non-Functional Requirements

| Requirement | Target |
|---|---|
| First load | < 2s on broadband |
| Auth redirect | < 3s round-trip |
| Animation | 60fps drag/resize interactions |
| Mode switch | Instant, no page reload |
| Security | `.env.local` never committed; Supabase RLS for user data |
| Deployment | Single `docker-compose up` for full stack |

## 6. Out of Scope (current)

- Mobile / responsive layout (desktop-first)
- Real-time collaboration
- AI-generated content
- Payment / subscription
- Recommendation system
- Neo4j or complex GraphQL
