'use client'

import { AppProvider, useApp } from '@/lib/appContext'
import Desktop from './Desktop'
import AppShell from './AppShell'

function Inner() {
  const { mode } = useApp()
  if (mode === 'web') return <AppShell />
  return <Desktop />
}

export default function PageClient() {
  return (
    <AppProvider defaultMode="web">
      <Inner />
    </AppProvider>
  )
}
