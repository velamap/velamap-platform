import os
from uuid import uuid4
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct, Filter,
)

router = APIRouter(prefix="/api/qdrant", tags=["qdrant"])

qdrant = QdrantClient(
    host=os.getenv("QDRANT_HOST", "qdrant"),
    port=int(os.getenv("QDRANT_PORT", "6333")),
)

class CollectionCreate(BaseModel):
    name: str
    vector_size: int = 1536
    distance: str = "Cosine"  # Cosine | Dot | Euclid

class PointUpsert(BaseModel):
    id: Optional[str] = None
    vector: List[float]
    payload: dict = {}

class PointSearch(BaseModel):
    vector: List[float]
    limit: int = 5
    filter: Optional[dict] = None

# ── Collections ───────────────────────────────────────────────

@router.get("/collections")
def list_collections():
    result = qdrant.get_collections()
    return {"collections": [c.name for c in result.collections]}

@router.post("/collections")
def create_collection(body: CollectionCreate):
    dist_map = {"Cosine": Distance.COSINE, "Dot": Distance.DOT, "Euclid": Distance.EUCLID}
    qdrant.recreate_collection(
        collection_name=body.name,
        vectors_config=VectorParams(size=body.vector_size, distance=dist_map.get(body.distance, Distance.COSINE)),
    )
    return {"status": "created", "collection": body.name}

@router.delete("/collections/{collection}")
def delete_collection(collection: str):
    qdrant.delete_collection(collection_name=collection)
    return {"status": "deleted", "collection": collection}

# ── Points ────────────────────────────────────────────────────

@router.post("/{collection}/points")
def upsert_point(collection: str, body: PointUpsert):
    point_id = body.id or str(uuid4())
    qdrant.upsert(
        collection_name=collection,
        points=[PointStruct(id=point_id, vector=body.vector, payload=body.payload)],
    )
    return {"status": "upserted", "id": point_id}

@router.get("/{collection}/points/{point_id}")
def get_point(collection: str, point_id: str):
    results = qdrant.retrieve(collection_name=collection, ids=[point_id], with_payload=True, with_vectors=True)
    if not results:
        raise HTTPException(status_code=404, detail="Point not found")
    p = results[0]
    return {"id": p.id, "vector": p.vector, "payload": p.payload}

@router.put("/{collection}/points/{point_id}/payload")
def update_payload(collection: str, point_id: str, payload: dict):
    qdrant.set_payload(collection_name=collection, payload=payload, points=[point_id])
    return {"status": "updated", "id": point_id}

@router.delete("/{collection}/points/{point_id}")
def delete_point(collection: str, point_id: str):
    qdrant.delete(collection_name=collection, points_selector=[point_id])
    return {"status": "deleted", "id": point_id}

@router.post("/{collection}/search")
def search_points(collection: str, body: PointSearch):
    results = qdrant.search(
        collection_name=collection,
        query_vector=body.vector,
        limit=body.limit,
        query_filter=Filter(**body.filter) if body.filter else None,
        with_payload=True,
    )
    return {"results": [{"id": r.id, "score": r.score, "payload": r.payload} for r in results]}
