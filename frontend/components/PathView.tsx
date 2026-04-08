'use client'

import React, { useState, useEffect } from 'react'
import { ChevronRight, Clock, BarChart2, CheckCircle, Zap } from 'lucide-react'
import ConceptGraph from './ConceptGraph'
import AutoPathPanel from './AutoPathPanel'
import { useApp } from '@/lib/appContext'

interface PathNode {
  slug: string
  zh_name: string
  en_name: string
  step_order: number
  is_key: boolean
  note?: string
  difficulty: number
}

interface Path {
  id: number
  slug: string
  zh_name: string
  en_name: string
  description?: string
  path_type: string
  difficulty: number
  duration: number
  nodes: PathNode[]
}

interface AutoPathNode {
  slug: string
  zh_name: string
  en_name: string
  difficulty: number
  importance: number
  step_order: number
}

interface Props {
  onConceptClick: (slug: string) => void
}

export default function PathView({ onConceptClick }: Props) {
  const { lang } = useApp()
  const [paths, setPaths] = useState<Path[]>([])
  const [activePath, setActivePath] = useState<Path | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [showGraph, setShowGraph] = useState(false)
  // Auto Path 模式
  const [mode, setMode] = useState<'manual' | 'auto'>('manual')
  const [autoPathNodes, setAutoPathNodes] = useState<AutoPathNode[]>([])
  const [autoCurrentStep, setAutoCurrentStep] = useState(0)

  useEffect(() => {
    fetch('/api/paths')
      .then(r => r.ok ? r.json() : { paths: [] })
      .then(d => setPaths(d.paths ?? []))
      .catch(() => {})
  }, [])

  const loadPath = (slug: string) => {
    fetch(`/api/path/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setActivePath(d); setCurrentStep(0); setShowGraph(false) } })
      .catch(() => {})
  }

  const difficultyLabel = (d: number) => '●'.repeat(d) + '○'.repeat(5 - d)

  if (!activePath) {
    return (
      <div style={{ padding: '24px' }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => setMode('manual')}
            style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
              border: `1px solid ${mode === 'manual' ? 'var(--teal)' : 'var(--border)'}`,
              background: mode === 'manual' ? 'var(--teal-light)' : 'none',
              color: mode === 'manual' ? 'var(--teal)' : 'var(--muted)',
              fontWeight: mode === 'manual' ? 600 : 400,
            }}
          >
            {lang === 'zh' ? '精选路径' : 'Curated'}
          </button>
          <button
            onClick={() => setMode('auto')}
            style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
              border: `1px solid ${mode === 'auto' ? '#165DFF' : 'var(--border)'}`,
              background: mode === 'auto' ? 'rgba(22,93,255,0.08)' : 'none',
              color: mode === 'auto' ? '#165DFF' : 'var(--muted)',
              fontWeight: mode === 'auto' ? 600 : 400,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Zap size={12} /> {lang === 'zh' ? '自动生成' : 'Auto Engine'}
          </button>
        </div>

        {/* Auto Path mode */}
        {mode === 'auto' && (
          <>
            <AutoPathPanel
              onConceptClick={onConceptClick}
              onPathGenerated={(nodes, step) => {
                setAutoPathNodes(nodes)
                setAutoCurrentStep(step)
              }}
            />
            {autoPathNodes.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <ConceptGraph
                  conceptDetail={null}
                  onNodeClick={slug => {
                    const idx = autoPathNodes.findIndex(n => n.slug === slug)
                    if (idx >= 0) setAutoCurrentStep(idx)
                  }}
                  lang={lang as 'zh' | 'en'}
                  pathMode
                  pathNodes={autoPathNodes.map(n => ({ ...n, is_key: false }))}
                  currentStep={autoCurrentStep}
                />
              </div>
            )}
          </>
        )}

        {/* Manual / curated paths */}
        {mode === 'manual' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {paths.map(p => (
              <div
                key={p.slug}
                onClick={() => loadPath(p.slug)}
                style={{
                  padding: '16px 20px', borderRadius: 12, cursor: 'pointer',
                  background: 'var(--card)', border: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--teal)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
                    {lang === 'zh' ? p.zh_name : p.en_name}
                  </div>
                  {p.description && (
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{p.description}</div>
                  )}
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} /> {p.duration}min
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <BarChart2 size={11} /> {difficultyLabel(p.difficulty)}
                    </span>
                    <span style={{
                      padding: '2px 8px', borderRadius: 20, fontSize: 10,
                      background: 'var(--teal-light)', color: 'var(--teal)',
                    }}>
                      {p.path_type}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--muted)" />
              </div>
            ))}
            {paths.length === 0 && (
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                {lang === 'zh' ? '暂无路径数据' : 'No paths available'}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  const nodes = activePath.nodes
  const node = nodes[currentStep]

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => setActivePath(null)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13 }}
        >
          ← {lang === 'zh' ? '路径列表' : 'All Paths'}
        </button>
        <ChevronRight size={12} color="var(--muted)" />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--teal)' }}>
          {lang === 'zh' ? activePath.zh_name : activePath.en_name}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {nodes.map((n, i) => (
          <div key={n.slug} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
            <div
              onClick={() => setCurrentStep(i)}
              style={{
                width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i < currentStep ? '#36CFC9' : i === currentStep ? '#165DFF' : 'var(--border)',
                color: i <= currentStep ? '#fff' : 'var(--muted)',
                fontSize: 12, fontWeight: 600, flexShrink: 0,
                transition: 'all 0.2s',
              }}
            >
              {i < currentStep ? <CheckCircle size={14} /> : i + 1}
            </div>
            {i < nodes.length - 1 && (
              <div style={{
                flex: 1, height: 2,
                background: i < currentStep ? '#36CFC9' : 'var(--border)',
                transition: 'background 0.3s',
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Graph toggle */}
      <button
        onClick={() => setShowGraph(v => !v)}
        style={{
          alignSelf: 'flex-start', padding: '6px 12px', borderRadius: 6,
          border: '1px solid var(--teal)', background: showGraph ? 'var(--teal)' : 'none',
          color: showGraph ? '#fff' : 'var(--teal)', fontSize: 12, cursor: 'pointer',
        }}
      >
        {lang === 'zh' ? (showGraph ? '收起图谱' : '路径图谱') : (showGraph ? 'Hide Graph' : 'Path Graph')}
      </button>

      {showGraph && (
        <ConceptGraph
          conceptDetail={null}
          onNodeClick={slug => {
            const idx = nodes.findIndex(n => n.slug === slug)
            if (idx >= 0) setCurrentStep(idx)
          }}
          lang={lang as 'zh' | 'en'}
          pathMode
          pathNodes={nodes}
          currentStep={currentStep}
        />
      )}

      {/* Current step card */}
      {node && (
        <div style={{
          padding: '20px', borderRadius: 12,
          background: 'var(--card)', border: '2px solid #165DFF',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                Step {currentStep + 1} / {nodes.length}
                {node.is_key && (
                  <span style={{
                    marginLeft: 8, padding: '2px 8px', borderRadius: 20, fontSize: 10,
                    background: 'rgba(22,93,255,0.1)', color: '#165DFF',
                  }}>
                    {lang === 'zh' ? '核心节点' : 'Key Node'}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>
                {lang === 'zh' ? node.zh_name : node.en_name}
              </div>
            </div>
            <button
              onClick={() => onConceptClick(node.slug)}
              style={{
                padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                background: '#165DFF', color: '#fff', border: 'none', fontSize: 13,
              }}
            >
              {lang === 'zh' ? '查看详情' : 'View'}
            </button>
          </div>
          {node.note && (
            <p style={{ fontSize: 13, color: 'var(--ink2)', margin: 0 }}>{node.note}</p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
          disabled={currentStep === 0}
          style={{
            flex: 1, padding: '10px', borderRadius: 8, cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
            background: 'var(--card)', border: '1px solid var(--border)',
            color: currentStep === 0 ? 'var(--muted)' : 'var(--ink)', fontSize: 13,
          }}
        >
          ← {lang === 'zh' ? '上一步' : 'Prev'}
        </button>
        <button
          onClick={() => setCurrentStep(s => Math.min(nodes.length - 1, s + 1))}
          disabled={currentStep === nodes.length - 1}
          style={{
            flex: 1, padding: '10px', borderRadius: 8,
            cursor: currentStep === nodes.length - 1 ? 'not-allowed' : 'pointer',
            background: currentStep === nodes.length - 1 ? 'var(--card)' : '#165DFF',
            border: '1px solid var(--border)',
            color: currentStep === nodes.length - 1 ? 'var(--muted)' : '#fff', fontSize: 13,
          }}
        >
          {lang === 'zh' ? '下一步' : 'Next'} →
        </button>
      </div>
    </div>
  )
}
