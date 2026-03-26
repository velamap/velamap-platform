'use client'

import type { User } from '@supabase/supabase-js'
import { AppProvider, useApp } from '@/lib/appContext'
import Desktop from './Desktop'
import AppShell from './AppShell'

function Inner({ user }: { user: User | null }) {
  const { mode } = useApp()

  if (mode === 'web') return <AppShell user={user} />
  return <Desktop user={user} />
}

export default function PageClient({ user }: { user: User | null }) {
  return (
    <AppProvider defaultMode="os">
      <Inner user={user} />
    </AppProvider>
  )
}
