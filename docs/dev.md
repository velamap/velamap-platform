# Dev Guide — 本地开发快速上手

## 前置条件

- Docker Desktop 已安装并运行
- Python 3（用于数据管理脚本）
- 项目根目录：`/path/to/velamap-platform`

验证 Docker：
```bash
docker --version
docker ps
```

---

## 首次启动

```bash
# 清空旧数据，全量重建（首次或重置时用）
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d --build
```

启动后等待约 30 秒，访问：
- 前端：http://localhost:3000
- API：http://localhost:8000/docs
- PostgreSQL：localhost:5432

---

## 日常开发

```bash
# 只重建前端（改了前端代码后）
docker-compose -f docker-compose.dev.yml up -d --build frontend

# 只重建后端（改了 backend/python/ 后）
docker-compose -f docker-compose.dev.yml up -d --build api

# 查看所有服务状态
docker-compose -f docker-compose.dev.yml ps

# 查看日志
docker-compose -f docker-compose.dev.yml logs frontend
docker-compose -f docker-compose.dev.yml logs api
docker-compose -f docker-compose.dev.yml logs postgres
```

---

## 验证接口

```bash
# 导航数据（分类 + 概念列表）
curl http://localhost:8000/api/nav

# 概念列表
curl http://localhost:8000/api/concepts

# 概念详情（含上下游关系）
curl http://localhost:8000/api/concept/rag
```

---

## 数据管理

```bash
# 列出所有概念（含本地 MDX 状态）
python3 db/seed.py list

# 交互式添加概念（含 MDX 内容）
python3 db/seed.py add-concept

# 为已有概念补充 MDX 内容
python3 db/seed.py add-content <slug>

# 从 JSON 批量导入
python3 db/seed.py from-json db/seed_example.json
```

数据库连接默认读取环境变量，本地直连 postgres 容器（5432 已暴露）：
```bash
POSTGRES_HOST=localhost python3 db/seed.py list
```

---

## 重置数据库

```bash
# 清空 volume，重新执行 sql/init.sql
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

修改了 `sql/init.sql` 后必须执行上面两条，否则不会重新初始化。

---

## 内容说明

概念详情页的正文内容（Lens 视角）加载优先级：

1. GitHub 知识库：`nodes/{slug}/content/{lang}/index.md`
2. 本地 MDX：`frontend/content/{slug}/{lens}.mdx`（`seed.py` 写入此处）

新增概念后，若 GitHub 无对应文件，用 `python3 db/seed.py add-content <slug>` 写入本地 MDX 即可。

---

## 停止服务

```bash
docker-compose -f docker-compose.dev.yml down
```
