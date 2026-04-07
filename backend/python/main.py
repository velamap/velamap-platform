from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from pydantic import BaseModel
from typing import List, Optional
import datetime
import os

app = FastAPI(title="Velamap API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB（可选，无环境变量时跳过）
_db_url = os.getenv("DATABASE_URL") or (
    "postgresql://{user}:{password}@{host}/{db}".format(
        user=os.getenv("POSTGRES_USER", "vela_user"),
        password=os.getenv("POSTGRES_PASSWORD", "vela_secure_pass"),
        host=os.getenv("POSTGRES_HOST", "postgres"),
        db=os.getenv("POSTGRES_DB", "velamap"),
    ) if os.getenv("POSTGRES_HOST") else None
)
engine = create_engine(_db_url) if _db_url else None

# Models
class Task(BaseModel):
    id: int
    title: str
    tag: str
    steps: List[str]
    duration: str
    badges: List[str]
    completed: bool = False

class Profile(BaseModel):
    name: str
    role: str
    score: int
    initial_score: int
    streak: int
    max_streak: int
    tasks_completed: int
    rank: int
    total_members: int
    joined_days: int

class GroupMember(BaseModel):
    name: str
    color: str
    week: List[int]
    streak: int
    rank: int

# Mock Data
tasks_db = [
    Task(
        id=1,
        title="用 AI 将你昨天的一段会议纪要，改写成可直接发给老板的结构化决策备忘录",
        tag="今日任务",
        duration="预计 5 分钟",
        badges=["沟通效率", "文档写作", "Claude / ChatGPT"],
        steps=[
            "打开 Claude 或 ChatGPT，粘贴你最近一次会议纪要（哪怕很简陋的文字记录都行）",
            "输入 Prompt：「将以上内容改写为决策备忘录，包含：背景一句话、核心决策、执行负责人与时间节点、风险提示」",
            "对比 AI 输出和你自己写的版本，记录最让你惊喜的一点，填入今日反馈"
        ]
    )
]

user_profile = Profile(
    name="吴道子",
    role="产品经理 · 7年",
    score=71,
    initial_score=47,
    streak=23,
    max_streak=31,
    tasks_completed=87,
    rank=2,
    total_members=5,
    joined_days=94
)

group_members = [
    GroupMember(name="你", color="#048a81", week=[1, 1, 1, 1, 1, 1, 1], streak=23, rank=2),
    GroupMember(name="成员 1", color="#5b4fcf", week=[1, 1, 1, 1, 1, 1, 1], streak=31, rank=1),
    GroupMember(name="成员 2", color="#d4890a", week=[1, 1, 0, 1, 1, 0, 1], streak=12, rank=3),
    GroupMember(name="成员 3", color="#c94040", week=[1, 1, 0, 0, 0, 0, 0], streak=2, rank=4),
    GroupMember(name="成员 4", color="#888", week=[1, 0, 1, 0, 1, 0, 1], streak=7, rank=5),
]

@app.get("/api/tasks", response_model=List[Task])
async def get_tasks():
    return tasks_db

@app.post("/api/tasks/{task_id}/complete")
async def complete_task(task_id: int):
    for task in tasks_db:
        if task.id == task_id:
            if not task.completed:
                task.completed = True
                user_profile.tasks_completed += 1
                user_profile.streak += 1
                if user_profile.streak > user_profile.max_streak:
                    user_profile.max_streak = user_profile.streak
            return {"status": "success", "task": task}
    raise HTTPException(status_code=404, detail="Task not found")

@app.get("/api/profile", response_model=Profile)
async def get_profile():
    return user_profile

@app.get("/api/group", response_model=List[GroupMember])
async def get_group():
    return sorted(group_members, key=lambda x: x.rank)

@app.get("/api/stats")
async def get_stats():
    return {
        "today": datetime.date.today().strftime("%Y-%m-%d"),
        "weekday": "星期二",  # Simplified for demo
        "day_num": 23
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


# ── 概念图谱 API ──────────────────────────────────────────────

@app.get("/api/nav")
def get_nav():
    """返回完整导航结构：一级分类 + 各分类下的概念列表"""
    if not engine:
        raise HTTPException(status_code=503, detail="Database not configured")
    with engine.connect() as conn:
        cats = conn.execute(text(
            "SELECT id, slug, zh_label, en_label, icon FROM nav_categories ORDER BY sort_order"
        )).fetchall()
        concepts = conn.execute(text(
            "SELECT slug, category_id, zh_name, en_name, icon, zh_desc, en_desc "
            "FROM concepts ORDER BY category_id, sort_order"
        )).fetchall()

    concept_map: dict = {}
    for c in concepts:
        concept_map.setdefault(c.category_id, []).append({
            "id": c.slug,
            "zh": c.zh_name,
            "en": c.en_name,
            "icon": c.icon,
            "descZh": c.zh_desc,
            "descEn": c.en_desc,
        })

    return {
        "categories": [
            {
                "id": cat.slug,
                "zhLabel": cat.zh_label,
                "enLabel": cat.en_label,
                "icon": cat.icon,
                "topics": concept_map.get(cat.id, []),
            }
            for cat in cats
        ]
    }

class RelatedConcept(BaseModel):
    id: str
    name: str
    description: Optional[str] = None

class ConceptDetail(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    upstream: List[RelatedConcept] = []
    parallel: List[RelatedConcept] = []
    downstream: List[RelatedConcept] = []

@app.get("/api/concepts")
def list_concepts():
    if not engine:
        raise HTTPException(status_code=503, detail="Database not configured")
    with engine.connect() as conn:
        rows = conn.execute(text(
            "SELECT slug, zh_name, en_name, zh_desc, en_desc FROM concepts ORDER BY category_id, sort_order"
        )).fetchall()
    return {"concepts": [{"id": r.slug, "zh": r.zh_name, "en": r.en_name, "descZh": r.zh_desc, "descEn": r.en_desc} for r in rows]}

@app.get("/api/concept/{slug}", response_model=ConceptDetail)
def get_concept(slug: str):
    if not engine:
        raise HTTPException(status_code=503, detail="Database not configured")
    with engine.connect() as conn:
        concept = conn.execute(
            text("SELECT id, slug, zh_name, en_name, zh_desc FROM concepts WHERE slug = :slug"),
            {"slug": slug}
        ).fetchone()
        if not concept:
            raise HTTPException(status_code=404, detail="concept not found")
        relations = conn.execute(
            text("""
                SELECT cr.rel_type, c.slug, c.zh_name, c.zh_desc
                FROM concept_relations cr
                JOIN concepts c ON cr.target_id = c.id
                WHERE cr.source_id = :sid
            """),
            {"sid": concept.id}
        ).fetchall()
    upstream, parallel, downstream = [], [], []
    for r in relations:
        item = RelatedConcept(id=r.slug, name=r.zh_name, description=r.zh_desc)
        if r.rel_type == "upstream": upstream.append(item)
        elif r.rel_type == "parallel": parallel.append(item)
        elif r.rel_type == "downstream": downstream.append(item)
    return ConceptDetail(
        id=concept.slug, name=concept.zh_name, slug=concept.slug,
        description=concept.zh_desc,
        upstream=upstream, parallel=parallel, downstream=downstream,
    )
