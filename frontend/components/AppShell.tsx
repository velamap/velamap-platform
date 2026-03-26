'use client'

import { useState, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import { Telescope, LayoutGrid, Bot, Cpu, Server, LogOut, LogIn, Sun, Moon, Monitor, Globe, Languages, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { useApp } from '@/lib/appContext'

const NAV_ITEMS = [
  { id: 'frontier',     zhLabel: '前沿探索',   enLabel: 'Frontier',      icon: Telescope  },
  { id: 'applications', zhLabel: '应用落地',   enLabel: 'Applications',  icon: LayoutGrid },
  { id: 'agents',       zhLabel: '智能体',     enLabel: 'Agents',        icon: Bot        },
  { id: 'execution',    zhLabel: '执行层',     enLabel: 'Execution',     icon: Cpu        },
  { id: 'ai-infra',     zhLabel: 'AI基础设施', enLabel: 'AI Infra',      icon: Server     },
] as const

type PageId = typeof NAV_ITEMS[number]['id']

export default function AppShell({ user }: { user: User | null }) {
  const { theme, setTheme, setMode, t, lang, setLang } = useApp()
  const [activePage, setActivePage] = useState<PageId>('frontier')
  const [collapsed, setCollapsed] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.reload()
  }

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const displayName = (user?.user_metadata?.name as string) || user?.email || '?'

  // close user menu on outside click — handled via onBlur/outside click on avatar button

  return (
    <div className="app-shell">
      {/* SIDEBAR */}
      <div className={`sidebar${collapsed ? ' collapsed' : ''}`}>
        <div className="sidebar-logo">
          {!collapsed && (
            <>
              <div className="logo-mark" style={{ flex: 1 }}>{lang === 'zh' ? '起飞AI' : 'Soar AI'}</div>
            </>
          )}
          <button
            className="sidebar-toggle"
            onClick={() => setCollapsed(v => !v)}
            title={collapsed ? t('展开', 'Expand') : t('收起', 'Collapse')}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
        <nav className="nav">
          {!collapsed && <div className="nav-section">{t('知识体系', 'Knowledge')}</div>}
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => setActivePage(item.id)}
                title={collapsed ? (lang === 'zh' ? item.zhLabel : item.enLabel) : undefined}
              >
                <Icon size={16} className="nav-icon" style={{ opacity: 1, flexShrink: 0 }} />
                {!collapsed && <span>{lang === 'zh' ? item.zhLabel : item.enLabel}</span>}
              </button>
            )
          })}
        </nav>
        <div className="sidebar-user">
          {user ? (
            /* avatar — click to show menu */
            <div ref={avatarRef} style={{ position: 'relative' }}>
              <div onClick={() => setShowUserMenu(v => !v)} style={{ cursor: 'pointer' }} title={displayName}>
                {avatarUrl
                  ? <Image src={avatarUrl} alt="avatar" width={30} height={30} className="avatar" />
                  : <div className="avatar">{displayName[0].toUpperCase()}</div>
                }
              </div>
              {showUserMenu && (
                <div style={{ position: 'absolute', bottom: 40, left: -8, width: 160, background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10, padding: '6px 0', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 999 }}>
                  <div style={{ padding: '8px 14px', fontSize: 12, color: 'var(--muted)', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>{displayName}</div>
                  <div style={{ padding: '6px 14px 2px', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('视图模式', 'View Mode')}</div>
                  <div style={{ display: 'flex', gap: 6, padding: '4px 14px 8px', borderBottom: '1px solid var(--border)' }}>
                    <button onClick={() => setMode('os')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 0', borderRadius: 6, border: '1px solid var(--border2)', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--muted)', fontFamily: 'inherit' }}>
                      <Monitor size={13} /> OS
                    </button>
                    <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 0', borderRadius: 6, border: '1px solid var(--teal)', background: 'var(--teal-light)', cursor: 'default', fontSize: 12, fontWeight: 600, color: 'var(--teal)', fontFamily: 'inherit' }}>
                      <Globe size={13} /> Web
                    </button>
                  </div>
                  <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ink)', fontFamily: 'inherit' }}>
                    <LogOut size={13} /> {t('退出登录', 'Sign out')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={async () => { const { createClient } = await import('@/lib/supabase/client'); await createClient().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/auth/callback` } }) }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--muted)', fontFamily: 'inherit' }}
            >
              <LogIn size={14} /> {t('登录', 'Sign in')}
            </button>
          )}
          {user && !collapsed && (
            <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
              <div className="name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
            </div>
          )}
        </div>
      </div>

      {/* MAIN */}
      <div className="main" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* TOP NAV — same class as OS mode for consistent alignment */}
        <nav className="desktop-nav" style={{ position: 'relative', flexShrink: 0, background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
          {/* spacer matches OS mode logo width so controls stay in same position */}
          <div style={{ marginRight: 'auto' }} />
          <div className="nav-right-controls" style={{ marginLeft: 0 }}>
            <button className="nav-icon-btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} title={t('切换主题', 'Toggle theme')}>
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button
              className="nav-icon-btn"
              onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
              title="Language"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, width: 44, height: 32 }}
            >
              <Languages size={15} />
              <span style={{ fontSize: 14, lineHeight: 1 }}>{lang === 'zh' ? '🇨🇳' : '🇺🇸'}</span>
            </button>
          </div>
        </nav>

        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--surface)' }}>
          {activePage === 'frontier'     && <FrontierPage />}
          {activePage === 'applications' && <ApplicationsPage />}
          {activePage === 'agents'       && <AgentsPage />}
          {activePage === 'execution'    && <ExecutionPage />}
          {activePage === 'ai-infra'     && <AIInfraPage />}
        </div>
      </div>
    </div>
  )
}

/* ── shared ── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, color: 'var(--ink)' }}>{children}</div>
}

function TagGroup({ title, items, color }: { title: string; items: string[]; color?: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: color ?? 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {items.map(item => (
          <span key={item} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, border: `1px solid ${color ?? 'var(--border2)'}`, color: color ?? 'var(--muted)' }}>{item}</span>
        ))}
      </div>
    </div>
  )
}

function MatrixRow({ cap, domains }: { cap: string; domains: string[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <div style={{ width: 80, fontSize: 13, fontWeight: 600, color: 'var(--ink)', flexShrink: 0 }}>{cap}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {domains.map(d => (
          <span key={d} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border2)' }}>{d}</span>
        ))}
      </div>
    </div>
  )
}

/* ── pages ── */
function FrontierPage() {
  const { t } = useApp()
  return (
    <div className="page">
      <SectionTitle>{t('前沿探索', 'Frontier')}</SectionTitle>
      <TagGroup title={t('新兴范式', 'Emerging')} color="#5b4fcf" items={['Mixture of Experts', 'Speculative Decoding', 'Test-Time Compute']} />
      <TagGroup title={t('主流应用', 'Mainstream')} color="#048a81" items={['RAG', 'Function Calling', 'Fine-tuning']} />
      <TagGroup title={t('基础理论', 'Foundation')} color="#888" items={['Transformer', 'Backpropagation', 'Tokenization']} />
      <div style={{ marginTop: 8, padding: '10px 14px', background: 'var(--surface)', borderRadius: 8, fontSize: 12, color: 'var(--muted)' }}>
        {t('成熟度 · 确定性 · 新鲜度 · 类型', 'maturity · certainty · freshness · type')}
      </div>
    </div>
  )
}

function ApplicationsPage() {
  const { t } = useApp()
  return (
    <div className="page">
      <SectionTitle>{t('应用落地', 'Applications')}</SectionTitle>
      <MatrixRow cap={t('生成', 'Generate')}    domains={[t('编程','Coding'), t('营销','Marketing'), t('教育','Education')]} />
      <MatrixRow cap={t('分析', 'Analyze')}     domains={[t('金融','Finance'), t('医疗','Healthcare'), t('通用','General')]} />
      <MatrixRow cap={t('决策', 'Decide')}      domains={[t('金融','Finance'), t('通用','General')]} />
      <MatrixRow cap={t('执行', 'Act')}         domains={[t('编程','Coding'), t('通用','General')]} />
      <MatrixRow cap={t('沟通', 'Communicate')} domains={[t('营销','Marketing'), t('教育','Education')]} />
    </div>
  )
}

function AgentsPage() {
  const { t } = useApp()
  const sections = [
    { title: t('决策系统','Decision Systems'), items: [t('规划','Planning'), t('推理','Reasoning'), t('反思','Reflection')] },
    { title: t('架构模式','Architectures'),    items: ['ReAct', 'Plan-Execute', 'Tree of Thought', 'Self-Refine'] },
    { title: t('多智能体','Multi-Agent'),      items: [t('群体协作','Swarm'), t('角色分工','Role-based'), t('层级结构','Hierarchy')] },
    { title: t('认知建模','Cognitive'),        items: [t('信念建模','Belief Modeling'), t('上下文建模','Context Modeling')] },
  ]
  return (
    <div className="page">
      <SectionTitle>{t('智能体', 'Agents')}</SectionTitle>
      {sections.map(s => <TagGroup key={s.title} title={s.title} items={s.items} />)}
    </div>
  )
}

function ExecutionPage() {
  const { t } = useApp()
  const sections = [
    { title: t('编排','Orchestration'),       items: [t('工作流','Workflow'), 'DAG', t('事件驱动','Event')] },
    { title: t('上下文系统','Context Systems'), items: ['RAG', 'Embeddings', 'Vector DB', t('记忆','Memory')] },
    { title: t('驭控工程','Harness Engineering'), items: [t('评估','Evaluation'), t('反馈循环','Feedback Loop'), t('自动调试','Auto Debug'), t('约束','Constraints')] },
    { title: t('可观测性','Observability'),    items: [t('日志','Logging'), t('链路追踪','Tracing'), t('监控','Monitoring'), t('成本','Cost')] },
    { title: t('可靠性','Reliability'),        items: [t('重试','Retry'), t('降级','Fallback'), 'Guardrails', t('恢复','Recovery')] },
  ]
  return (
    <div className="page">
      <SectionTitle>{t('执行层', 'Execution')}</SectionTitle>
      {sections.map(s => <TagGroup key={s.title} title={s.title} color="#048a81" items={s.items} />)}
    </div>
  )
}

function AIInfraPage() {
  const { t } = useApp()
  const sections = [
    { title: t('基础理论','Foundations'), items: ['Transformer', 'MoE', 'Diffusion', 'Backprop', 'Scaling Law', 'Tokenization'] },
    { title: t('系统','Systems'),         items: ['vLLM', 'KV Cache', 'Quantization', t('分布式训练','Distributed Training'), 'Serverless'] },
    { title: t('硬件','Hardware'),        items: ['GPU', 'NPU'] },
    { title: t('资源','Resources'),       items: [t('数据集','Datasets'), t('基准测试','Benchmarks'), t('评估集','Eval Sets'), t('提示词库','Prompt Libraries'), 'Model Zoo'] },
  ]
  return (
    <div className="page">
      <SectionTitle>{t('AI基础设施', 'AI Infra')}</SectionTitle>
      {sections.map(s => <TagGroup key={s.title} title={s.title} items={s.items} />)}
    </div>
  )
}
