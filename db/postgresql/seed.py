#!/usr/bin/env python3
"""
概念数据管理脚本

用法：
  python3 db/postgresql/seed.py list
  python3 db/postgresql/seed.py add-category
  python3 db/postgresql/seed.py add-concept
  python3 db/postgresql/seed.py add-content <slug>
  python3 db/postgresql/seed.py from-json data.json
"""

import os, sys, json
import psycopg2
from psycopg2.extras import RealDictCursor
from pathlib import Path

DB_CONFIG = {
    "host":     os.getenv("POSTGRES_HOST", "localhost"),
    "port":     int(os.getenv("POSTGRES_PORT", "5432")),
    "dbname":   os.getenv("POSTGRES_DB",   "velamap"),
    "user":     os.getenv("POSTGRES_USER", "vela_user"),
    "password": os.getenv("POSTGRES_PASSWORD", "vela_secure_pass"),
}

LENSES = ["conceptual", "mechanical", "practical", "comparative", "evolutionary", "critical"]
CONTENT_DIR = Path(__file__).parent.parent.parent / "frontend" / "content"


def get_conn():
    return psycopg2.connect(**DB_CONFIG)


def write_mdx(slug: str, lens: str, title: str, body: str):
    target = CONTENT_DIR / slug
    target.mkdir(parents=True, exist_ok=True)
    filepath = target / f"{lens}.mdx"
    filepath.write_text(f"---\ntitle: {title}\n---\n\n{body.strip()}\n", encoding="utf-8")
    print(f"  ✓ {filepath.relative_to(CONTENT_DIR.parent.parent)}")


