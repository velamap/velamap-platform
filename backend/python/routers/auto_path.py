"""
Auto Path Router
GET /api/auto-path?target=<slug>&type=learning|engineering|reverse|minimal
"""
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text
from pydantic import BaseModel
from typing import List
from db import engine
from path_engine import generate_path

router = APIRouter(prefix="/api", tags=["auto-path"])

VALID_TYPES = {"learning", "engineering", "reverse", "minimal"}


class AutoPathNode(BaseModel):
    slug: str
    zh_name: str
    en_name: str
    difficulty: int
    importance: int
    step_order: int


class AutoPathResponse(BaseModel):
    target: str
    path_type: str
    total_cost: float
    cached: bool
    nodes: List[AutoPathNode]


def _require_db():
    if not engine:
        raise HTTPException(status_code=503, detail="Database not configured")


# ── 从 DB 加载图 ──────────────────────────────────────────────

def _load_graph(conn):
    rows = conn.execute(text(
        "SELECT id, slug, difficulty, importance FROM concepts"
    )).fetchall()
    nodes = {r.id: {"slug": r.slug, "difficulty": r.difficulty, "importance": r.importance}
             for r in rows}
    slug_to_id = {r.slug: r.id for r in rows}

    edges_raw = conn.execute(text(
        "SELECT source_id, target_id, rel_type FROM concept_relations"
    )).fetchall()
    edges = [(r.source_id, r.target_id, r.rel_type) for r in edges_raw]

    return nodes, edges, slug_to_id


# ── 缓存读写 ──────────────────────────────────────────────────

def _get_cached(conn, target_slug: str, path_type: str):
    row = conn.execute(text("""
        SELECT id FROM auto_paths
        WHERE target_slug = :ts AND path_type = :pt
        ORDER BY created_at DESC LIMIT 1
    """), {"ts": target_slug, "pt": path_type}).fetchone()
    if not row:
        return None
    nodes = conn.execute(text("""
        SELECT c.slug, c.zh_name, c.en_name, c.difficulty, c.importance,
               apn.step_order
        FROM auto_path_nodes apn
        JOIN concepts c ON apn.concept_id = c.id
        WHERE apn.path_id = :pid
        ORDER BY apn.step_order
    """), {"pid": row.id}).fetchall()
    return nodes


def _save_path(conn, target_slug: str, start_slug: str,
               path_type: str, total_cost: float, concept_ids: list):
    res = conn.execute(text("""
        INSERT INTO auto_paths (target_slug, start_slug, path_type, total_cost)
        VALUES (:ts, :ss, :pt, :tc) RETURNING id
    """), {"ts": target_slug, "ss": start_slug, "pt": path_type, "tc": total_cost})
    path_id = res.fetchone().id
    for i, cid in enumerate(concept_ids):
        conn.execute(text("""
            INSERT INTO auto_path_nodes (path_id, concept_id, step_order)
            VALUES (:pid, :cid, :so)
        """), {"pid": path_id, "cid": cid, "so": i})


# ── 端点 ──────────────────────────────────────────────────────

@router.get("/auto-path", response_model=AutoPathResponse)
def get_auto_path(
    target: str = Query(..., description="Target concept slug"),
    type: str  = Query("learning", description="learning|engineering|reverse|minimal"),
):
    _require_db()
    if type not in VALID_TYPES:
        raise HTTPException(status_code=400, detail=f"type must be one of {VALID_TYPES}")

    with engine.connect() as conn:
        # 检查 target 存在
        target_row = conn.execute(
            text("SELECT id, slug FROM concepts WHERE slug = :s"), {"s": target}
        ).fetchone()
        if not target_row:
            raise HTTPException(status_code=404, detail=f"concept '{target}' not found")

        # 尝试缓存
        cached_nodes = _get_cached(conn, target, type)
        if cached_nodes:
            return AutoPathResponse(
                target=target, path_type=type, total_cost=0,
                cached=True,
                nodes=[AutoPathNode(
                    slug=n.slug, zh_name=n.zh_name, en_name=n.en_name,
                    difficulty=n.difficulty, importance=n.importance,
                    step_order=n.step_order,
                ) for n in cached_nodes],
            )

        # 实时生成
        nodes, edges, slug_to_id = _load_graph(conn)
        target_id = slug_to_id.get(target)
        if not target_id:
            raise HTTPException(status_code=404, detail="concept not in graph")

        path_ids, total_cost = generate_path(nodes, edges, target_id, path_type=type)
        if not path_ids:
            raise HTTPException(status_code=422, detail="no path found to target concept")

        # 查询路径节点详情
        id_list = ",".join(str(i) for i in path_ids)
        detail_rows = conn.execute(text(
            f"SELECT id, slug, zh_name, en_name, difficulty, importance "
            f"FROM concepts WHERE id IN ({id_list})"
        )).fetchall()
        detail_map = {r.id: r for r in detail_rows}

        result_nodes = []
        for step, cid in enumerate(path_ids):
            r = detail_map.get(cid)
            if r:
                result_nodes.append(AutoPathNode(
                    slug=r.slug, zh_name=r.zh_name, en_name=r.en_name,
                    difficulty=r.difficulty, importance=r.importance,
                    step_order=step,
                ))

        # 写缓存（失败不影响响应）
        try:
            start_slug = nodes[path_ids[0]]["slug"] if path_ids else target
            _save_path(conn, target, start_slug, type, total_cost, path_ids)
            conn.commit()
        except Exception:
            conn.rollback()

        return AutoPathResponse(
            target=target, path_type=type, total_cost=round(total_cost, 2),
            cached=False, nodes=result_nodes,
        )


# ── 清除缓存（开发用）────────────────────────────────────────

@router.delete("/auto-path/cache")
def clear_auto_path_cache(target: str = Query(...)):
    _require_db()
    with engine.connect() as conn:
        conn.execute(text(
            "DELETE FROM auto_paths WHERE target_slug = :t"
        ), {"t": target})
        conn.commit()
    return {"cleared": target}