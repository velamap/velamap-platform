import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { serialize } from 'next-mdx-remote/serialize';

const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/velamap/velamap-knowledge-base/main/nodes';

/**
 * GET /api/content?topic=rag&lens=conceptual&lang=zh
 *
 * Priority:
 *  1. GitHub knowledge-base: nodes/{topic}/content/{lang}/index.md
 *     (all lenses map to the same markdown file at this stage)
 *  2. Local MDX fallback: content/{topic}/{lens}.mdx
 *     (used for custom React-component pages like RagConceptual)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic');
  const lens  = searchParams.get('lens');
  const lang  = searchParams.get('lang') ?? 'en';   // 'zh' | 'en'

  if (!topic || !lens) {
    return NextResponse.json({ error: 'Missing topic or lens' }, { status: 400 });
  }

  // ── 1. Try GitHub knowledge-base ─────────────────────────────────────────
  const ghUrl = `${GITHUB_RAW_BASE}/${topic}/content/${lang}/index.md`;
  try {
    const res = await fetch(ghUrl, {
      next: { revalidate: 60 },          // ISR-style cache: refresh every 60 s
    });

    if (res.ok) {
      const markdown = await res.text();
      const mdxSource = await serialize(markdown, { parseFrontmatter: true });
      return NextResponse.json({ source: mdxSource, origin: 'github' });
    }
  } catch (_) {
    // network error — fall through to local
  }

  // ── 2. Local MDX fallback ─────────────────────────────────────────────────
  const localPath = path.join(process.cwd(), 'content', topic, `${lens}.mdx`);
  try {
    const fileContent = fs.readFileSync(localPath, 'utf8');
    const mdxSource = await serialize(fileContent, { parseFrontmatter: true });
    return NextResponse.json({ source: mdxSource, origin: 'local' });
  } catch (_) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 });
  }
}

