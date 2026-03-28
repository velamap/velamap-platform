'use client'

import SharedDocView from './SharedDocView'
import LangDropdown from './LangDropdown'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useDrag } from '@use-gesture/react'
import { useSpring, animated } from '@react-spring/web'
import {
  Telescope, LayoutGrid, Bot, Cpu, Server, LogIn, LogOut,
  X, Minus, Maximize2, Sun, Moon, Languages, Monitor, Globe,
  Settings
} from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import Image from 'next/image'
import { useApp } from '@/lib/appContext'

/* ─────────────────────────────────────
   Types
───────────────────────────────────── */
interface AppWindow {
  id: string; title: string; content: React.ReactNode
  x: number; y: number; w: number; h: number; z: number; minimized: boolean
}
interface DesktopIcon {
  id: string; label: string; icon: React.ReactNode
  color: string; content: React.ReactNode; defaultW: number; defaultH: number
}

let globalZ = 100

/* ─────────────────────────────────────
   Window Frame
───────────────────────────────────── */
function AppWindowFrame({ win, onClose, onFocus, onMinimize, onResize }: {
  win: AppWindow; onClose: (id: string) => void
  onFocus: (id: string) => void; onMinimize: (id: string) => void
  onResize: (id: string, x: number, y: number, w: number, h: number) => void
}) {
  // local state owns position + size — never reset by parent re-renders
  const [rect, setRect] = useState({ x: win.x, y: win.y, w: win.w, h: win.h })
  const rectRef = useRef(rect)
  rectRef.current = rect

  const [maximized, setMaximized] = useState(false)

  // drag to move (titlebar)
  const bind = useDrag(({ movement: [mx, my], first, last, event }) => {
    if (maximized) return
    const target = event?.target as HTMLElement
    if (!target?.closest('.win-titlebar')) return
    if (first) onFocus(win.id)
    const base = rectRef.current
    const x = Math.max(0, base.x + mx)
    const y = Math.max(0, base.y + my)
    setRect(r => ({ ...r, x, y }))
    if (last) onResize(win.id, x, y, base.w, base.h)
  }, { filterTaps: true })

  // resize from a given edge/corner
  function makeResizeBind(edges: { left?: boolean; right?: boolean; top?: boolean; bottom?: boolean }) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useDrag(({ movement: [mx, my], first, memo, last, event }) => {
      if (maximized) return
      event?.stopPropagation()
      if (first) { onFocus(win.id); return rectRef.current }
      const base = memo as typeof rect
      const MIN_W = 280, MIN_H = 180

      let { x, y, w, h } = base
      if (edges.right) w = Math.max(MIN_W, base.w + mx)
      if (edges.bottom) h = Math.max(MIN_H, base.h + my)
      if (edges.left) {
        const dw = Math.min(mx, base.w - MIN_W)
        w = base.w - dw; x = base.x + dw
      }
      if (edges.top) {
        const dh = Math.min(my, base.h - MIN_H)
        h = base.h - dh; y = base.y + dh
      }

      setRect({ x, y, w, h })
      if (last) onResize(win.id, x, y, w, h)
      return base
    }, { filterTaps: true })
  }

  const bindE = makeResizeBind({ right: true })
  const bindW = makeResizeBind({ left: true })
  const bindS = makeResizeBind({ bottom: true })
  const bindN = makeResizeBind({ top: true })
  const bindSE = makeResizeBind({ right: true, bottom: true })
  const bindSW = makeResizeBind({ left: true, bottom: true })
  const bindNE = makeResizeBind({ right: true, top: true })
  const bindNW = makeResizeBind({ left: true, top: true })

  function handleTitlebarDblClick(e: React.MouseEvent) {
    if (!(e.target as HTMLElement).closest('.win-controls')) setMaximized(m => !m)
  }

  const NAV_H = 48
  const HANDLE = 6
  const CORNER = 14

  if (win.minimized) return null
  return (
    <div
      {...bind()}
      onMouseDown={() => onFocus(win.id)}
      className={`app-window ${maximized ? 'maximized' : ''}`}
      style={maximized
        ? { position: 'fixed', top: NAV_H, left: 0, width: '100vw', height: `calc(100vh - ${NAV_H}px)`, zIndex: win.z, touchAction: 'none' }
        : { position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h, zIndex: win.z, touchAction: 'none' }
      }
    >
      {!maximized && <>
        <div {...bindE()} style={{ position: 'absolute', right: 0, top: CORNER, bottom: CORNER, width: HANDLE, cursor: 'ew-resize', zIndex: 10 }} />
        <div {...bindW()} style={{ position: 'absolute', left: 0, top: CORNER, bottom: CORNER, width: HANDLE, cursor: 'ew-resize', zIndex: 10 }} />
        <div {...bindS()} style={{ position: 'absolute', bottom: 0, left: CORNER, right: CORNER, height: HANDLE, cursor: 'ns-resize', zIndex: 10 }} />
        <div {...bindN()} style={{ position: 'absolute', top: 0, left: CORNER, right: CORNER, height: HANDLE, cursor: 'ns-resize', zIndex: 10 }} />
        <div {...bindSE()} style={{ position: 'absolute', right: 0, bottom: 0, width: CORNER, height: CORNER, cursor: 'nwse-resize', zIndex: 11 }} />
        <div {...bindSW()} style={{ position: 'absolute', left: 0, bottom: 0, width: CORNER, height: CORNER, cursor: 'nesw-resize', zIndex: 11 }} />
        <div {...bindNE()} style={{ position: 'absolute', right: 0, top: 0, width: CORNER, height: CORNER, cursor: 'nesw-resize', zIndex: 11 }} />
        <div {...bindNW()} style={{ position: 'absolute', left: 0, top: 0, width: CORNER, height: CORNER, cursor: 'nwse-resize', zIndex: 11 }} />
      </>}
      <div className="win-titlebar" onDoubleClick={handleTitlebarDblClick}>
        <div className="win-controls">
          <button className="win-btn win-close" onClick={() => onClose(win.id)}><X size={8} /></button>
          <button className="win-btn win-minimize" onClick={() => onMinimize(win.id)}><Minus size={8} /></button>
          <button className="win-btn win-maximize" onClick={() => setMaximized(m => !m)}><Maximize2 size={8} /></button>
        </div>
        <div className="win-title">{win.title}</div>
      </div>
      <div className="win-body">{win.content}</div>
    </div>
  )
}

