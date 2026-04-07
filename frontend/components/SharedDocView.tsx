'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, Home } from 'lucide-react'
import { useApp, type LensId } from '@/lib/appContext'
import { MDXRemote } from 'next-mdx-remote'
import RagConceptual from './RagConceptual'
import { LENS_ICONS, LENS_ZH, getIcon, type NavTopic } from './AppShell'

interface Props {
  pageId: string
  pageLabel: { zh: string; en: string }
  topics: NavTopic[]
  initialTopic?: string | null
  inOS?: boolean
}

export default function SharedDocView({ pageId, pageLabel, topics, initialTopic = null, inOS = false }: Props) {
  const { lang, activeLens, setActiveLens } = useApp()
  const [selectedTopic, setSelectedTopic] = useState<string | null>(initialTopic)
  const [dynamicToc, setDynamicToc] = useState<{ id: string; text: string }[]>([])
  const [mdxSource, setMdxSource] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => { setSelectedTopic(initialTopic) }, [pageId, initialTopic])

  useEffect(() => {
    if (!selectedTopic || !activeLens) return
    let mounted = true
    setIsLoading(true)
    setMdxSource(null)
    fetch(`/api/content?topic=${selectedTopic}&lens=${activeLens}&lang=${lang}`)
      .then(r => r.json())
      .then(data => { if (mounted && data.source) setMdxSource(data.source) })
      .catch(() => {})
      .finally(() => { if (mounted) setIsLoading(false) })
    return () => { mounted = false }
  }, [selectedTopic, activeLens, lang])

  useEffect(() => {
    const t = setTimeout(() => {
      const headings = document.querySelectorAll('.doc-main h2')
      setDynamicToc(Array.from(headings).map(h => {
        if (!h.id && h.textContent) {
          h.id = h.textContent.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
        }
        return { id: h.id, text: h.textContent || '' }
      }).filter(i => i.text.trim()))
    }, 300)
    return () => clearTimeout(t)
  }, [selectedTopic, activeLens, mdxSource])

  const currentTopic = topics.find(t => t.id === selectedTopic)
  const showDetail = !!selectedTopic

  return (
    <div className={`page-body ${inOS ? 'in-os' : ''}`}>
      <div className="breadcrumbs">
        {inOS ? (
          <button onClick={() => setSelectedTopic(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--muted)', fontSize: 13 }}>
            <Home size={14} style={{ marginRight: 4 }} /> {lang === 'zh' ? '返回模块主页' : 'Back'}
          </button>
        ) : (
          <>
            <Home size={14} />
            <ChevronRight size={12} />
            <span>{lang === 'zh' ? pageLabel.zh : pageLabel.en}</span>
          </>
        )}
        {selectedTopic && (
          <>
            <ChevronRight size={12} />
            <span>{lang === 'zh' ? currentTopic?.zh : currentTopic?.en}</span>
            <ChevronRight size={12} />
            <span className="active">{lang === 'zh' ? LENS_ZH[activeLens] : activeLens}</span>
          </>
        )}
      </div>

      {!showDetail ? (
        <div className="card-grid-page">
          {!inOS && <h1>{lang === 'zh' ? pageLabel.zh : pageLabel.en}</h1>}
          <div className="card-grid">
            {topics.map(t => {
              const Icon = getIcon(t.icon)
              return (
                <div key={t.id} className="topic-card" onClick={() => setSelectedTopic(t.id)}>
                  <div className="card-icon"><Icon size={20} /></div>
                  <div className="card-text">
                    <h3>{lang === 'zh' ? t.zh : t.en}</h3>
                    <p>{lang === 'zh' ? t.descZh : t.descEn}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="doc-layout">
          <div className="doc-left">
            {(Object.keys(LENS_ICONS) as LensId[]).map(l => {
              const Icon = LENS_ICONS[l]
              return (
                <button key={l} className={`lens-nav-item ${activeLens === l ? 'active' : ''}`} onClick={() => setActiveLens(l)}>
                  <Icon size={16} />
                  {lang === 'zh' ? LENS_ZH[l] : l}
                </button>
              )
            })}
          </div>

          <div className="doc-main">
            {isLoading ? (
              <div style={{ color: 'var(--muted)', marginTop: '20px' }}>Loading content...</div>
            ) : mdxSource ? (
              <MDXRemote {...mdxSource} components={{ RagConceptual }} />
            ) : (
              <p className="empty">{lang === 'zh' ? '该模块内容尚未录入或加载失败' : 'Content not found'}</p>
            )}
          </div>

          <div className="doc-right">
            <div className="toc-title">{lang === 'zh' ? '目录' : 'Contents'}</div>
            {dynamicToc.length > 0 ? dynamicToc.map((item, i) => (
              <div key={i} className="toc-item" style={{ cursor: 'pointer' }}
                onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                {item.text.replace(' Interactive', '')}
              </div>
            )) : (
              <div className="empty" style={{ fontSize: 12, marginTop: 8 }}>
                {lang === 'zh' ? '当前页面无小节目录' : 'No sections'}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        .page-body { flex:1; overflow-y: auto; padding:24px 32px; height: 100%; display: flex; flex-direction: column; background: var(--surface); }
        .page-body.in-os { padding: 12px 20px; background: transparent; }
        .breadcrumbs { display: flex; align-items: center; gap:6px; font-size:13px; color: var(--muted); margin-bottom:20px; flex-shrink: 0; }
        .breadcrumbs .active { color: var(--teal); font-weight:600; }
        .card-grid-page h1 { font-size:24px; font-weight:700; margin-bottom:24px; color: var(--ink); }
        .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap:16px; }
        .topic-card { display: flex; align-items: center; gap:12px; padding:16px 20px; height:88px; background: var(--card); border:1px solid var(--border); border-radius:12px; cursor:pointer; transition:0.15s; overflow:hidden; }
        .topic-card:hover { border-color: var(--teal); box-shadow: 0 2px 12px rgba(4,138,129,0.1); }
        .card-icon { width:36px; height:36px; display:grid; place-items:center; background: var(--teal-light); border-radius:10px; color: var(--teal); flex-shrink:0; }
        .card-text h3 { font-size:15px; font-weight:600; margin-bottom:4px; color: var(--ink); }
        .card-text p { font-size:13px; color: var(--muted); overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
        .doc-layout { display: flex; gap:0; flex: 1; overflow: hidden; }
        .doc-left { width:180px; flex-shrink:0; padding:16px 8px; border-right:1px solid var(--border); overflow-y: auto; }
        .lens-nav-item { display:flex; align-items:center; gap:8px; width:100%; padding:9px 12px; border-radius:8px; border:none; background:none; color: var(--muted); font-size:13px; cursor:pointer; font-family:inherit; margin-bottom:2px; }
        .lens-nav-item:hover { background: var(--surface); color: var(--ink); }
        .lens-nav-item.active { background: var(--teal-light); color: var(--teal); font-weight:600; }
        .doc-main { flex:1; padding:24px 32px; overflow-y:auto; }
        .doc-main h1 { font-size:22px; font-weight:700; margin-bottom:16px; color: var(--ink); }
        .doc-main p { font-size:14px; line-height:1.7; color: var(--ink2); margin-bottom:10px; }
        .doc-right { width:200px; flex-shrink:0; padding:16px; border-left:1px solid var(--border); overflow-y: auto; }
        .toc-title { font-size:11px; font-weight:600; color: var(--muted); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:10px; }
        .toc-item { font-size:12px; color: var(--muted); padding:6px 0; border-bottom:1px solid var(--border); transition: color 0.2s; }
        .toc-item:hover { color: var(--teal); }
        .empty { color: var(--muted); font-style:italic; }
      `}</style>
    </div>
  )
}
