#!/usr/bin/env python3
"""
初始化 Qdrant 集合

用法：
  QDRANT_HOST=localhost QDRANT_PORT=6333 python3 db/qdrant/init_collections.py
"""

import os, json
from pathlib import Path
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

DIST_MAP = {"Cosine": Distance.COSINE, "Dot": Distance.DOT, "Euclid": Distance.EUCLID}

def main():
    client = QdrantClient(
        host=os.getenv("QDRANT_HOST", "localhost"),
        port=int(os.getenv("QDRANT_PORT", "6333")),
    )

    config_path = Path(__file__).parent / "collections.json"
    config = json.loads(config_path.read_text())

    for col in config["collections"]:
        client.recreate_collection(
            collection_name=col["name"],
            vectors_config=VectorParams(
                size=col["vector_size"],
                distance=DIST_MAP.get(col["distance"], Distance.COSINE),
            ),
        )
        print(f"✓ collection [{col['name']}] 已创建 (size={col['vector_size']}, distance={col['distance']})")

    print("\n完成。")

if __name__ == "__main__":
    main()
