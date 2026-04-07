import React, { useState } from 'react';
import { Layers, ArrowRight, ChevronsRight, Search, Database, Cpu, Link as LinkIcon } from 'lucide-react';

export default function RagConceptual() {
  const [activeNode, setActiveNode] = useState('RAG');

  return (
    <div className="rag-conceptual-container">
      <style>{`
        .velamap-graph-node {
          padding: 12px 20px;
          border-radius: 8px;
          background: var(--card, #fff);
          border: 1px solid var(--border, #e8e8f0);
          font-size: 14px;
          font-weight: 500;
          color: var(--ink, #1a1a2e);
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          z-index: 2;
        }
        .velamap-graph-node:hover {
          border-color: var(--teal, #048a81);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(4, 138, 129, 0.1);
        }
        .velamap-graph-node.active {
          background: var(--teal-light, #e0f5f3);
          border-color: var(--teal, #048a81);
          color: var(--teal, #048a81);
          box-shadow: 0 0 0 2px rgba(4, 138, 129, 0.2);
        }
        .velamap-graph-node.active .node-icon {
          color: var(--teal, #048a81);
        }
        .velamap-edge {
          position: absolute;
          background: var(--border2, #d0d0e0);
          z-index: 1;
        }
        .velamap-edge::after {
          content: '';
          position: absolute;
          width: 0;
          height: 0;
          border-style: solid;
        }
        .edge-h { height: 2px; }
        .edge-v { width: 2px; }
        .edge-right::after {
          right: -4px; top: -3px;
          border-width: 4px 0 4px 6px;
          border-color: transparent transparent transparent var(--border2, #d0d0e0);
        }
        .edge-left::after {
          left: -4px; top: -3px;
          border-width: 4px 6px 4px 0;
          border-color: transparent var(--border2, #d0d0e0) transparent transparent;
        }
        .edge-down::after {
          bottom: -4px; left: -3px;
          border-width: 6px 4px 0 4px;
          border-color: var(--border2, #d0d0e0) transparent transparent transparent;
        }
        .edge-up::after {
          top: -4px; left: -3px;
          border-width: 0 4px 6px 4px;
          border-color: transparent transparent var(--border2, #d0d0e0) transparent;
        }

        .path-card {
          padding: 16px;
          border-radius: 12px;
          background: var(--card, #fff);
          border: 1px solid var(--border, #e8e8f0);
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .path-card:hover {
          border-color: var(--teal, #048a81);
          background: var(--surface, #f8f8fc);
        }
        .path-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--ink, #1a1a2e);
          margin-bottom: 4px;
        }
        .path-desc {
          font-size: 12px;
          color: var(--muted, #8888aa);
        }
        .badge {
          display: inline-block;
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 20px;
          font-weight: 500;
          letter-spacing: .03em;
        }
      `}</style>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* 1. AI Brief Answer Area */}
        <h2 id="ai-overview" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={20} color="var(--teal)" /> AI Overview
        </h2>
        <div className="card" style={{ marginBottom: '32px', display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'linear-gradient(to right, var(--card), var(--surface))', borderLeft: '4px solid var(--teal)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)'}}>
          <div>
            <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--ink2)', margin: 0 }}>
              <strong>RAG (Retrieval-Augmented Generation)</strong> is a method that enhances Large Language Models (LLMs) by retrieving external knowledge from a database before generating an answer. It grounds AI responses in factual, up-to-date information.
            </p>
          </div>
        </div>

        {/* 1.5 Graph Core Area (Moved from page.jsx) */}
        <h2 id="knowledge-structure" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
          <span>Knowledge Structure</span>
          <span className="badge" style={{ fontSize: '12px', background: 'var(--teal-light)', color: 'var(--teal)', padding: '4px 8px', borderRadius: '12px' }}>Interactive</span>
        </h2>
        <div className="card" style={{ marginBottom: '32px', minHeight: '400px', display: 'flex', flexDirection: 'column', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', padding: '20px' }}>

          <div style={{ flex: 1, background: 'var(--surface)', borderRadius: '8px', border: '1px dashed var(--border2)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'relative', width: '100%', height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Edges */}
              <div className="velamap-edge edge-h edge-right" style={{ width: '60px', left: '26%', top: '35%' }}></div>
              <div className="velamap-edge edge-h edge-left" style={{ width: '60px', right: '27%', top: '35%' }}></div>
              <div className="velamap-edge edge-v edge-down" style={{ height: '50px', left: '50%', top: '44%' }}></div>
              <div className="velamap-edge edge-v edge-up" style={{ height: '40px', left: '50%', bottom: '22%' }}></div>

              {/* Nodes */}
              <div
                className={`velamap-graph-node ${activeNode === 'Embedding' ? 'active' : ''}`}
                style={{ position: 'absolute', left: '8%', top: '28%' }}
                onClick={() => setActiveNode('Embedding')}
              >
                <LinkIcon size={16} className="node-icon" color="var(--muted)" />
                Embedding
              </div>

              <div
                className={`velamap-graph-node ${activeNode === 'RAG' ? 'active' : ''}`}
                style={{ position: 'absolute', left: '50%', top: '35%', transform: 'translate(-50%, -50%)', padding: '16px 24px', fontSize: '16px', fontWeight: 600 }}
                onClick={() => setActiveNode('RAG')}
              >
                <Layers size={20} className="node-icon" color={activeNode === 'RAG' ? "var(--teal)" : "var(--muted)"} />
                RAG
              </div>

              <div
                className={`velamap-graph-node ${activeNode === 'LLM' ? 'active' : ''}`}
                style={{ position: 'absolute', right: '8%', top: '28%' }}
                onClick={() => setActiveNode('LLM')}
              >
                <Cpu size={16} className="node-icon" color="var(--muted)" />
                LLM
              </div>

              <div
                className={`velamap-graph-node ${activeNode === 'Retriever' ? 'active' : ''}`}
                style={{ position: 'absolute', left: '50%', top: '65%', transform: 'translate(-50%, -50%)' }}
                onClick={() => setActiveNode('Retriever')}
              >
                <Search size={16} className="node-icon" color="var(--muted)" />
                Retriever
              </div>

              <div
                className={`velamap-graph-node ${activeNode === 'Vector DB' ? 'active' : ''}`}
                style={{ position: 'absolute', left: '50%', bottom: '8%', transform: 'translate(-50%, 0)' }}
                onClick={() => setActiveNode('Vector DB')}
              >
                <Database size={16} className="node-icon" color="var(--muted)" />
                Vector DB
              </div>

              {/* Tooltip for active node */}
              <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--surface)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', maxWidth: '180px', fontSize: '11px', color: 'var(--ink2)', opacity: 0.9 }}>
                {activeNode === 'RAG' && "Core architecture combining retrieval and generation."}
                {activeNode === 'Embedding' && "Converts text into numerical vectors for similarity search."}
                {activeNode === 'LLM' && "Generates human-like text based on the retrieved context."}
                {activeNode === 'Vector DB' && "Stores and efficiently queries high-dimensional vectors."}
                {activeNode === 'Retriever' && "Fetches the most relevant context from the Vector DB."}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Path Exploration Area */}
        <h2 id="explore-next" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Explore Next <ArrowRight size={20} color="var(--teal)" />
        </h2>
        <div className="card" style={{ marginBottom: '32px', padding: '20px', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="path-card">
              <div>
                <div className="path-title">RAG vs Fine-tuning</div>
                <div className="path-desc">When to use which approach</div>
              </div>
              <ChevronsRight size={16} color="var(--muted)" />
            </div>
            <div className="path-card">
              <div>
                <div className="path-title">RAG Architecture</div>
                <div className="path-desc">Deep dive into components</div>
              </div>
              <ChevronsRight size={16} color="var(--muted)" />
            </div>
            <div className="path-card">
              <div>
                <div className="path-title">Build Your First System</div>
                <div className="path-desc">Step-by-step implementation guide</div>
              </div>
              <ChevronsRight size={16} color="var(--muted)" />
            </div>
          </div>
        </div>

        {/* 3. Solutions Area */}
        <h2 id="recommended-tools" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Recommended Tools <ArrowRight size={20} color="var(--teal)" />
        </h2>
        <div className="card" style={{ marginBottom: '32px', padding: '20px', background: 'var(--ink)', color: '#fff', borderRadius: '12px', border: '1px solid var(--ink)' }}>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Vector Databases</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '6px 12px' }}>Pinecone</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '6px 12px' }}>Weaviate</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '6px 12px' }}>Qdrant</span>
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>LLM Providers</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '6px 12px' }}>OpenAI</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '6px 12px' }}>Anthropic</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
