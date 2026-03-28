# Roadmap — Vela AI

> **版本历史**
> | 版本 | 日期 | 变更摘要 |
> |------|------|---------|
> | v0.3 | 2026-03-26 | AI Knowledge OS v4 重构完成 |
> | v0.2 | 2026-03 | 双模式、i18n、Settings |
> | v0.1 | 2026-03 | 初始版本 |

---

## ✅ v0.3 — AI Knowledge OS (2026-03-26 完成)

### 前端
- [x] 五层知识导航：Frontier / Applications / Agents / Execution / AI Infrastructure
- [x] 中英文完整翻译（技术术语保留英文）
- [x] OS 模式窗口支持自定义缩放（8个 resize handle，min 280×180px）
- [x] 窗口尺寸持久化（打开新窗口不重置已缩放的窗口）
- [x] Web 模式侧边栏可收缩（180px ↔ 56px）
- [x] Web 模式浅色风格统一（sidebar + page 同色系）
- [x] 模式切换移入用户菜单（头像点击弹出）
- [x] OS/Web 模式对访客开放（无需登录）
- [x] 右上角控件位置固定（切换模式不晃动）

### 数据库
- [x] PostgreSQL schema：nodes / edges / tags / node_tags / content / resources
- [x] 内容导入脚本 `db/import.py`
- [x] 示例节点：Harness Engineering（concept + guide + failure）

---

## v0.4 — 内容填充 (Q2 2026)

- [ ] 为五个模块填充真实节点数据（每层 5–10 个核心节点）
- [ ] 运行 `import.py` 写入 Supabase
- [ ] 前端从 Supabase 读取节点数据（替换硬编码内容）
- [ ] 节点详情页：点击 tag 展开 concept/guide/failure 内容
- [ ] 节点间关系可视化（edges 表）

---

## v0.5 — 知识图谱交互 (Q2–Q3 2026)

- [ ] Go 后端：节点 API（按 layer 查询、按 slug 查询）
- [ ] 前端：交互式图谱视图（SVG/canvas，节点 + 边）
- [ ] Tech Radar 视图（圆形，距离 = maturity）
- [ ] 节点搜索（全文 + pgvector 语义搜索）
- [ ] Admin 面板：添加节点、定义关系

---

## v0.6 — 个人化 (Q3 2026)

- [ ] 用户收藏节点
- [ ] 学习进度追踪（已读 / 已掌握）
- [ ] 个人知识地图（基于收藏和进度）
- [ ] 推荐下一个节点（基于当前层级和关系）

---

## v0.7 — Mobile & PWA (Q3 2026)

- [ ] Web 模式响应式布局（移动端自动切换）
- [ ] PWA manifest + service worker
- [ ] 离线内容缓存

---

## v1.0 — 协作与企业 (Q4 2026)

- [ ] 团队知识库（共享节点集合）
- [ ] 企业 AI 就绪度评估
- [ ] 订阅 / 付费内容
- [ ] 可分享的知识地图（公开 URL）

---

## Infrastructure Scaling Triggers

| When | Add |
|---|---|
| 内容量 > 1000 节点 | 全文搜索索引（pg_trgm 或 Meilisearch） |
| 语义搜索需求 | pgvector 或 Qdrant |
| 静态资源 CDN | Nginx 反向代理 |
| 高并发 | Redis 缓存层 |
| 异步任务 | Celery + Redis queue |