/* ─────────────────────────────────────
   Desktop Icon (draggable)
───────────────────────────────────── */
function DesktopIconItem({ icon: def, onOpen }: { icon: DesktopIcon; onOpen: (def: DesktopIcon) => void }) {
  const [active, setActive] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pos = useRef({ x: 0, y: 0 })
  const [spring, api] = useSpring(() => ({ x: 0, y: 0, scale: 1, config: { tension: 300, friction: 26 } }))

  const bind = useDrag(({ movement: [mx, my], last, active: dragging }) => {
    const x = pos.current.x + mx
    const y = pos.current.y + my
    if (last) pos.current = { x, y }
    api.start({ x, y, scale: dragging ? 1.08 : 1, immediate: !last })
  }, { filterTaps: true })

  function handleClick() {
    if (timerRef.current) {
      clearTimeout(timerRef.current); timerRef.current = null
      onOpen(def); setActive(false)
    } else {
      setActive(true)
      timerRef.current = setTimeout(() => { timerRef.current = null; setActive(false) }, 300)
    }
  }

  return (
    <animated.div
      {...bind()}
      className={`desktop-icon ${active ? 'selected' : ''}`}
      style={{ ...spring, position: 'relative', touchAction: 'none', cursor: 'grab' }}
      onClick={handleClick}
      onDoubleClick={() => onOpen(def)}
    >
      <div className="di-icon" style={{ background: def.color }}>{def.icon}</div>
      <div className="di-label">{def.label}</div>
    </animated.div>
  )
}

