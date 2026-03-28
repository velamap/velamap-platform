'use client'

import SharedDocView from './SharedDocView'
import LangDropdown from './LangDropdown'
import { useState, useRef, useEffect, useMemo } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  Telescope, LayoutGrid, Bot, Cpu, Server, LogOut, LogIn, Sun, Moon,
  Monitor, Globe, Languages, PanelLeftClose, PanelLeft, Search,
  ChevronRight, Home, Menu, X, BookOpen, Code, Wrench, BarChart,
  History, AlertTriangle, Bookmark, Database
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { useApp } from '@/lib/appContext'
import type { LensId } from '@/lib/appContext'
import RagConceptual from './RagConceptual'
import { MDXRemote } from 'next-mdx-remote'
import { useKeyboardShortcuts } from '@/lib/useKeyboardShortcuts'

// ------------------------------
// 1 级导航
// ------------------------------
export const NAV_ITEMS = [
  { id: 'frontier', zhLabel: '前沿探索', enLabel: 'Frontier', icon: Telescope },
  { id: 'applications', zhLabel: '应用落地', enLabel: 'Applications', icon: LayoutGrid },
  { id: 'execution', zhLabel: '执行层', enLabel: 'Execution', icon: Cpu },
  { id: 'agents', zhLabel: '智能体', enLabel: 'Agents', icon: Bot },
  { id: 'ai-infra', zhLabel: 'AI基础设施', enLabel: 'AI Infra', icon: Server },
] as const

export type PageId = typeof NAV_ITEMS[number]['id']

// ------------------------------
// 2 级知识点卡片（Azure 风格）
// ------------------------------
export const TOPICS = {
  'ai-infra': [
    { id: 'transformer', zh: 'Transformer', en: 'Transformer', icon: Code, descZh: '神经网络核心架构', descEn: 'Core neural network architecture' },
    { id: 'moe', zh: 'MoE 架构', en: 'MoE Architecture', icon: Bot, descZh: '混合专家稀疏模型', descEn: 'Mixture of Experts sparse model' },
    { id: 'embedding', zh: 'Embedding', en: 'Embedding', icon: Bookmark, descZh: '文本/图像向量表示', descEn: 'Text/image vector representation' },
    { id: 'scaling', zh: 'Scaling Law', en: 'Scaling Law', icon: BarChart, descZh: '模型性能缩放规律', descEn: 'Model performance scaling rules' },
  ],
  'agents': [
    { id: 'react', zh: 'ReAct', en: 'ReAct', icon: Bot, descZh: '推理+行动协同架构', descEn: 'Reasoning + acting architecture' },
    { id: 'planning', zh: '规划系统', en: 'Planning', icon: LayoutGrid, descZh: '多步决策与目标分解', descEn: 'Multi-step planning & decomposition' },
    { id: 'memory', zh: '记忆系统', en: 'Memory', icon: Bookmark, descZh: '长短时记忆管理', descEn: 'Long/short-term memory management' },
  ],
  'applications': [
    { id: 'generate', zh: '内容生成', en: 'Generation', icon: BookOpen, descZh: '文本/图像/音频生成', descEn: 'Text/image/audio generation' },
    { id: 'decision', zh: '决策辅助', en: 'Decision', icon: Bot, descZh: '分析与判断增强', descEn: 'Analysis & decision augmentation' },
  ],
  'execution': [
    { id: 'orchestration', zh: '工作流编排', en: 'Orchestration', icon: LayoutGrid, descZh: 'DAG/状态机执行', descEn: 'DAG / state machine execution' },
    { id: 'observability', zh: '可观测性', en: 'Observability', icon: BarChart, descZh: '监控/追踪/日志', descEn: 'Monitoring / tracing / logging' },
    { id: 'rag', zh: '检索增强生成', en: 'RAG', icon: Database, descZh: '检索外部知识增强生成', descEn: 'Retrieve external knowledge to enhance generation' },
  ],
  'frontier': [
    { id: 'world-model', zh: '世界模型', en: 'World Model', icon: Globe, descZh: '物理与时空建模', descEn: 'Physical & spatiotemporal modeling' },
    { id: 'causal', zh: '因果推理', en: 'Causal Reasoning', icon: Bot, descZh: '反事实与因果推断', descEn: 'Counterfactual & causal inference' },
  ],
}