def cmd_list():
    with get_conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT c.slug, c.zh_name, c.en_name, n.slug as category
            FROM concepts c JOIN nav_categories n ON c.category_id = n.id
            ORDER BY n.sort_order, c.sort_order
        """)
        rows = cur.fetchall()
    print(f"\n{'slug':<25} {'zh_name':<20} {'en_name':<25} category")
    print("-" * 80)
    for r in rows:
        local = [l for l in LENSES if (CONTENT_DIR / r['slug'] / f"{l}.mdx").exists()]
        print(f"{r['slug']:<25} {r['zh_name']:<20} {r['en_name']:<25} {r['category']}  {local or '[no local MDX]'}")
    print(f"\n共 {len(rows)} 条\n")


def cmd_add_category():
    slug     = input("slug: ").strip()
    zh_label = input("中文名: ").strip()
    en_label = input("英文名: ").strip()
    icon     = input("图标 (默认 BookOpen): ").strip() or "BookOpen"
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("""
            INSERT INTO nav_categories (slug, zh_label, en_label, icon, sort_order)
            VALUES (%s,%s,%s,%s,(SELECT COALESCE(MAX(sort_order),0)+1 FROM nav_categories))
            ON CONFLICT (slug) DO UPDATE SET zh_label=EXCLUDED.zh_label, en_label=EXCLUDED.en_label, icon=EXCLUDED.icon
        """, (slug, zh_label, en_label, icon))
        conn.commit()
    print(f"✓ [{slug}] 已添加\n")


def cmd_add_concept():
    with get_conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT id, slug, zh_label FROM nav_categories ORDER BY sort_order")
        cats = cur.fetchall()
    for c in cats:
        print(f"  {c['id']}. {c['slug']} ({c['zh_label']})")
    cat_id  = int(input("分类 ID: ").strip())
    slug    = input("slug: ").strip()
    zh_name = input("中文名: ").strip()
    en_name = input("英文名: ").strip()
    icon    = input("图标 (默认 BookOpen): ").strip() or "BookOpen"
    zh_desc = input("中文描述: ").strip()
    en_desc = input("英文描述: ").strip()
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("""
            INSERT INTO concepts (slug, category_id, zh_name, en_name, icon, zh_desc, en_desc, sort_order)
            VALUES (%s,%s,%s,%s,%s,%s,%s,(SELECT COALESCE(MAX(sort_order),0)+1 FROM concepts WHERE category_id=%s))
            ON CONFLICT (slug) DO UPDATE SET zh_name=EXCLUDED.zh_name, en_name=EXCLUDED.en_name,
                icon=EXCLUDED.icon, zh_desc=EXCLUDED.zh_desc, en_desc=EXCLUDED.en_desc
        """, (slug, cat_id, zh_name, en_name, icon, zh_desc, en_desc, cat_id))
        conn.commit()
    print(f"✓ [{slug}] 已入库\n")
    if input("添加 MDX 内容? (y/N): ").strip().lower() == "y":
        _prompt_mdx(slug, zh_name)


def _prompt_mdx(slug: str, zh_name: str):
    for lens in LENSES:
        title = input(f"[{lens}] 标题 (默认 {zh_name}·{lens}): ").strip() or f"{zh_name}·{lens}"
        print(f"[{lens}] 正文 (多行以 ---END--- 结束，直接回车跳过):")
        lines = []
        while True:
            line = input()
            if line == "---END---": break
            if line == "" and not lines: break
            lines.append(line)
        if lines:
            write_mdx(slug, lens, title, "\n".join(lines))


def cmd_add_content(slug: str):
    with get_conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT zh_name FROM concepts WHERE slug=%s", (slug,))
        row = cur.fetchone()
    if not row:
        print(f"✗ [{slug}] 不存在"); sys.exit(1)
    _prompt_mdx(slug, row['zh_name'])


def cmd_from_json(filepath: str):
    with open(filepath, encoding="utf-8") as f:
        data = json.load(f)
    with get_conn() as conn, conn.cursor() as cur:
        for cat in data.get("categories", []):
            cur.execute("""
                INSERT INTO nav_categories (slug, zh_label, en_label, icon, sort_order)
                VALUES (%s,%s,%s,%s,(SELECT COALESCE(MAX(sort_order),0)+1 FROM nav_categories))
                ON CONFLICT (slug) DO UPDATE SET zh_label=EXCLUDED.zh_label, en_label=EXCLUDED.en_label, icon=EXCLUDED.icon
                RETURNING id
            """, (cat["slug"], cat["zh_label"], cat["en_label"], cat.get("icon","BookOpen")))
            cat_id = cur.fetchone()[0]
            for t in cat.get("topics", []):
                cur.execute("""
                    INSERT INTO concepts (slug, category_id, zh_name, en_name, icon, zh_desc, en_desc, sort_order)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,(SELECT COALESCE(MAX(sort_order),0)+1 FROM concepts WHERE category_id=%s))
                    ON CONFLICT (slug) DO UPDATE SET zh_name=EXCLUDED.zh_name, en_name=EXCLUDED.en_name,
                        icon=EXCLUDED.icon, zh_desc=EXCLUDED.zh_desc, en_desc=EXCLUDED.en_desc
                """, (t["slug"], cat_id, t["zh_name"], t["en_name"],
                      t.get("icon","BookOpen"), t.get("zh_desc",""), t.get("en_desc",""), cat_id))
                for lens, c in t.get("mdx_content", {}).items():
                    if lens in LENSES and c.get("body"):
                        write_mdx(t["slug"], lens, c.get("title", f"{t['zh_name']}·{lens}"), c["body"])
        conn.commit()
    print(f"✓ 从 {filepath} 导入完成\n")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "list"
    if cmd == "list":               cmd_list()
    elif cmd == "add-category":     cmd_add_category()
    elif cmd == "add-concept":      cmd_add_concept()
    elif cmd == "add-content":      cmd_add_content(sys.argv[2] if len(sys.argv)>2 else (print("需要 slug") or sys.exit(1)))
    elif cmd == "from-json":        cmd_from_json(sys.argv[2] if len(sys.argv)>2 else (print("需要文件路径") or sys.exit(1)))
    else:                           print(__doc__)
