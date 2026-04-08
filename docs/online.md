***

# Production — 线上环境操作指南

## 服务地址

| 服务 | 地址 |
|---|---|
| 前端 | https://velamap.com |
| API | https://velamap.com/api/nav (内部: 8201) |
| PostgreSQL | 容器内网，端口未暴露 |
| Qdrant | 未部署 |

## 登录服务器

```bash
ssh <user>@<ec2-host>
cd ~/velamap-platform
```

## 常用操作

```bash
# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f api
docker compose logs -f frontend
docker compose logs -f postgres

# 重启服务
docker compose restart api
docker compose restart frontend

# 查看资源占用
docker stats
```

## 部署更新

### 改了代码（需要重新构建镜像）

```bash
git pull
docker compose build
docker compose down
docker compose up -d
```

### 只改了配置（docker-compose.yml、环境变量等）

```bash
git pull
docker compose down
docker compose up -d
```

### 一条命令完成（改代码时）

```bash
git pull && docker compose build && docker compose down && docker compose up -d
```

### 验证

```bash
curl http://localhost:8201/api/nav
docker compose ps
```

## 紧急回滚

```bash
# 查看历史版本
docker compose ps --all

# 回滚到上一个镜像版本
docker compose rollback

# 或者指定版本回滚
docker compose up -d --scale api=1
```

## 数据库操作

```bash
# 进入 PostgreSQL 容器
docker exec -it velamap-platform-postgres-1 psql -U vela_user -d velamap

# 查看表
\d nav_categories
\d concepts
\d concept_relations

# 手动查询
SELECT * FROM nav_categories;
SELECT * FROM concepts;
```

## 常见问题

### 503 Service Unavailable
- 检查 API 日志：`docker compose logs api`
- 常见原因：DATABASE_URL 未正确配置

### 前端加载失败
- 检查前端日志：`docker compose logs frontend`
- 确认 INTERNAL_API_URL 正确

### 数据库连接超时
- 确认 postgres 容器运行中：`docker compose ps postgres`
- 检查网络：`docker network inspect velamap_velamap`

## 停止服务

```bash
docker compose down
```

***
