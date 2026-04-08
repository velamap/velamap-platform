from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from pydantic import BaseModel
from typing import List, Optional
from db import engine

router = APIRouter(prefix="/api", tags=["concepts"])


def _require_db():
    if not engine:
        raise HTTPException(status_code=503, detail="Database not configured")


# ── Pydantic Models ───────────────────────────────────────────

class RelatedConcept(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    weight: float = 1.0

class AxisTag(BaseModel):
    axis_type: str
    name: str
    zh_name: str

class ConceptDetail(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    difficulty: int = 1
    importance: int = 1
    axes: List[AxisTag] = []
    upstream: List[RelatedConcept] = []
    parallel: List[RelatedConcept] = []
    downstream: List[RelatedConcept] = []
    # 扩展关系类型
    part_of: List[RelatedConcept] = []
    variant_of: List[RelatedConcept] = []
    used_by: List[RelatedConcept] = []
    implements: List[RelatedConcept] = []
    optimized_by: List[RelatedConcept] = []
    related_to: List[RelatedConcept] = []

class PathNodeItem(BaseModel):
    slug: str
    zh_name: str
    en_name: str
    step_order: int
    is_key: bool
    note: Optional[str] = None
    difficulty: int = 1

class LearningPath(BaseModel):
    id: int
    slug: str
    zh_name: str
    en_name: str
    description: Optional[str] = None
    path_type: str
    difficulty: int
    duration: int
    nodes: List[PathNodeItem] = []


# ── Nav ───────────────────────────────────────────────────────

@router.get("/nav")
def get_nav():
    _require_db()
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
            "id": c.slug, "zh": c.zh_name, "en": c.en_name,
            "icon": c.icon, "descZh": c.zh_desc, "descEn": c.en_desc,
        })

    return {
        "categories": [
            {
                "id": cat.slug, "zhLabel": cat.zh_label, "enLabel": cat.en_label,
                "icon": cat.icon, "topics": concept_map.get(cat.id, []),
            }
            for cat in cats
        ]
    }


# ── Concepts ──────────────────────────────────────────────────

@router.get("/concepts")
def list_concepts():
    _require_db()
    with engine.connect() as conn:
        rows = conn.execute(text(
            "SELECT slug, zh_name, en_name, zh_desc, en_desc, difficulty, importance "
            "FROM concepts ORDER BY importance DESC, sort_order"
        )).fetchall()
    return {"concepts": [
        {"id": r.slug, "zh": r.zh_name, "en": r.en_name,
         "descZh": r.zh_desc, "descEn": r.en_desc,
         "difficulty": r.difficulty, "importance": r.importance}
        for r in rows
    ]}


@router.get("/concept/{slug}", response_model=ConceptDetail)
def get_concept(slug: str):
    _require_db()
    with engine.connect() as conn:
        concept = conn.execute(
            text("SELECT id, slug, zh_name, en_name, zh_desc, difficulty, importance "
                 "FROM concepts WHERE slug = :slug"),
            {"slug": slug}
        ).fetchone()
        if not concept:
            raise HTTPException(status_code=404, detail="concept not found")

        # 关系（双向查询：source→target 和 target→source）
        relations = conn.execute(text("""
            SELECT cr.rel_type, cr.weight, c.slug, c.zh_name, c.zh_desc
            FROM concept_relations cr
            JOIN concepts c ON cr.target_id = c.id
            WHERE cr.source_id = :sid
            UNION
            SELECT
              CASE cr.rel_type
                WHEN 'upstream'   THEN 'downstream'
                WHEN 'downstream' THEN 'upstream'
                ELSE cr.rel_type
              END,
              cr.weight, c.slug, c.zh_name, c.zh_desc
            FROM concept_relations cr
            JOIN concepts c ON cr.source_id = c.id
            WHERE cr.target_id = :sid
              AND cr.rel_type IN ('upstream', 'downstream')
        """), {"sid": concept.id}).fetchall()

        # 语义轴
        axes = conn.execute(text("""
            SELECT a.axis_type, a.name, a.zh_name
            FROM concept_axes ca JOIN axes a ON ca.axis_id = a.id
            WHERE ca.concept_id = :cid
        """), {"cid": concept.id}).fetchall()

    rel_buckets: dict = {
        "upstream": [], "downstream": [], "parallel": [],
        "part_of": [], "variant_of": [], "used_by": [],
        "implements": [], "optimized_by": [], "related_to": [],
    }
    for r in relations:
        item = RelatedConcept(id=r.slug, name=r.zh_name, description=r.zh_desc, weight=r.weight)
        if r.rel_type in rel_buckets:
            rel_buckets[r.rel_type].append(item)

    return ConceptDetail(
        id=concept.slug, name=concept.zh_name, slug=concept.slug,
        description=concept.zh_desc,
        difficulty=concept.difficulty, importance=concept.importance,
        axes=[AxisTag(axis_type=a.axis_type, name=a.name, zh_name=a.zh_name) for a in axes],
        **rel_buckets,
    )


# ── Learning Paths ────────────────────────────────────────────

@router.get("/paths")
def list_paths():
    _require_db()
    with engine.connect() as conn:
        rows = conn.execute(text(
            "SELECT id, slug, zh_name, en_name, description, path_type, difficulty, duration "
            "FROM learning_paths ORDER BY difficulty, id"
        )).fetchall()
    return {"paths": [
        {"id": r.id, "slug": r.slug, "zh_name": r.zh_name, "en_name": r.en_name,
         "description": r.description, "path_type": r.path_type,
         "difficulty": r.difficulty, "duration": r.duration}
        for r in rows
    ]}


@router.get("/path/{slug}", response_model=LearningPath)
def get_path(slug: str):
    _require_db()
    with engine.connect() as conn:
        path = conn.execute(
            text("SELECT id, slug, zh_name, en_name, description, path_type, difficulty, duration "
                 "FROM learning_paths WHERE slug = :slug"),
            {"slug": slug}
        ).fetchone()
        if not path:
            raise HTTPException(status_code=404, detail="path not found")

        nodes = conn.execute(text("""
            SELECT c.slug, c.zh_name, c.en_name, c.difficulty,
                   pn.step_order, pn.is_key, pn.note
            FROM path_nodes pn
            JOIN concepts c ON pn.concept_id = c.id
            WHERE pn.path_id = :pid
            ORDER BY pn.step_order
        """), {"pid": path.id}).fetchall()

    return LearningPath(
        id=path.id, slug=path.slug, zh_name=path.zh_name, en_name=path.en_name,
        description=path.description, path_type=path.path_type,
        difficulty=path.difficulty, duration=path.duration,
        nodes=[
            PathNodeItem(slug=n.slug, zh_name=n.zh_name, en_name=n.en_name,
                         step_order=n.step_order, is_key=n.is_key,
                         note=n.note, difficulty=n.difficulty)
            for n in nodes
        ]
    )
