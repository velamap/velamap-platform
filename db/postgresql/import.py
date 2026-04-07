#!/usr/bin/env python3
"""
Import content directory into PostgreSQL (nodes + content tables).

Usage:
  DATABASE_URL=postgresql://vela_user:pass@localhost/velamap python3 db/postgresql/import.py
"""

import json, os
from pathlib import Path
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ["DATABASE_URL"]
CONTENT_DIR  = Path(__file__).parent.parent / "content"

VALID_TYPES = {"concept", "guide", "playbook", "case", "failure"}

def main():
    engine = create_engine(DATABASE_URL)

    for folder in sorted(CONTENT_DIR.iterdir()):
        if not folder.is_dir():
            continue
        node_file = folder / "node.json"
        if not node_file.exists():
            print(f"[skip] {folder.name} — no node.json")
            continue

        node = json.loads(node_file.read_text())

        with engine.begin() as conn:
            result = conn.execute(
                text("""
                    INSERT INTO nodes (name, slug, layer, sub_layer, description, maturity, certainty, freshness, type)
                    VALUES (:name, :slug, :layer, :sub_layer, :description, :maturity, :certainty, :freshness, :type)
                    ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, layer=EXCLUDED.layer
                    RETURNING id
                """),
                node
            )
            node_id = result.fetchone()[0]
        print(f"[node] {node['name']} → {node_id}")

        for html_file in sorted(folder.glob("*.html")):
            content_type = html_file.stem
            if content_type not in VALID_TYPES:
                print(f"  [skip] {html_file.name}")
                continue
            with engine.begin() as conn:
                conn.execute(
                    text("""
                        INSERT INTO content (node_id, content_type, title, body, source)
                        VALUES (:node_id, :content_type, :title, :body, 'manual')
                        ON CONFLICT (node_id, content_type) DO UPDATE SET body=EXCLUDED.body
                    """),
                    {"node_id": node_id, "content_type": content_type,
                     "title": f"{node['name']} — {content_type}", "body": html_file.read_text()}
                )
            print(f"  [content] {content_type}")

    print("Done.")

if __name__ == "__main__":
    main()
