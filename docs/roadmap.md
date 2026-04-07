# Roadmap — Vela AI

> **版本历史**
> | 版本 | 日期 | 变更摘要 |
> |------|------|---------|
> | v0.5 | 2026-04-07 | 本地 PostgreSQL，导航动态化，seed 脚本 |
> | v0.4 | 2026-03-28 | MDX Content Engine，SharedDocView |
> | v0.3 | 2026-03-26 | AI Knowledge OS v4 重构 |

---

## ✅ v0.5 — 本地 PostgreSQL + 动态导航（2026-04-07 完成）

- [x] 去除 Supabase 依赖，改用本地 PostgreSQL 15
- [x] 登录功能注释（middleware + page.tsx + AppShell）
- [x] 新表结构：`nav_categories` + `concepts` + `concept_relations`
- [x] Python API：`/api/nav`、`/api/concepts`、`/api/concept/{slug}`
- [x] Next.js `/api/nav` 代理路由（ISR 60s）
- [x] `AppShell.tsx` 导航从 API 动态加载，去除硬编码 `NAV_ITEMS`/`TOPICS`
- [x] `SharedDocView.tsx` 通过 props 接收数据，不再依赖硬编码常量
- [x] `Desktop.tsx` 同步动态化
- [x] `db/seed.py` 数据管理脚本（list / add-concept / add-category / from-json）
- [x] `db/seed_example.json` 批量导入示例
- [x] docker-compose 三服务：postgres + api + frontend

---

## ✅ v0.4 — MDX Content Engine（2026-03-28 完成）

- [x] 内容从 GitHub 知识库动态拉取（ISR 60s）
- [x] 本地 MDX fallback
- [x] SharedDocView 统一 Web/OS 内容渲染
- [x] 动态 TOC 提取
- [x] 全局 LangDropdown

---

## ✅ v0.3 — AI Knowledge OS（2026-03-26 完成）

- [x] 五层知识导航
- [x] OS 窗口拖拽/缩放（8个 handle）
- [x] Web 模式侧边栏可收缩
- [x] 中英文完整切换
- [x] Settings 面板

---

## v0.6 — 内容填充（下一步）

- [ ] 为每个概念补充 MDX 内容（6个 lens × N 个概念）
- [ ] 概念上下游关系可视化（SVG 图谱）
- [ ] 点击概念卡片展示 upstream/parallel/downstream 关系面板
- [ ] 搜索结果高亮匹配词

---

## v0.7 — 管理后台

- [ ] 简单 CRUD 界面：添加/编辑概念和分类
- [ ] 关系编辑器：可视化定义上下游
- [ ] 批量导入 UI（上传 JSON）

---

## v0.8 — 恢复认证

- [ ] 取消注释登录功能
- [ ] 用户收藏概念
- [ ] 学习进度追踪

---

## v1.0 — 生产就绪

- [ ] 移动端响应式
- [ ] 全文搜索（pg_trgm）
- [ ] 语义搜索（pgvector）
- [ ] 可分享的概念页面（公开 URL）
- [ ] 团队知识库

---

## Infrastructure Scaling Triggers

| 触发条件 | 扩展方案 |
|---|---|
| 概念数 > 500 | pg_trgm 全文搜索索引 |
| 语义搜索需求 | pgvector 或 Qdrant |
| 并发 > 100 | Redis 缓存 `/api/nav` |
| 内容量大 | CDN 静态资源 |