// ------------------------------
// 3 级 Lens 内容（文档正文）
// ------------------------------

export const LENS_ICONS = {
  conceptual: BookOpen,
  mechanical: Code,
  practical: Wrench,
  comparative: BarChart,
  evolutionary: History,
  critical: AlertTriangle,
}

export const LENS_ZH: Record<LensId, string> = {
  conceptual: '概念',
  mechanical: '机制',
  practical: '实践',
  comparative: '对比',
  evolutionary: '演进',
  critical: '批判',
}

// ------------------------------
// 主组件
// ------------------------------
export default function AppShell({ user }: { user: User | null }) {
  const { theme, setTheme, lang, setLang, mode, setMode, activeLens, setActiveLens } = useApp()
  const [activePage, setActivePage] = useState<PageId>('frontier')
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [search, setSearch] = useState('')
  const [searchTargetTopic, setSearchTargetTopic] = useState<string | null>(null)
  const [searchFocused, setSearchFocused] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useKeyboardShortcuts([
    {
      key: 'k', meta: true,
      description: 'Open search',
      action: () => {
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      }
    },
    // Add more shortcuts here, e.g.:
    // { key: 'Escape', description: 'Clear search', action: () => setSearch('') },
  ])

  const searchResults = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    const results: any[] = []
    NAV_ITEMS.forEach(nav => {
      const topics = TOPICS[nav.id] || []
      topics.forEach(t => {
        if (t.zh.toLowerCase().includes(q) || t.en.toLowerCase().includes(q) || t.descZh.toLowerCase().includes(q) || t.descEn.toLowerCase().includes(q)) {
          results.push({ pageId: nav.id, pageZh: nav.zhLabel, pageEn: nav.enLabel, topic: t })
        }
      })
    })
    return results.slice(0, 6)
  }, [search])

  const [dynamicToc, setDynamicToc] = useState<{ id: string, text: string }[]>([])
  const [mdxSource, setMdxSource] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const userRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()
  const avatarUrl = user?.user_metadata?.avatar_url
  const name = user?.user_metadata.name || user?.email || 'User'

  // 点击外部关闭菜单
  useEffect(() => {
    const cb = (e: MouseEvent) => { if (userRef.current && !userRef.current.contains(e.target as any)) setShowUserMenu(false) }
    document.addEventListener('mousedown', cb)
    return () => document.removeEventListener('mousedown', cb)
  }, [])

  // Fetch MDX Content
  useEffect(() => {
    if (!selectedTopic || !activeLens) return;
    let isMounted = true;
    setIsLoading(true);
    setMdxSource(null);

    fetch(`/api/content?topic=${selectedTopic}&lens=${activeLens}`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data.source) {
          setMdxSource(data.source);
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => { isMounted = false; };
  }, [selectedTopic, activeLens]);

  // 动态提取 TOC
  useEffect(() => {
    const timer = setTimeout(() => {
      const headings = document.querySelectorAll('.doc-main h2')
      const toc = Array.from(headings).map(h => ({
        id: h.id || '',
        text: h.textContent || ''
      })).filter(item => item.text.trim() !== '')
      setDynamicToc(toc)
    }, 100)
    return () => clearTimeout(timer)
  }, [selectedTopic, activeLens])

  const currentTopics = TOPICS[activePage] || []
  const showDetail = !!selectedTopic

  return (
    <div className="app-container">

      {/* ── LEFT SIDEBAR (full height, Gemini style) ── */}
      <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} />
        <div className="sidebar-inner">

          {/* Hamburger + Logo row — aligns with top-bar height */}
          <div className="sidebar-toggle-row">
            <button
              className="nav-icon-btn sidebar-toggle-btn"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? (lang === 'zh' ? '展开' : 'Expand') : (lang === 'zh' ? '收起' : 'Collapse')}
            >
              <Menu size={20} />
            </button>
          </div>

          {/* Nav links */}

          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => { setActivePage(item.id); setSearchTargetTopic(null); setMobileSidebarOpen(false) }}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                {!collapsed && <span>{lang === 'zh' ? item.zhLabel : item.enLabel}</span>}
              </button>
            )
          })}

          {/* User footer */}
          <div className="sidebar-footer" ref={userRef}>
            {user ? (
              <div className="user-row" onClick={() => setShowUserMenu(!showUserMenu)}>
                {avatarUrl ? <Image src={avatarUrl} width={28} height={28} className="avatar" alt="" /> : <div className="avatar">{name[0]}</div>}
                {!collapsed && <span className="name">{name}</span>}
              </div>
            ) : (
              <button className="signin" onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}>
                <LogIn size={14} />{!collapsed && (lang === 'zh' ? '登录' : 'Sign in')}
              </button>
            )}
            {showUserMenu && (
              <div className="user-menu">
                <div className="user-menu-label">{lang === 'zh' ? '视图模式' : 'View Mode'}</div>
                <div className="user-menu-modes">
                  <button className={`user-menu-mode-btn ${mode === 'os' ? 'active' : ''}`} onClick={() => setMode('os')}>
                    <Monitor size={13} /> OS
                  </button>
                  <button className={`user-menu-mode-btn ${mode === 'web' ? 'active' : ''}`} onClick={() => setMode('web')}>
                    <Globe size={13} /> Web
                  </button>
                </div>
                <button onClick={() => supabase.auth.signOut()}><LogOut size={14} />{lang === 'zh' ? '退出登录' : 'Sign out'}</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT (right of sidebar) ── */}
      <div className="main-content">

        {/* Top bar — scoped to main area, not spanning sidebar */}
        <div className="top-bar">
          <div className="top-bar-left">
            <div className="brand-block">
              <span className="brand-name">{lang === 'zh' ? '帆迹' : 'Vela AI'}</span>
              <span className="brand-slogan">
                {lang === 'zh' ? '探索AI世界' : 'Explore AI World'}
              </span>
            </div>
          </div>

          <div className="top-search-container">
            <div className="top-search-box">
              <Search size={14} className="search-icon" />
              <input
                ref={searchInputRef}
                placeholder={lang === 'zh' ? '搜索知识卡片 (⌘K)' : 'Search cards (⌘K)'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              />
            </div>
            {searchFocused && search.trim() && (
              <div className="search-dropdown">
                <div className="search-dropdown-header">{lang === 'zh' ? '搜索结果' : 'Search Results'}</div>
                {searchResults.length > 0 ? searchResults.map(res => (
                  <div key={res.topic.id} className="search-result-item" onClick={() => {
                    setActivePage(res.pageId)
                    setSearchTargetTopic(res.topic.id)
                    setSearch('')
                  }}>
                    <div className="sr-icon"><res.topic.icon size={16} /></div>
                    <div className="sr-text">
                      <div className="sr-title">{lang === 'zh' ? res.topic.zh : res.topic.en}</div>
                      <div className="sr-path">{lang === 'zh' ? res.pageZh : res.pageEn}</div>
                    </div>
                  </div>
                )) : (
                  <div className="search-empty">{lang === 'zh' ? '没有找到相关内容' : 'No results found'}</div>
                )}
              </div>
            )}
          </div>

          <div className="top-bar-right">
            <button className="nav-icon-btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} title={lang === 'zh' ? '切换主题' : 'Toggle theme'}>
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <LangDropdown />
          </div>
        </div>

        <SharedDocView key={`${activePage}-${searchTargetTopic || 'none'}`} pageId={activePage} initialTopic={searchTargetTopic} />
      </div>

      {/* ── GLOBAL STYLES ── */}
      <style jsx global>{`
        * { box-sizing: border-box; margin:0; padding:0; font-family: 'DM Sans', system-ui, sans-serif; }
        .app-container { display: flex; flex-direction: row; height: 100vh; background: var(--surface); color: var(--ink); overflow: hidden; }

        /* Sidebar */
        .sidebar { width:180px; background: var(--card); border-right:1px solid rgba(0,0,0,0.06); display: flex; flex-direction: column; flex-shrink: 0; transition: width 0.2s; overflow: hidden; }
        .sidebar.collapsed { width:60px; }
        .sidebar-overlay { display: none; position: fixed; inset:0; background: rgba(0,0,0,0.4); z-index:9; }
        .sidebar-inner { height: 100%; display: flex; flex-direction: column; }
        .sidebar-toggle-row { display: flex; align-items: center; height: 60px; padding: 0 14px; flex-shrink: 0; }
        .sidebar-toggle-btn { flex-shrink: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: var(--ink2); }
        .logo-text { font-family: 'Noto Serif SC', serif; font-weight:700; font-size:16px; color: var(--ink); white-space: nowrap; }
        .logo-text.en { font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-weight:800; font-size:18px; }
        .brand-block { display: flex; align-items: center; gap: 10px; white-space: nowrap; height: 100%; border-radius: 4px; }
        .brand-name { font-family: 'Noto Serif SC', serif; font-weight: 900; font-size: 22px; color: #1a1a1a; letter-spacing: 0.05em; text-shadow: 0.5px 0.5px 0px rgba(0,0,0,0.1); }
        .brand-slogan { font-family: 'Outfit', sans-serif; font-size: 11px; color: #8a8a8e; font-weight: 400; text-transform: uppercase; letter-spacing: 0.12em; margin-top: 6px; position: relative; padding-left: 10px; }
        .brand-slogan::before { content: ""; position: absolute; left: 0; top: 15%; height: 70%; width: 1px; background: #d1d1d6; }
        .nav-section { padding:8px 16px; font-size:11px; color: var(--muted); text-transform: uppercase; letter-spacing:0.5px; }
        .nav-item { display: flex; align-items: center; gap:10px; height:40px; padding:0 16px; border-radius:8px; cursor:pointer; background:none; border:none; color: var(--muted); font-size:14px; line-height:1; text-align:left; margin:2px 8px; width: calc(100% - 16px); white-space: nowrap; overflow: hidden; transition: background 0.15s, color 0.15s; }
        .sidebar.collapsed .nav-item { justify-content: center; padding: 0; width: 36px; margin: 2px 12px; }
        .sidebar.collapsed .sidebar-toggle-row { padding: 0 12px; justify-content: center; }
        .sidebar.collapsed .sidebar-toggle-btn { margin: 0; }
        .nav-item:hover { background: var(--surface); color: var(--ink); }
        .nav-item.active { background: var(--teal-light); color: var(--teal); font-weight:600; }
        .close-mobile { display: none; }
        .sidebar-footer { margin-top: auto; padding:12px; position: relative; }
        .user-row { display: flex; align-items: center; gap:10px; cursor:pointer; padding: 4px; border-radius: 8px; }
        .user-row:hover { background: var(--surface); }
        .avatar { width:28px; height:28px; border-radius:8px; background: var(--surface); display: grid; place-items: center; font-weight:600; color: var(--ink); }
        .name { font-size:13px; color: var(--ink2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .user-menu { position: fixed; bottom:70px; left:8px; width:200px; background: var(--card); border:1px solid var(--border2); border-radius:10px; padding:6px 0; box-shadow:0 4px 20px rgba(0,0,0,0.12); z-index: 9999; }
        .user-menu-label { padding:6px 14px 2px; font-size:11px; color: var(--muted); text-transform: uppercase; letter-spacing:0.08em; }
        .user-menu-modes { display: flex; gap:6px; padding:4px 14px 8px; border-bottom:1px solid var(--border); }
        .user-menu-mode-btn { flex:1; display:flex; align-items:center; justify-content:center; gap:5px; padding:6px 0; border-radius:6px; border:1px solid var(--border2); background:none; cursor:pointer; font-size:12px; font-weight:600; color: var(--muted); font-family:inherit; }
        .user-menu-mode-btn.active { border-color: var(--teal); background: var(--teal-light); color: var(--teal); cursor:default; }
        .user-menu button { display: flex; align-items: center; gap:8px; width:100%; padding:8px 14px; background:none; border:none; color: var(--ink); cursor:pointer; font-size:13px; font-family:inherit; }
        .user-menu button:hover { background: var(--surface); }
        .signin { display: flex; align-items: center; gap:8px; width:100%; padding:8px; background:none; border:none; color: var(--muted); cursor:pointer; font-size:14px; font-family:inherit; }

        /* Main content */
        .main-content { flex:1; overflow: hidden; display: flex; flex-direction: column; min-width: 0; }
        .top-bar { height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; background: var(--surface); border-bottom: 1px solid var(--border); flex-shrink: 0; }
        .top-bar-left, .top-bar-right { display: flex; align-items: center; gap: 8px; min-width: 80px; }
        .top-bar-right { justify-content: flex-end; }
        .top-search-container { position: relative; flex: 1; max-width: 480px; display: flex; justify-content: center; }
        .top-search-box { display: flex; align-items: center; gap: 8px; padding: 0 16px; height: 36px; width: 100%; max-width: 400px; background: var(--card); border: 1px solid var(--border); border-radius: 18px; transition: border-color 0.2s, box-shadow 0.2s; }
        .top-search-box:focus-within { border-color: var(--teal); box-shadow: 0 0 0 3px var(--teal-light); }
        .top-search-box .search-icon { color: var(--muted); flex-shrink: 0; }
        .top-search-box input { border: none; background: transparent; outline: none; color: var(--ink); font-size: 14px; width: 100%; }
        .nav-icon-btn { width:32px; height:32px; border-radius:8px; border:none; background:transparent; color: var(--muted); display:flex; align-items:center; justify-content:center; cursor:pointer; transition: all .15s; }
        .nav-icon-btn:hover { background: var(--surface); color: var(--ink); }
        .search-dropdown { position: absolute; top: calc(100% + 8px); left: 50%; transform: translateX(-50%); width: 100%; max-width: 400px; background: var(--card); border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.08); padding: 8px; z-index: 1000; }
        .search-dropdown-header { font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; padding: 8px 12px 4px; }
        .search-result-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 8px; cursor: pointer; transition: background 0.15s; }
        .search-result-item:hover { background: var(--surface); }
        .sr-icon { width: 28px; height: 28px; border-radius: 6px; background: var(--teal-light); color: var(--teal); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .sr-text { flex: 1; overflow: hidden; }
        .sr-title { font-size: 14px; font-weight: 500; color: var(--ink); margin-bottom: 2px; }
        .sr-path { font-size: 11px; color: var(--muted); }
        .search-empty { padding: 24px; text-align: center; font-size: 13px; color: var(--muted); font-style: italic; }

        /* Mobile */
        @media (max-width: 768px) {
          .sidebar { position: fixed; left:0; top:0; bottom:0; transform: translateX(-100%); transition: transform 0.2s; z-index:99; width:180px !important; }
          .sidebar.mobile-open { transform: translateX(0); }
          .sidebar-overlay { display: block; }
          .close-mobile { display: flex; }
        }

        /* Dark theme */
        [data-theme="dark"] .sidebar { background: var(--card); border-right-color: var(--border); }
        [data-theme="dark"] .top-bar { background: var(--surface); border-bottom-color: var(--border); }
        [data-theme="dark"] .top-search-box { background: var(--card); border-color: var(--border); }
        [data-theme="dark"] .user-menu { background: var(--card); border-color: var(--border2); }
        [data-theme="dark"] .nav-item.active { background: rgba(4,138,129,0.2); }
        [data-theme="dark"] .logo-text { color: var(--ink); }
      `}</style>
    </div>
  )
}
