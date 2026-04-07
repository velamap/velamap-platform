#!/usr/bin/env python3
"""
概念数据管理脚本

用法：
  python3 db/seed.py list                        # 列出所有概念
  python3 db/seed.py add-category                # 交互式添加一级分类
  python3 db/seed.py add-concept                 # 交互式添加概念（含 MDX 内容）
  python3 db/seed.py add-content <slug>          # 为已有概念补充/更新 MDX 内容
  python3 db/seed.py from-json data.json         # 从 JSON 批量导入概念（含 MDX 内容）

内容加载优先级（前端）：
  1. GitHub 知识库：nodes/{slug}/content/{lang}/index.md
  2. 本地 MDX fallback：frontend/content/{slug}/{lens}.mdx  ← 本脚本写入此处

所有 lens：conceptual / mechanical / practical / comparative / evolutionary / critical
"""

import os
import sys
import json
import textwrap
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

# 本地 MDX 内容目录（相对于项目根目录）
CONTENT_DIR = Path(__file__).parent.parent / "frontend" / "content"


def get_conn():
    return psycopg2.connect(**DB_CONFIG)


# ── 写入本地 MDX 文件 ─────────────────────────────────────────
def write_mdx(slug: str, lens: str, title: str, body: str):
    """写入 frontend/content/{slug}/{lens}.mdx"""
    target_dir = CONTENT_DIR / slug
    target_dir.mkdir(parents=True, exist_ok=True)
    filepath = target_dir / f"{lens}.mdx"
    content = f"---\ntitle: {title}\n---\n\n{body.strip()}\n"
    filepath.write_text(content, encoding="utf-8")
    print(f"  ✓ 写入 {filepath.relative_to(CONTENT_DIR.parent.parent)}")


def prompt_mdx_content(slug: str, zh_name: str, en_name: str):
    """交互式为每个 lens 输入 MDX 内容"""
    print(f"\n── 为 [{slug}] 输入 Lens 内容 ──")
    print("  每个 lens 输入正文（Markdown 格式）。")
    print("  直接回车跳过该 lens（跳过的不会创建文件）。")
    print("  输入多行内容时，以单独一行 '---END---' 结束。\n")

    for lens in LENSES:
        print(f"[{lens}] 标题（默认：{zh_name} · {lens}）：", end="")
        title = input().strip() or f"{zh_name} · {lens}"

        print(f"[{lens}] 正文（回车跳过，多行以 ---END--- 结束）：")
        lines = []
        while True:
            line = input()
            if line == "---END---":
                break
            if line == "" and not lines:
                # 第一行就回车 = 跳过
                break
            lines.append(line)

        if lines:
            write_mdx(slug, lens, title, "\n".join(lines))
        else:
            print(f"  - 跳过 {lens}")


