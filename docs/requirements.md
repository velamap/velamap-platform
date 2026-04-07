# Requirements — Vela AI

> **版本历史**
> | 版本 | 日期 | 变更摘要 |
> |------|------|---------|
> | v0.5 | 2026-04-07 | 去除 Supabase 依赖，本地 PostgreSQL，导航数据动态化 |
> | v0.3 | 2026-03-26 | 产品定位转型为 AI Knowledge OS；五层知识体系 |
> | v0.1 | 2026-03 | 初始版本 |

---

## 1. Background

Vela AI 是一个 **AI 知识图谱平台**，面向 AI 工程师、产品经理和研究者，提供结构化的 AI 知识体系。

核心价值：将碎片化的 AI 知识（论文、博客、工具）组织成分层架构，并通过人工定义的上下游关系呈现概念间的依赖与演进。

## 2. Knowledge Architecture

### 2.1 导航层级

```
一级分类 (nav_categories)
  └── 概念卡片 (concepts)
        └── 内容视角 (lens: conceptual / mechanical / practical / comparative / evolutionary / critical)
```

一级分类当前五个：前沿探索 / 应用方案 / 工程化 / 智能体 / 基础设施。分类和概念均存储在 PostgreSQL，可通过 `db/seed.py` 动态增减。

### 2.2 概念关系

每个概念可定义三类关系：

| 关系类型 | 含义 |
|---|---|
| `upstream` | 前置依赖（理解本概念需要先了解的） |
| `parallel` | 同级替代或互补方案 |
| `downstream` | 本概念衍生出的应用或扩展 |

### 2.3 内容视角（Lens）

六个固定视角，前端硬编码（不从数据库取）：

| Lens | 说明 |
|---|---|
| conceptual | 概念定义 |
| mechanical | 工作机制 |
| practical | 实践指南 |
| comparative | 横向对比 |
| evolutionary | 演进历史 |
| critical | 批判分析 |

## 3. UI Requirements

### 3.1 Web 模式（默认）

- 可收缩侧边栏（180px ↔ 60px icon-only）
- 侧边栏导航项从数据库动态加载
- 概念卡片网格，点击进入详情
- 详情页左侧 Lens 导航，右侧 TOC
- 顶部搜索框（⌘K 快捷键），跨分类搜索概念

### 3.2 OS 模式

- 桌面图标网格，双击打开可拖拽/缩放窗口
- 窗口内容与 Web 模式完全一致（SharedDocView 复用）
- 图标和窗口标题从数据库动态加载

### 3.3 国际化

- 全量中英文切换
- 技术术语保留英文（RAG、Transformer、ReAct 等）

### 3.4 认证（暂时关闭）

- 登录功能已注释，所有内容对访客开放
- 恢复方式：取消 `page.tsx`、`middleware.ts`、`AppShell.tsx` 中的注释

## 4. Data Requirements

### 4.1 数据存储

所有导航和概念数据存储在本地 PostgreSQL，不依赖 Supabase 或外部服务。

### 4.2 内容存储

概念详情内容（Lens 正文）优先从 GitHub 知识库拉取，fallback 到本地 MDX 文件。

### 4.3 数据管理

- 初始数据：`sql/init.sql`（容器首次启动自动执行）
- 增量更新：`db/seed.py`（支持交互式和 JSON 批量导入）
- 数据格式：`db/seed_example.json`

## 5. Non-Functional Requirements

| 需求 | 目标 |
|---|---|
| 首屏加载 | < 2s |
| 导航数据加载 | ISR 60s 缓存 |
| 内存占用 | 三个容器总计 < 768M（1核1G 服务器） |
| 部署 | 单条 `docker-compose up` 启动全栈 |
| 数据重置 | `docker-compose down -v && up` |

## 6. Out of Scope（当前）

- 用户账号系统（登录已注释）
- 实时协作
- AI 生成内容
- 付费订阅
- 移动端响应式
