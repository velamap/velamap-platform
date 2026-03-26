import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '帆布AI | AI Knowledge OS',
  description: '帮助职场人系统化地将 AI 工具融入日常工作流',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  )
}
