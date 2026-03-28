import re

# 1. Update SharedDocView.tsx
with open('frontend/components/SharedDocView.tsx', 'r') as f:
    shared = f.read()

shared = shared.replace(
    "export default function SharedDocView({ pageId, inOS = false }: { pageId: PageId, inOS?: boolean }) {",
    "export default function SharedDocView({ pageId, initialTopic = null, inOS = false }: { pageId: PageId, initialTopic?: string | null, inOS?: boolean }) {"
)
shared = shared.replace(
    "const [selectedTopic, setSelectedTopic] = useState<string | null>(null)",
    "const [selectedTopic, setSelectedTopic] = useState<string | null>(initialTopic)"
)

# Add useEffect to reset selectedTopic when pageId changes
reset_effect = """
  // Sync when props change (especially useful when key changes or initialTopic changes)
  useEffect(() => {
    setSelectedTopic(initialTopic);
  }, [pageId, initialTopic]);
"""
shared = shared.replace(
    "const [isLoading, setIsLoading] = useState(false)",
    "const [isLoading, setIsLoading] = useState(false)\n" + reset_effect
)

with open('frontend/components/SharedDocView.tsx', 'w') as f:
    f.write(shared)


# 2. Update AppShell.tsx
with open('frontend/components/AppShell.tsx', 'r') as f:
    appshell = f.read()

appshell = appshell.replace("SidebarClose, SidebarOpen", "PanelLeftClose, PanelLeft")

appshell = re.sub(
    r"const \[search, setSearch\] = useState\(''\)",
    "const [search, setSearch] = useState('')\n  const [searchTargetTopic, setSearchTargetTopic] = useState<string | null>(null)\n  const [searchFocused, setSearchFocused] = useState(false)",
    appshell
)

# Add searchResults logic
search_logic = """
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
"""
appshell = re.sub(
    r"const \[searchFocused, setSearchFocused\] = useState\(false\)",
    "const [searchFocused, setSearchFocused] = useState(false)\n" + search_logic,
    appshell
)
# Ensure import useMemo
if "useMemo" not in appshell:
    appshell = appshell.replace("const { useState, useRef, useEffect }", "const { useState, useRef, useEffect, useMemo }")
    appshell = appshell.replace("import { useState, useRef, useEffect } from 'react'", "import { useState, useRef, useEffect, useMemo } from 'react'")

# Update Sidebar header and Remove sidebar search
sidebar_header_old = """          <div className="sidebar-header">
            {!collapsed && <div className="logo-text">{lang === 'zh' ? '帆图' : 'Vela AI'}</div>}
            <button className="close-mobile" onClick={() => setMobileSidebarOpen(false)}><X size={18} /></button>
            <button className="toggle-desktop" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <SidebarOpen size={18} /> : <SidebarClose size={18} />}
            </button>
          </div>

          <div className="search-box">
            <Search size={14} />
            <input placeholder={lang === 'zh' ? '搜索' : 'Search'} value={search} onChange={e => setSearch(e.target.value)} />
          </div>"""
          
sidebar_header_new = """          <div className="sidebar-header" style={{ justifyContent: collapsed ? 'center' : 'space-between' }}>
            {!collapsed && <div className="logo-text" style={{ fontSize: '18px', letterSpacing: '0.05em' }}>{lang === 'zh' ? '帆图' : 'Vela AI'}</div>}
            <button className="close-mobile" onClick={() => setMobileSidebarOpen(false)}><X size={18} /></button>
            <button className="toggle-desktop" onClick={() => setCollapsed(!collapsed)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, borderRadius: 6 }} title={collapsed ? '展开' : '收起'}>
              {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
            </button>
          </div>"""

appshell = appshell.replace(sidebar_header_old, sidebar_header_new)

# Update nav-item onClick to reset searchTargetTopic
appshell = appshell.replace(
    "onClick={() => { setActivePage(item.id); setSelectedTopic(null); setMobileSidebarOpen(false) }}",
    "onClick={() => { setActivePage(item.id); setSearchTargetTopic(null); setMobileSidebarOpen(false) }}"
)

# Update Top bar
topbar_old = """        {/* 顶部控制栏 */}
        <div className="top-bar">
          {/* 主题切换 */}
          <button className="nav-icon-btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} title={lang === 'zh' ? '切换主题' : 'Toggle theme'}>
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          {/* 语言切换 */}
          <LangDropdown />
        </div>"""

topbar_new = """        {/* 顶部控制栏 */}
        <div className="top-bar">
          <div className="top-bar-left"></div>
          
          <div className="top-search-container">
            <div className="top-search-box">
              <Search size={14} className="search-icon" />
              <input 
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
        </div>"""

appshell = appshell.replace(topbar_old, topbar_new)

# Update SharedDocView instance
appshell = appshell.replace(
    "<SharedDocView pageId={activePage} />",
    "<SharedDocView key={`${activePage}-${searchTargetTopic || 'none'}`} pageId={activePage} initialTopic={searchTargetTopic} />"
)

# Insert new CSS for top-bar and search dropdown
css_to_insert = """
        .top-bar { height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; background: var(--surface); border-bottom: 1px solid var(--border); flex-shrink: 0; }
        .top-bar-left, .top-bar-right { display: flex; align-items: center; gap: 8px; min-width: 120px; }
        .top-bar-right { justify-content: flex-end; }
        
        .top-search-container { position: relative; flex: 1; max-width: 480px; display: flex; justify-content: center; }
        .top-search-box { display: flex; align-items: center; gap: 8px; padding: 0 16px; height: 36px; width: 100%; max-width: 400px; background: var(--card); border: 1px solid var(--border); border-radius: 18px; transition: border-color 0.2s, box-shadow 0.2s; }
        .top-search-box:focus-within { border-color: var(--teal); box-shadow: 0 0 0 3px var(--teal-light); }
        .top-search-box .search-icon { color: var(--muted); }
        .top-search-box input { border: none; background: transparent; outline: none; color: var(--ink); font-size: 14px; width: 100%; }
        
        .search-dropdown { position: absolute; top: calc(100% + 8px); left: 50%; transform: translateX(-50%); width: 100%; max-width: 400px; background: var(--card); border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.08); padding: 8px; z-index: 1000; }
        .search-dropdown-header { font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; padding: 8px 12px 4px; }
        .search-result-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 8px; cursor: pointer; transition: background 0.15s; }
        .search-result-item:hover { background: var(--surface); }
        .sr-icon { width: 28px; height: 28px; border-radius: 6px; background: var(--teal-light); color: var(--teal); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .sr-text { flex: 1; overflow: hidden; }
        .sr-title { font-size: 14px; font-weight: 500; color: var(--ink); margin-bottom: 2px; }
        .sr-path { font-size: 11px; color: var(--muted); }
        .search-empty { padding: 24px; text-align: center; font-size: 13px; color: var(--muted); font-style: italic; }
"""

# Replace old top-bar css and sidebar search css
appshell = re.sub(r"\.search-box \{.*?\}\n *\.search-box input \{.*?\}\n", "", appshell, flags=re.DOTALL)
appshell = re.sub(r"\.top-bar \{.*?\}\n", css_to_insert, appshell, flags=re.DOTALL)


with open('frontend/components/AppShell.tsx', 'w') as f:
    f.write(appshell)

print("Updated search and navigation successfully")
