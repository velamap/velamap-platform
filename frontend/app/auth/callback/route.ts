import { NextResponse } from 'next/server'

// Auth callback 已停用（Supabase 已移除）
export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  return NextResponse.redirect(`${origin}/`)
}
