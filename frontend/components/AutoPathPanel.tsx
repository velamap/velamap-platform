'use client'

import React, { useState } from 'react'
import { Zap, RotateCcw, Loader } from 'lucide-react'
import { useApp } from '@/lib/appContext'

interface AutoPathNode {
  slug: string
  zh_name: string
  en_name: string
  difficulty: number
  importance: number
  step_order: number
}

interface AutoPathResult {
  target: string
  path_type: string
  total_cost: number
  cached: boolean
  nodes: AutoPathNode[]
}

const PATH_TYPES = [
  { id: 'learning',    zh: '学习路径', en: 'Learning'    },
  { id: 'engineering', zh: '工程路径', en: 'Engineering' },
  { id: 'reverse',     zh: '反向拆解', en: 'Reverse'     },
  { id: 'minimal',     zh: '最短路径', en: 'Minimal'     },
]

interface Props {
  onConceptClick: (slug: string) => void
  onPathGenerated?: (nodes: AutoPathNode[], currentStep: number) => void
  defaultTarget?: string
}

export default function AutoPathPanel({ onConceptClick, onPathGenerated, defaultTarget = '' }: Props) {
  const { lang } = useApp()
  const [query, setQuery]       = useState(defaultTarget)
  const [pathType, setPathType] = useState('learning')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState<AutoPathResult | null>(null)
  const [error, setError]       = useState('')
  const [currentStep, setCurrentStep] = useState(0)

  const generate = async () => {
    const slug = query.trim()
    if (!slug) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch(`/api/auto-path?target=${encodeURIComponent(slug)}&type=${pathType}`)
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'failed')
        return
      }
      const data: AutoPathResult = await res.json()
      setResult(data)
      setCurrentStep(0)
      onPathGenerated?.(data.nodes, 0)
    } catch {
      setError(lang === 'zh' ? '网络错误' : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleStepClick = (i: number) => {
    setCurrentStep(i)
    onPathGenerated?.(result!.nodes, i)
  }

  const diffDots = (d: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < d ? '#165DFF' : 'var(--border)', fontSize: 10 }}>●</span>
    ))

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Zap size={16} color="#165DFF" />
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
          {lang === 'zh' ? '自动路径生成' : 'Auto Path Engine'}
        </span>
        {result && (
          <span style={{
            marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 20,
            background: result.cached ? 'var(--teal-light)' : 'rgba(22,93,255,0.1)',
            color: result.cached ? 'var(--teal)' : '#165DFF',
          }}>
            {result.cached ? (lang === 'zh' ? '缓存' : 'cached') : (lang === 'zh' ? '实时生成' : 'live')}
          </span>
        )}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && generate()}
          placeholder={lang === 'zh' ? '输入目标概念 slug，如 rag' : 'Enter target slug, e.g. rag'}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 13,
            border: '1px solid var(--border)', background: 'var(--card)',
            color: 'var(--ink)', outline: 'none',
          }}
        />
        <button
          onClick={generate}
          disabled={loading || !query.trim()}
          style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
            background: loading || !query.trim() ? 'var(--border)' : '#165DFF',
            color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          {loading ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={13} />}
          {lang === 'zh' ? '生成' : 'Go'}
        </button>
      </div>

      {/* Path type selector */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {PATH_TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => setPathType(t.id)}
            style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
              border: `1px solid ${pathType === t.id ? '#165DFF' : 'var(--border)'}`,
              background: pathType === t.id ? 'rgba(22,93,255,0.1)' : 'none',
              color: pathType === t.id ? '#165DFF' : 'var(--muted)',
            }}
          >
            {lang === 'zh' ? t.zh : t.en}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ fontSize: 13, color: '#f87171', padding: '8px 12px', borderRadius: 8, background: 'rgba(248,113,113,0.1)' }}>
          {error}
        </div>
      )}

      {/* Result */}
      {result && result.nodes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Cost badge */}
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            {lang === 'zh' ? `认知成本 ${result.total_cost} · ${result.nodes.length} 步` : `cost ${result.total_cost} · ${result.nodes.length} steps`}
          </div>

          {/* Step rail */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto', paddingBottom: 4 }}>
            {result.nodes.map((n, i) => (
              <div key={n.slug} style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <div
                  onClick={() => handleStepClick(i)}
                  title={lang === 'zh' ? n.zh_name : n.en_name}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: i < currentStep ? '#36CFC9' : i === currentStep ? '#165DFF' : 'var(--border)',
                    color: i <= currentStep ? '#fff' : 'var(--muted)',
                    fontSize: 11, fontWeight: 600, transition: 'all 0.2s',
                    boxShadow: i === currentStep ? '0 0 0 3px rgba(22,93,255,0.2)' : 'none',
                  }}
                >
                  {i + 1}
                </div>
                {i < result.nodes.length - 1 && (
                  <div style={{ width: 20, height: 2, background: i < currentStep ? '#36CFC9' : 'var(--border)', flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>

          {/* Active node card */}
          {(() => {
            const n = result.nodes[currentStep]
            return (
              <div style={{
                padding: '16px', borderRadius: 12,
                background: 'var(--card)', border: '2px solid #165DFF',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                      Step {currentStep + 1} / {result.nodes.length}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
                      {lang === 'zh' ? n.zh_name : n.en_name}
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                      {diffDots(n.difficulty)}
                    </div>
                  </div>
                  <button
                    onClick={() => onConceptClick(n.slug)}
                    style={{
                      padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                      background: '#165DFF', color: '#fff', border: 'none', fontSize: 12,
                    }}
                  >
                    {lang === 'zh' ? '查看' : 'View'}
                  </button>
                </div>
              </div>
            )
          })()}

          {/* Nav buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => handleStepClick(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              style={{
                flex: 1, padding: '8px', borderRadius: 8, fontSize: 13,
                background: 'var(--card)', border: '1px solid var(--border)',
                color: currentStep === 0 ? 'var(--muted)' : 'var(--ink)',
                cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              ← {lang === 'zh' ? '上一步' : 'Prev'}
            </button>
            <button
              onClick={() => handleStepClick(Math.min(result.nodes.length - 1, currentStep + 1))}
              disabled={currentStep === result.nodes.length - 1}
              style={{
                flex: 1, padding: '8px', borderRadius: 8, fontSize: 13,
                background: currentStep === result.nodes.length - 1 ? 'var(--card)' : '#165DFF',
                border: '1px solid var(--border)',
                color: currentStep === result.nodes.length - 1 ? 'var(--muted)' : '#fff',
                cursor: currentStep === result.nodes.length - 1 ? 'not-allowed' : 'pointer',
              }}
            >
              {lang === 'zh' ? '下一步' : 'Next'} →
            </button>
          </div>

          {/* Reset */}
          <button
            onClick={() => { setResult(null); setQuery(''); setCurrentStep(0) }}
            style={{
              alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, color: 'var(--muted)',
            }}
          >
            <RotateCcw size={11} /> {lang === 'zh' ? '重新生成' : 'Reset'}
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