# ── 列出所有概念 ──────────────────────────────────────────────
def cmd_list():
    with get_conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT c.slug, c.zh_name, c.en_name, n.slug as category
            FROM concepts c
            JOIN nav_categories n ON c.category_id = n.id
            ORDER BY n.sort_order, c.sort_order
        """)
        rows = cur.fetchall()

    print(f"\n{'slug':<25} {'zh_name':<20} {'en_name':<25} {'category'}")
    print("-" * 80)
    for r in rows:
        # 检查本地 MDX 是否存在
        local_lenses = [l for l in LENSES if (CONTENT_DIR / r['slug'] / f"{l}.mdx").exists()]
        mdx_status = f"[local: {','.join(local_lenses)}]" if local_lenses else "[no local MDX]"
        print(f"{r['slug']:<25} {r['zh_name']:<20} {r['en_name']:<25} {r['category']}  {mdx_status}")
    print(f"\n共 {len(rows)} 条概念\n")


# ── 交互式添加分类 ────────────────────────────────────────────
def cmd_add_category():
    print("\n── 添加一级导航分类 ──")
    slug     = input("slug (英文, 如 security): ").strip()
    zh_label = input("中文名称: ").strip()
    en_label = input("英文名称: ").strip()
    icon     = input("图标 (lucide 名称, 如 Shield): ").strip() or "BookOpen"

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("""
            INSERT INTO nav_categories (slug, zh_label, en_label, icon, sort_order)
            VALUES (%s, %s, %s, %s, (SELECT COALESCE(MAX(sort_order),0)+1 FROM nav_categories))
            ON CONFLICT (slug) DO UPDATE SET zh_label=EXCLUDED.zh_label, en_label=EXCLUDED.en_label, icon=EXCLUDED.icon
            RETURNING id
        """, (slug, zh_label, en_label, icon))
        conn.commit()
    print(f"✓ 分类 [{slug}] 已添加/更新\n")


# ── 交互式添加概念 ────────────────────────────────────────────
def cmd_add_concept():
    print("\n── 添加概念 ──")
    with get_conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT id, slug, zh_label FROM nav_categories ORDER BY sort_order")
        cats = cur.fetchall()

    print("可用分类：")
    for c in cats:
        print(f"  {c['id']}. {c['slug']} ({c['zh_label']})")

    cat_id  = int(input("选择分类 ID: ").strip())
    slug    = input("slug (英文, 如 fine-tuning): ").strip()
    zh_name = input("中文名称: ").strip()
    en_name = input("英文名称: ").strip()
    icon    = input("图标 (lucide 名称, 默认 BookOpen): ").strip() or "BookOpen"
    zh_desc = input("中文描述: ").strip()
    en_desc = input("英文描述: ").strip()

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("""
            INSERT INTO concepts (slug, category_id, zh_name, en_name, icon, zh_desc, en_desc, sort_order)
            VALUES (%s, %s, %s, %s, %s, %s, %s,
                    (SELECT COALESCE(MAX(sort_order),0)+1 FROM concepts WHERE category_id=%s))
            ON CONFLICT (slug) DO UPDATE SET
                zh_name=EXCLUDED.zh_name, en_name=EXCLUDED.en_name,
                icon=EXCLUDED.icon, zh_desc=EXCLUDED.zh_desc, en_desc=EXCLUDED.en_desc
            RETURNING id
        """, (slug, cat_id, zh_name, en_name, icon, zh_desc, en_desc, cat_id))
        conn.commit()
    print(f"✓ 概念 [{slug}] 已入库\n")

    add_content = input("是否现在添加 MDX 内容？(y/N): ").strip().lower()
    if add_content == "y":
        prompt_mdx_content(slug, zh_name, en_name)

    print(f"\n完成。前端内容加载优先级：")
    print(f"  1. GitHub: nodes/{slug}/content/zh/index.md")
    print(f"  2. 本地:   frontend/content/{slug}/{{lens}}.mdx  ← 刚才写入的位置\n")


# ── 为已有概念补充/更新 MDX 内容 ─────────────────────────────
def cmd_add_content(slug: str):
    with get_conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT zh_name, en_name FROM concepts WHERE slug = %s", (slug,))
        row = cur.fetchone()

    if not row:
        print(f"✗ 概念 [{slug}] 不存在，请先用 add-concept 添加\n")
        sys.exit(1)

    print(f"\n概念：{row['zh_name']} / {row['en_name']}")

    # 显示已有 lens
    existing = [l for l in LENSES if (CONTENT_DIR / slug / f"{l}.mdx").exists()]
    if existing:
        print(f"已有本地 MDX：{', '.join(existing)}")
    else:
        print("暂无本地 MDX 文件")

    print(f"\n选择要编辑的 lens（逗号分隔，all = 全部，回车取消）：")
    print(f"  可选：{', '.join(LENSES)}")
    choice = input("> ").strip().lower()

    if not choice:
        print("取消\n")
        return

    selected = LENSES if choice == "all" else [l.strip() for l in choice.split(",") if l.strip() in LENSES]

    for lens in selected:
        existing_file = CONTENT_DIR / slug / f"{lens}.mdx"
        default_title = f"{row['zh_name']} · {lens}"

        if existing_file.exists():
            print(f"\n[{lens}] 已有内容，覆盖？(y/N): ", end="")
            if input().strip().lower() != "y":
                continue

        print(f"[{lens}] 标题（默认：{default_title}）：", end="")
        title = input().strip() or default_title

        print(f"[{lens}] 正文（多行以 ---END--- 结束）：")
        lines = []
        while True:
            line = input()
            if line == "---END---":
                break
            lines.append(line)

        if lines:
            write_mdx(slug, lens, title, "\n".join(lines))


# ── 从 JSON 批量导入 ──────────────────────────────────────────
def cmd_from_json(filepath: str):
    """
    JSON 格式示例见 db/seed_example.json
    支持在 topics 中内嵌 mdx_content 字段：
    {
      "slug": "fine-tuning",
      "zh_name": "微调",
      ...
      "mdx_content": {
        "conceptual": { "title": "微调概念", "body": "## 什么是微调\\n..." },
        "mechanical":  { "title": "微调机制", "body": "## 训练流程\\n..." }
      }
    }
    """
    with open(filepath, encoding="utf-8") as f:
        data = json.load(f)

    with get_conn() as conn, conn.cursor() as cur:
        for cat in data.get("categories", []):
            cur.execute("""
                INSERT INTO nav_categories (slug, zh_label, en_label, icon, sort_order)
                VALUES (%s, %s, %s, %s, (SELECT COALESCE(MAX(sort_order),0)+1 FROM nav_categories))
                ON CONFLICT (slug) DO UPDATE SET
                    zh_label=EXCLUDED.zh_label, en_label=EXCLUDED.en_label, icon=EXCLUDED.icon
                RETURNING id
            """, (cat["slug"], cat["zh_label"], cat["en_label"], cat.get("icon", "BookOpen")))
            cat_id = cur.fetchone()[0]

            for t in cat.get("topics", []):
                cur.execute("""
                    INSERT INTO concepts (slug, category_id, zh_name, en_name, icon, zh_desc, en_desc, sort_order)
                    VALUES (%s, %s, %s, %s, %s, %s, %s,
                            (SELECT COALESCE(MAX(sort_order),0)+1 FROM concepts WHERE category_id=%s))
                    ON CONFLICT (slug) DO UPDATE SET
                        zh_name=EXCLUDED.zh_name, en_name=EXCLUDED.en_name,
                        icon=EXCLUDED.icon, zh_desc=EXCLUDED.zh_desc, en_desc=EXCLUDED.en_desc
                """, (t["slug"], cat_id, t["zh_name"], t["en_name"],
                      t.get("icon", "BookOpen"), t.get("zh_desc", ""), t.get("en_desc", ""), cat_id))

                # 写入 MDX 内容（如果 JSON 中有）
                for lens, content in t.get("mdx_content", {}).items():
                    if lens in LENSES and content.get("body"):
                        write_mdx(t["slug"], lens, content.get("title", f"{t['zh_name']} · {lens}"), content["body"])

        conn.commit()
    print(f"\n✓ 从 {filepath} 导入完成\n")


# ── 入口 ──────────────────────────────────────────────────────
if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "list"

    if cmd == "list":
        cmd_list()
    elif cmd == "add-category":
        cmd_add_category()
    elif cmd == "add-concept":
        cmd_add_concept()
    elif cmd == "add-content":
        if len(sys.argv) < 3:
            print("用法: python3 db/seed.py add-content <slug>")
            sys.exit(1)
        cmd_add_content(sys.argv[2])
    elif cmd == "from-json":
        if len(sys.argv) < 3:
            print("用法: python3 db/seed.py from-json <file.json>")
            sys.exit(1)
        cmd_from_json(sys.argv[2])
    else:
        print(__doc__)
