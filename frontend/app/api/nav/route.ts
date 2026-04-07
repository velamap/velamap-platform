import { NextResponse } from 'next/server'

const API_BASE = process.env.INTERNAL_API_URL ?? 'http://backend:8000'

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/api/nav`, { next: { revalidate: 60 } })
    if (!res.ok) throw new Error(`upstream ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: 'nav unavailable' }, { status: 503 })
  }
}
