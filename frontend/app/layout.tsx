import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '帆图 · 探索AI世界',
  description: '',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  )
}
