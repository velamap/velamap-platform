'use client'

import SharedDocView from './SharedDocView'
import LangDropdown from './LangDropdown'
import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Telescope, LayoutGrid, Bot, Cpu, Server, Sun, Moon,
  Globe, Search, Menu, BookOpen, Code, Wrench, BarChart,
  History, AlertTriangle, Bookmark, Database, type LucideIcon
} from 'lucide-react'
import { useApp } from '@/lib/appContext'
import type { LensId } from '@/lib/appContext'
import { useKeyboardShortcuts } from '@/lib/useKeyboardShortcuts'

// ── Icon 映射（后端存字符串，前端映射到组件）──────────────────
const ICON_MAP: Record<string, LucideIcon> = {
  Telescope, LayoutGrid, Bot, Cpu, Server, BookOpen, Code,
  Wrench, BarChart, History, AlertTriangle, Bookmark, Database, Globe,
}
export function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? BookOpen
}

// ── 类型 ──────────────────────────────────────────────────────
export type PageId = string

export interface NavTopic {
  id: string
  zh: string
  en: string
  icon: string
  descZh: string
  descEn: string
}

export interface NavCategory {
  id: string
  zhLabel: string
  enLabel: string
  icon: string
  topics: NavTopic[]
}

// ── Lens（固定，不从后端取）───────────────────────────────────
export const LENS_ICONS: Record<LensId, LucideIcon> = {
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

// ── 主组件 ────────────────────────────────────────────────────
export default function AppShell() {
  const { theme, setTheme, lang } = useApp()
  const [navData, setNavData] = useState<NavCategory[]>([])
  const [activePage, setActivePage] = useState<string>('')
  const [searchTargetTopic, setSearchTargetTopic] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 加载导航数据
  useEffect(() => {
    fetch('/api/nav')
      .then(r => r.json())
      .then(data => {
        if (data.categories?.length) {
          setNavData(data.categories)
          setActivePage(data.categories[0].id)
        }
      })
      .catch(() => { })
  }, [])

  useKeyboardShortcuts([{
    key: 'k', meta: true,
    description: 'Open search',
    action: () => { searchInputRef.current?.focus(); searchInputRef.current?.select() }
  }])

  const searchResults = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    const results: { pageId: string; pageZh: string; pageEn: string; topic: NavTopic }[] = []
    navData.forEach(cat => {
      cat.topics.forEach(t => {
        if (
          t.zh.toLowerCase().includes(q) || t.en.toLowerCase().includes(q) ||
          t.descZh.toLowerCase().includes(q) || t.descEn.toLowerCase().includes(q)
        ) {
          results.push({ pageId: cat.id, pageZh: cat.zhLabel, pageEn: cat.enLabel, topic: t })
        }
      })
    })
    return results.slice(0, 6)
  }, [search, navData])

  const activeCategory = navData.find(c => c.id === activePage)

  return (
    <div className="app-container">

      {/* ── LEFT SIDEBAR ── */}
      <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} />
        <div className="sidebar-inner">
          <div className="sidebar-toggle-row">
            <button
              className="nav-icon-btn sidebar-toggle-btn"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? (lang === 'zh' ? '展开' : 'Expand') : (lang === 'zh' ? '收起' : 'Collapse')}
            >
              <Menu size={20} />
            </button>
          </div>

          {navData.map(cat => {
            const Icon = getIcon(cat.icon)
            return (
              <button
                key={cat.id}
                className={`nav-item ${activePage === cat.id ? 'active' : ''}`}
                onClick={() => { setActivePage(cat.id); setSearchTargetTopic(null); setMobileSidebarOpen(false) }}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                {!collapsed && <span>{lang === 'zh' ? cat.zhLabel : cat.enLabel}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="main-content">
        <div className="top-bar">
          <div className="top-bar-left">
            <div className="brand-block">
              <span className="brand-name">{lang === 'zh' ? '有帆' : 'Vela AI'}</span>
              <span className="brand-slogan">{lang === 'zh' ? '探索AI世界' : 'Explore AI World'}</span>
            </div>
          </div>

          <div className="top-search-container">
            <div className="top-search-box">
              <Search size={14} className="search-icon" />
              <input
                ref={searchInputRef}
                placeholder={lang === 'zh' ? '搜索知识卡片 (⌘K)' : 'Search cards (⌘K)'}
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              />
            </div>
            {searchFocused && search.trim() && (
              <div className="search-dropdown">
                <div className="search-dropdown-header">{lang === 'zh' ? '搜索结果' : 'Search Results'}</div>
                {searchResults.length > 0 ? searchResults.map(res => {
                  const Icon = getIcon(res.topic.icon)
                  return (
                    <div key={res.topic.id} className="search-result-item" onClick={() => {
                      setActivePage(res.pageId); setSearchTargetTopic(res.topic.id); setSearch('')
                    }}>
                      <div className="sr-icon"><Icon size={16} /></div>
                      <div className="sr-text">
                        <div className="sr-title">{lang === 'zh' ? res.topic.zh : res.topic.en}</div>
                        <div className="sr-path">{lang === 'zh' ? res.pageZh : res.pageEn}</div>
                      </div>
                    </div>
                  )
                }) : (
                  <div className="search-empty">{lang === 'zh' ? '没有找到相关内容' : 'No results found'}</div>
                )}
              </div>
            )}
          </div>

          <div className="top-bar-right">
            <button className="nav-icon-btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <LangDropdown />
          </div>
        </div>

        {activeCategory && (
          <SharedDocView
            key={`${activePage}-${searchTargetTopic || 'none'}`}
            pageId={activePage}
            pageLabel={{ zh: activeCategory.zhLabel, en: activeCategory.enLabel }}
            topics={activeCategory.topics}
            initialTopic={searchTargetTopic}
          />
        )}
      </div>

      <style jsx global>{`
        * { box-sizing: border-box; margin:0; padding:0; font-family: 'DM Sans', system-ui, sans-serif; }
        .app-container { display: flex; flex-direction: row; height: 100vh; background: var(--surface); color: var(--ink); overflow: hidden; }
        .sidebar { width:180px; background: var(--card); border-right:1px solid rgba(0,0,0,0.06); display: flex; flex-direction: column; flex-shrink: 0; transition: width 0.2s; overflow: hidden; }
        .sidebar.collapsed { width:60px; }
        .sidebar-overlay { display: none; position: fixed; inset:0; background: rgba(0,0,0,0.4); z-index:9; }
        .sidebar-inner { height: 100%; display: flex; flex-direction: column; }
        .sidebar-toggle-row { display: flex; align-items: center; height: 60px; padding: 0 14px; flex-shrink: 0; }
        .sidebar-toggle-btn { flex-shrink: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: var(--ink2); }
        .nav-item { display: flex; align-items: center; gap:10px; height:40px; padding:0 16px; border-radius:8px; cursor:pointer; background:none; border:none; color: var(--muted); font-size:14px; line-height:1; text-align:left; margin:2px 8px; width: calc(100% - 16px); white-space: nowrap; overflow: hidden; transition: background 0.15s, color 0.15s; }
        .sidebar.collapsed .nav-item { justify-content: center; padding: 0; width: 36px; margin: 2px 12px; }
        .sidebar.collapsed .sidebar-toggle-row { padding: 0 12px; justify-content: center; }
        .nav-item:hover { background: var(--surface); color: var(--ink); }
        .nav-item.active { background: var(--teal-light); color: var(--teal); font-weight:600; }
        .main-content { flex:1; overflow: hidden; display: flex; flex-direction: column; min-width: 0; }
        .top-bar { height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; background: var(--surface); border-bottom: 1px solid var(--border); flex-shrink: 0; }
        .top-bar-left, .top-bar-right { display: flex; align-items: center; gap: 8px; min-width: 80px; }
        .top-bar-right { justify-content: flex-end; }
        .brand-block { display: flex; align-items: center; gap: 10px; white-space: nowrap; height: 100%; }
        .brand-name { font-family: 'Noto Serif SC', serif; font-weight: 900; font-size: 22px; color: #1a1a1a; letter-spacing: 0.05em; }
        .brand-slogan { font-family: 'Outfit', sans-serif; font-size: 11px; color: #8a8a8e; font-weight: 400; text-transform: uppercase; letter-spacing: 0.12em; margin-top: 6px; position: relative; padding-left: 10px; }
        .brand-slogan::before { content: ""; position: absolute; left: 0; top: 15%; height: 70%; width: 1px; background: #d1d1d6; }
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
        @media (max-width: 768px) {
          .sidebar { position: fixed; left:0; top:0; bottom:0; transform: translateX(-100%); transition: transform 0.2s; z-index:99; width:180px !important; }
          .sidebar.mobile-open { transform: translateX(0); }
          .sidebar-overlay { display: block; }
        }
        [data-theme="dark"] .sidebar { background: var(--card); border-right-color: var(--border); }
        [data-theme="dark"] .top-bar { background: var(--surface); border-bottom-color: var(--border); }
        [data-theme="dark"] .top-search-box { background: var(--card); border-color: var(--border); }
        [data-theme="dark"] .nav-item.active { background: rgba(4,138,129,0.2); }
        [data-theme="dark"] .brand-name { color: var(--ink); }
      `}</style>
    </div>
  )
}
