'use client'

import React, { useMemo, useRef, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <div className="graph-loading">Initializing Knowledge Map...</div>
})

// 关系类型 → 颜色映射
const REL_COLORS: Record<string, string> = {
  upstream:     '#165DFF',  // 深蓝
  downstream:   '#36CFC9',  // 薄荷绿
  parallel:     '#FF7D00',  // 橙色
  part_of:      '#94a3b8',  // 灰（结构归属）
  variant_of:   '#a78bfa',  // 紫
  used_by:      '#34d399',  // 绿
  implements:   '#60a5fa',  // 浅蓝
  optimized_by: '#fb923c',  // 橙红
  related_to:   '#cbd5e1',  // 浅灰
}

// 路径模式节点状态颜色
const PATH_STATE_COLORS = {
  completed: '#36CFC9',
  active:    '#165DFF',
  available: '#FF7D00',
  locked:    '#94a3b8',
}

type PathNodeState = 'completed' | 'active' | 'available' | 'locked'

interface GraphNode {
  id: string
  name: string
  val: number
  color: string
  type: string
  pathState?: PathNodeState
}

interface GraphLink {
  source: string
  target: string
  type: string
  color: string
}

interface PathNode {
  slug: string
  zh_name: string
  step_order: number
  is_key: boolean
  note?: string
}

interface Props {
  conceptDetail: any
  onNodeClick: (slug: string) => void
  lang: 'zh' | 'en'
  // 路径模式
  pathMode?: boolean
  pathNodes?: PathNode[]
  currentStep?: number
}

export default function ConceptGraph({
  conceptDetail, onNodeClick, lang,
  pathMode = false, pathNodes = [], currentStep = 0
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 })

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        setDimensions({ width: e.contentRect.width, height: e.contentRect.height })
      }
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const graphData = useMemo(() => {
    // ── 路径模式 ──────────────────────────────────────────────
    if (pathMode && pathNodes.length > 0) {
      const nodes: GraphNode[] = pathNodes.map((n, i) => {
        let pathState: PathNodeState = 'locked'
        if (i < currentStep)       pathState = 'completed'
        else if (i === currentStep) pathState = 'active'
        else if (i === currentStep + 1) pathState = 'available'

        return {
          id: n.slug,
          name: n.zh_name,
          val: n.is_key ? 20 : 12,
          color: PATH_STATE_COLORS[pathState],
          type: 'path',
          pathState,
        }
      })

      const links: GraphLink[] = pathNodes.slice(0, -1).map((n, i) => ({
        source: n.slug,
        target: pathNodes[i + 1].slug,
        type: 'path',
        color: '#94a3b8',
      }))

      return { nodes, links }
    }

    // ── 探索模式 ──────────────────────────────────────────────
    if (!conceptDetail) return { nodes: [], links: [] }

    const nodes: GraphNode[] = []
    const links: GraphLink[] = []

    // 当前节点，大小按 importance 缩放
    const importance = conceptDetail.importance ?? 1
    nodes.push({
      id: conceptDetail.slug,
      name: conceptDetail.name,
      val: 10 + importance * 3,
      color: '#0d9488',
      type: 'current',
    })

    const addRelations = (rels: any[], relType: string) => {
      const color = REL_COLORS[relType] ?? '#94a3b8'
      rels.forEach(rel => {
        if (!nodes.find(n => n.id === rel.id)) {
          nodes.push({
            id: rel.id,
            name: rel.name,
            val: 8 + (rel.weight ?? 1) * 4,
            color,
            type: relType,
          })
        }
        const isUpstream = relType === 'upstream'
        links.push({
          source: isUpstream ? rel.id : conceptDetail.slug,
          target: isUpstream ? conceptDetail.slug : rel.id,
          type: relType,
          color,
        })
      })
    }

    const allRelTypes = [
      'upstream', 'downstream', 'parallel',
      'part_of', 'variant_of', 'used_by',
      'implements', 'optimized_by', 'related_to',
    ]
    allRelTypes.forEach(t => addRelations(conceptDetail[t] ?? [], t))

    return { nodes, links }
  }, [conceptDetail, pathMode, pathNodes, currentStep])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%', height: '400px',
        background: 'rgba(0,0,0,0.02)', borderRadius: '12px',
        overflow: 'hidden', position: 'relative',
        border: '1px solid var(--border)',
      }}
    >
      <ForceGraph2D
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0,0,0,0)"
        nodeRelSize={6}
        nodeVal={d => (d as GraphNode).val}
        nodeColor={d => (d as GraphNode).color}
        nodeLabel={d => (d as GraphNode).name}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        linkCurvature={0.2}
        linkColor={l => (l as GraphLink).color}
        onNodeClick={node => onNodeClick((node as GraphNode).id)}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const n = node as GraphNode
          const fontSize = 12 / globalScale
          ctx.font = `${fontSize}px Inter, sans-serif`

          // glow
          ctx.shadowColor = n.color
          ctx.shadowBlur = n.type === 'current' ? 12 / globalScale : 6 / globalScale

          // circle
          ctx.fillStyle = n.color
          ctx.beginPath()
          ctx.arc(node.x!, node.y!, n.type === 'current' ? 6 : 4, 0, 2 * Math.PI)
          ctx.fill()

          // key node ring (path mode)
          if (n.pathState === 'active') {
            ctx.strokeStyle = '#fff'
            ctx.lineWidth = 1.5 / globalScale
            ctx.beginPath()
            ctx.arc(node.x!, node.y!, 7, 0, 2 * Math.PI)
            ctx.stroke()
          }

          ctx.shadowBlur = 0
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = 'var(--ink)'
          ctx.fillText(n.name, node.x!, node.y! + 10)
        }}
      />

      {/* 图例 */}
      <div style={{
        position: 'absolute', bottom: '12px', left: '12px',
        display: 'flex', gap: '12px', flexWrap: 'wrap',
        fontSize: '11px', color: 'var(--muted)', pointerEvents: 'none',
      }}>
        {pathMode ? (
          <>
            {(['completed', 'active', 'available', 'locked'] as PathNodeState[]).map(s => (
              <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: PATH_STATE_COLORS[s], display: 'inline-block' }} />
                {s}
              </span>
            ))}
          </>
        ) : (
          <>
            {(['upstream', 'downstream', 'parallel'] as const).map(t => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: REL_COLORS[t], display: 'inline-block' }} />
                {lang === 'zh'
                  ? { upstream: '上游', downstream: '下游', parallel: '同级' }[t]
                  : t}
              </span>
            ))}
          </>
        )}
      </div>

      <div style={{
        position: 'absolute', bottom: '12px', right: '12px',
        fontSize: '11px', color: 'var(--muted)', pointerEvents: 'none',
      }}>
        {lang === 'zh' ? '拖动 · 点击跳转' : 'Drag · Click to explore'}
      </div>
    </div>
  )
}
