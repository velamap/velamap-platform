'use client'

import React, { useMemo, useRef, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Use dynamic import for the graph library to avoid Server-Side Rendering issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <div className="graph-loading">Initializing Knowledge Map...</div>
})

interface GraphNode {
  id: string
  name: string
  val: number
  color: string
  type: 'current' | 'upstream' | 'parallel' | 'downstream'
}

interface GraphLink {
  source: string
  target: string
  type: string
  color: string
}

interface Props {
  conceptDetail: any
  onNodeClick: (slug: string) => void
  lang: 'zh' | 'en'
}

export default function ConceptGraph({ conceptDetail, onNodeClick, lang }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 })

  // Handle container resizing
  useEffect(() => {
    if (!containerRef.current) return
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        })
      }
    })
    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  // Prepare graph data
  const graphData = useMemo(() => {
    if (!conceptDetail) return { nodes: [], links: [] }

    const nodes: GraphNode[] = []
    const links: GraphLink[] = []

    // 1. Current Node
    nodes.push({
      id: conceptDetail.slug,
      name: conceptDetail.name,
      val: 20,
      color: '#0d9488', // Teal 600
      type: 'current'
    })

    // 2. Helper to add nodes and links
    const addRelations = (rels: any[], type: 'upstream' | 'parallel' | 'downstream', color: string) => {
      rels.forEach(rel => {
        // Node
        if (!nodes.find(n => n.id === rel.id)) {
          nodes.push({
            id: rel.id,
            name: rel.name,
            val: 12,
            color,
            type
          })
        }
        // Link
        if (type === 'upstream') {
          links.push({ source: rel.id, target: conceptDetail.slug, type, color })
        } else if (type === 'downstream') {
          links.push({ source: conceptDetail.slug, target: rel.id, type, color })
        } else {
          links.push({ source: conceptDetail.slug, target: rel.id, type, color })
        }
      })
    }

    addRelations(conceptDetail.upstream || [], 'upstream', '#94a3b8') // Slate 400
    addRelations(conceptDetail.parallel || [], 'parallel', '#06b6d4') // Cyan 500
    addRelations(conceptDetail.downstream || [], 'downstream', '#2dd4bf') // Teal 400

    return { nodes, links }
  }, [conceptDetail])

  return (
    <div 
      ref={containerRef} 
      className="concept-graph-container"
      style={{ width: '100%', height: '400px', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', overflow: 'hidden', position: 'relative', border: '1px solid var(--border)' }}
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
        onNodeClick={(node) => onNodeClick((node as GraphNode).id)}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = (node as GraphNode).name
          const fontSize = 12 / globalScale
          ctx.font = `${fontSize}px Inter, sans-serif`
          const textWidth = ctx.measureText(label).width
          const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2) as [number, number]

          // Shadow / Glow
          ctx.shadowColor = (node as GraphNode).color
          ctx.shadowBlur = 8 / globalScale
          
          // Draw circle
          ctx.fillStyle = (node as GraphNode).color
          ctx.beginPath()
          ctx.arc(node.x!, node.y!, 4, 0, 2 * Math.PI, false)
          ctx.fill()

          // Draw label
          ctx.shadowBlur = 0
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = 'var(--ink)'
          ctx.fillText(label, node.x!, node.y! + 8)
        }}
      />
      <div className="graph-hint" style={{ position: 'absolute', bottom: '12px', left: '12px', fontSize: '11px', color: 'var(--muted)', pointerEvents: 'none' }}>
        {lang === 'zh' ? '交互式关系图谱：拖动旋转，点击跳转' : 'Interactive Graph: Drag to rotate, Click to explore'}
      </div>
    </div>
  )
}
