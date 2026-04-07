from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from pydantic import BaseModel
from typing import List, Optional
from db import engine

router = APIRouter(prefix="/api", tags=["concepts"])

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

def _require_db():
    if not engine:
        raise HTTPException(status_code=503, detail="Database not configured")

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

@router.get("/concepts")
def list_concepts():
    _require_db()
    with engine.connect() as conn:
        rows = conn.execute(text(
            "SELECT slug, zh_name, en_name, zh_desc, en_desc FROM concepts ORDER BY category_id, sort_order"
        )).fetchall()
    return {"concepts": [{"id": r.slug, "zh": r.zh_name, "en": r.en_name, "descZh": r.zh_desc, "descEn": r.en_desc} for r in rows]}

@router.get("/concept/{slug}", response_model=ConceptDetail)
def get_concept(slug: str):
    _require_db()
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
        if r.rel_type == "upstream":    upstream.append(item)
        elif r.rel_type == "parallel":  parallel.append(item)
        elif r.rel_type == "downstream":downstream.append(item)

    return ConceptDetail(
        id=concept.slug, name=concept.zh_name, slug=concept.slug,
        description=concept.zh_desc,
        upstream=upstream, parallel=parallel, downstream=downstream,
    )