/* ─────────────────────────────────────
   Settings Panel (Windows Start-menu style)
───────────────────────────────────── */
function SettingsPanel({ onClose, user }: { onClose: () => void; user?: import('@supabase/supabase-js').User | null }) {
  const { lang, setLang, theme, setTheme, mode, setMode, t } = useApp()

  async function handleSignOut() {
    const { createClient } = await import('@/lib/supabase/client')
    await createClient().auth.signOut()
    window.location.reload()
  }

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const displayName = (user?.user_metadata?.name as string) || user?.email || ''

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <span>{t('系统设置', 'Settings')}</span>
        <button className="settings-close" onClick={onClose}><X size={14} /></button>
      </div>

      <div className="settings-section">{lang === 'zh' ? '语言' : 'Language'}</div>
      <div className="settings-row">
        <button className={`settings-opt ${lang === 'zh' ? 'active' : ''}`} onClick={() => setLang('zh')}>
          简体中文
        </button>
        <button className={`settings-opt ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>
          English
        </button>
      </div>

      <div className="settings-section">{t('外观', 'Appearance')}</div>
      <div className="settings-row">
        <button className={`settings-opt ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>
          <Sun size={13} /> {t('白天', 'Light')}
        </button>
        <button className={`settings-opt ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>
          <Moon size={13} /> {t('夜晚', 'Dark')}
        </button>
      </div>

      <div className="settings-section">{t('视图模式', 'View Mode')}</div>
      <div className="settings-row">
        <button className={`settings-opt ${mode === 'os' ? 'active' : ''}`} onClick={() => setMode('os')}>
          <Monitor size={13} /> OS
        </button>
        <button className={`settings-opt ${mode === 'web' ? 'active' : ''}`} onClick={() => setMode('web')}>
          <Globe size={13} /> Web
        </button>
      </div>

      {user && (
        <>
          <div className="settings-section">{t('账号', 'Account')}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px 4px' }}>
            {avatarUrl
              ? <Image src={avatarUrl} alt="avatar" width={28} height={28} style={{ borderRadius: '50%', flexShrink: 0 }} />
              : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', flexShrink: 0 }}>{displayName[0]?.toUpperCase()}</div>
            }
            <span style={{ fontSize: 12, color: 'var(--ink)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
            <button
              onClick={handleSignOut}
              title={t('退出登录', 'Sign out')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4, display: 'flex', alignItems: 'center' }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

import { TOPICS, type PageId } from './AppShell'


function LoginContent() {
  const { t } = useApp()
  async function handleLogin() {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/auth/callback` } })
  }
  return (
    <div className="wc-login">
      <div className="wc-login-logo">帆迹</div>
      <div className="wc-login-title">{t('开始你的 AI 转型之旅', 'Start Your AI Transformation')}</div>
      <div className="wc-login-sub">{t('每日 5 分钟 · 小组打卡 · 成长档案', 'Daily 5min · Group check-in · Growth profile')}</div>
      <button className="wc-google-btn" onClick={handleLogin}>
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {t('使用 Google 账号登录', 'Sign in with Google')}
      </button>
    </div>
  )
}

