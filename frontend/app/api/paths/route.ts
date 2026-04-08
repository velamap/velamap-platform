import { NextResponse } from 'next/server'

const API_BASE = process.env.INTERNAL_API_URL ?? 'http://backend:8000'

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/api/paths`, { next: { revalidate: 60 } } as RequestInit)
    if (!res.ok) return NextResponse.json({ error: 'not found' }, { status: res.status })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  }
}
