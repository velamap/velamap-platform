import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '帆迹 · 探索AI世界',
  description: '',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700;900&family=Outfit:wght@300;400;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
