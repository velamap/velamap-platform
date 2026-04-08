import { NextResponse } from 'next/server'

const API_BASE = process.env.INTERNAL_API_URL ?? 'http://backend:8000'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const target = searchParams.get('target') ?? ''
    const type   = searchParams.get('type')   ?? 'learning'
    const res = await fetch(`${API_BASE}/api/auto-path?target=${target}&type=${type}`)
    if (!res.ok) return NextResponse.json({ error: 'not found' }, { status: res.status })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  }
}