/* ─────────────────────────────────────
   Main Desktop
───────────────────────────────────── */
export default function Desktop({ user }: { user?: SupabaseUser | null }) {
  const { lang, theme, setTheme, mode, setMode, t } = useApp()
  const [windows, setWindows] = useState<AppWindow[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)
  const settingsBtnRef = useRef<HTMLDivElement>(null)
  const homeOpenedRef = useRef(false)

  useEffect(() => {
    if (!showSettings) return
    function handleClick(e: MouseEvent) {
      const inPanel = settingsRef.current?.contains(e.target as Node)
      const inBtn = settingsBtnRef.current?.contains(e.target as Node)
      if (!inPanel && !inBtn) setShowSettings(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showSettings])

  async function handleLogin() {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/auth/callback` } })
  }

  const ICONS: DesktopIcon[] = [
    { id: 'frontier', label: t('前沿探索', 'Frontier'), icon: <Telescope size={22} color="#fff" />, color: '#1a1a2e', content: <SharedDocView pageId="frontier" inOS={true} />, defaultW: 900, defaultH: 600 },
    { id: 'applications', label: t('应用落地', 'Applications'), icon: <LayoutGrid size={22} color="#fff" />, color: '#5b4fcf', content: <SharedDocView pageId="applications" inOS={true} />, defaultW: 900, defaultH: 600 },
    { id: 'execution', label: t('执行层', 'Execution'), icon: <Cpu size={22} color="#fff" />, color: '#d4890a', content: <SharedDocView pageId="execution" inOS={true} />, defaultW: 900, defaultH: 600 },
    { id: 'agents', label: t('智能体', 'Agents'), icon: <Bot size={22} color="#fff" />, color: '#048a81', content: <SharedDocView pageId="agents" inOS={true} />, defaultW: 900, defaultH: 600 },
    { id: 'ai-infra', label: t('AI基础设施', 'AI Infra'), icon: <Server size={22} color="#fff" />, color: '#00a8cc', content: <SharedDocView pageId="ai-infra" inOS={true} />, defaultW: 900, defaultH: 600 },
    ...(!user ? [{ id: 'login', label: t('登录', 'Login'), icon: <LogIn size={22} color="#fff" />, color: '#1a1a2e', content: <LoginContent />, defaultW: 360, defaultH: 320 }] : []),
  ]

  const openWindow = useCallback((def: DesktopIcon) => {
    setWindows(prev => {
      const existing = prev.find(w => w.id === def.id)
      if (existing) {
        globalZ += 1
        return prev.map(w => w.id === def.id ? { ...w, z: globalZ, minimized: false } : w)
      }
      globalZ += 1
      const offset = prev.filter(w => !w.minimized).length * 28
      return [...prev, { id: def.id, title: def.label, content: def.content, x: 120 + offset, y: 60 + offset, w: def.defaultW, h: def.defaultH, z: globalZ, minimized: false }]
    })
  }, [])

  // Auto-open frontier on mount
  useEffect(() => {
    if (homeOpenedRef.current) return
    homeOpenedRef.current = true
    const frontierDef = ICONS.find(i => i.id === 'frontier')!
    openWindow(frontierDef)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const closeWindow = useCallback((id: string) => setWindows(prev => prev.filter(w => w.id !== id)), [])
  const focusWindow = useCallback((id: string) => { globalZ += 1; setWindows(prev => prev.map(w => w.id === id ? { ...w, z: globalZ } : w)) }, [])
  const minimizeWindow = useCallback((id: string) => setWindows(prev => prev.map(w => w.id === id ? { ...w, minimized: true } : w)), [])
  const resizeWindow = useCallback((id: string, x: number, y: number, w: number, h: number) => {
    setWindows(prev => prev.map(win => win.id === id ? { ...win, x, y, w, h } : win))
  }, [])

  return (
    <div className="desktop">
      <div className="desktop-grid" />

      {/* Nav */}
      <nav className="desktop-nav">
        <div className={`desktop-logo ${lang === 'en' ? 'en' : ''}`}>
          {lang === 'zh' ? '帆迹' : 'Vela AI'}
        </div>
        <div className="nav-right-controls">
          {!user && (
            <button className="nav-login-btn" onClick={handleLogin}>
              <LogIn size={13} /> {t('立即开始', 'Get Started')}
            </button>
          )}
          <button className="nav-icon-btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} title={t('切换主题', 'Toggle theme')}>
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <LangDropdown />
        </div>
      </nav>

      {/* Icons grid — left side, excludes login (moved to nav) */}
      <div className="desktop-icons">
        {ICONS.filter(i => i.id !== 'login').map(icon => (
          <DesktopIconItem key={icon.id} icon={icon} onOpen={openWindow} />
        ))}
      </div>

      {/* Settings button — fixed bottom-left, Windows style */}
      <div className="desktop-settings-btn" ref={settingsBtnRef}>
        <div className={`desktop-icon ${showSettings ? 'selected' : ''}`} onClick={() => setShowSettings(s => !s)}>
          <div className="di-icon" style={{ background: '#555' }}><Settings size={22} color="#fff" /></div>
          <div className="di-label">{t('设置', 'Settings')}</div>
        </div>
      </div>

      {/* Settings panel — at root level, always on top */}
      {showSettings && (
        <div ref={settingsRef} style={{ position: 'fixed', bottom: 100, left: 16, zIndex: 99999 }}>
          <SettingsPanel onClose={() => setShowSettings(false)} user={user} />
        </div>
      )}

      {/* Windows */}
      {windows.map(win => (
        <AppWindowFrame key={win.id} win={win} onClose={closeWindow} onFocus={focusWindow} onMinimize={minimizeWindow} onResize={resizeWindow} />
      ))}

      {/* Taskbar */}
      {windows.some(w => w.minimized) && (
        <div className="taskbar">
          {windows.filter(w => w.minimized).map(w => (
            <button key={w.id} className="taskbar-item" onClick={() => { focusWindow(w.id); setWindows(prev => prev.map(x => x.id === w.id ? { ...x, minimized: false } : x)) }}>
              {w.title}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
