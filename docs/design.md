# 设计文档 - 起飞AI (AI Transformation OS)

## 1. 技术架构
本项目采用经典的前后端分离架构，通过 Docker Compose 进行容器化编排。

- **前端**: React (Vite) + Vanilla CSS
- **后端**: FastAPI (Python 3.11)
- **数据库**: PostgreSQL (Docker 容器)
- **反向代理**: Nginx (用于前端静态资源托管及 API 请求转发)

## 2. 目录结构
```text
SkillMarket/
├── backend/            # FastAPI 后端
│   ├── main.py         # 业务逻辑与模型定义
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/           # React 前端
│   ├── src/            # 页面组件与样式
│   ├── nginx.conf      # Nginx 转发配置
│   └── Dockerfile      # 多阶段构建
├── docs/               # 项目文档
└── docker-compose.yml  # 容器编排
```

## 3. 数据模型设计

### Profile (用户画像)
- `name`: 姓名
- `role`: 职位与年限
- `score`: 当前 AI 就绪度评分
- `initial_score`: 初始评分
- `streak`: 连续打卡天数
- `tasks_completed`: 累计完成任务数

### Task (任务)
- `id`: 唯一标识
- `title`: 任务标题
- `tag`: 分类标签
- `steps`: 步骤列表 (Array)
- `duration`: 预计时长
- `completed`: 完成状态 (Boolean)

### GroupMember (小组统计)
- `name`: 成员名（支持匿名显示）
- `rank`: 排名
- `week_data`: 本周 7 天的打卡状态二进制数组

## 4. API 设计
- `GET /api/profile`: 获取当前用户信息
- `GET /api/tasks`: 获取今日任务列表
- `POST /api/tasks/{id}/complete`: 标记任务完成
- `GET /api/group`: 获取小组排行榜数据
- `GET /api/stats`: 获取当前系统日期与基础统计

## 5. 安全与部署
- **代理切换**: 开发环境下使用 Vite Proxy；生产环境下通过 Nginx `location /api` 转发。
- **环境隔离**: 使用 Docker 确保开发、测试与生产环境的一致性。
