'use client';

import React, { useState } from 'react';
import { Search, ArrowRight, Database, Cpu, Layers, Link as LinkIcon, ChevronsRight } from 'lucide-react';

export default function RagDemo() {
  const [query, setQuery] = useState('What is RAG?');
  const [activeNode, setActiveNode] = useState('RAG');

  const handleSearch = (e) => {
    e.preventDefault();
    // In MVP, this just resets the state or could trigger an animation
    setActiveNode('RAG');
  };

  return (
    <div className="velamap-container" style={styles.container}>
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
        
        /* Arrow heads */
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
      `}</style>

      {/* 1. Header & Input Area */}
      <div style={styles.header}>
        <div style={{ marginBottom: '24px' }}>
          <div style={styles.pageTitle}>RAG Knowledge Map</div>
          <div style={styles.pageSub}>Understand how Retrieval-Augmented Generation works</div>
        </div>
        
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <Search size={18} style={styles.searchIcon} />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question to generate a knowledge map..."
            style={styles.searchInput}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>Map it</button>
        </form>
      </div>

      {/* 2. AI Brief Answer Area */}
      <div className="card" style={styles.aiBriefCard}>
        <div style={styles.aiIconWrapper}>
          <Layers size={16} color="var(--teal)" />
        </div>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--teal)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Overview</div>
          <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--ink2)', margin: 0 }}>
            <strong>RAG (Retrieval-Augmented Generation)</strong> is a method that enhances Large Language Models (LLMs) by retrieving external knowledge from a database before generating an answer. It grounds AI responses in factual, up-to-date information.
          </p>
        </div>
      </div>

      <div style={styles.twoColLayout}>
        {/* 3. Graph Core Area */}
        <div className="card" style={styles.graphSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Knowledge Structure</h3>
            <span className="badge badge-teal">Interactive</span>
          </div>
          
          <div style={styles.graphCanvas}>
            {/* The nodes and edges */}
            <div style={{ position: 'relative', width: '100%', height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              
              {/* Edges */}
              {/* Embedding -> RAG */}
              <div className="velamap-edge edge-h edge-right" style={{ width: '60px', left: '26%', top: '35%' }}></div>
              {/* LLM -> RAG (backwards pointing to RAG or LLM using RAG) */}
              <div className="velamap-edge edge-h edge-left" style={{ width: '60px', right: '27%', top: '35%' }}></div>
              {/* RAG -> Retriever */}
              <div className="velamap-edge edge-v edge-down" style={{ height: '50px', left: '50%', top: '44%' }}></div>
              {/* Retriever -> Vector DB */}
              <div className="velamap-edge edge-v edge-up" style={{ height: '40px', left: '50%', bottom: '22%' }}></div>

              {/* Nodes */}
              {/* Embedding Model */}
              <div 
                className={`velamap-graph-node ${activeNode === 'Embedding' ? 'active' : ''}`}
                style={{ position: 'absolute', left: '8%', top: '28%' }}
                onClick={() => setActiveNode('Embedding')}
              >
                <LinkIcon size={16} className="node-icon" color="var(--muted)" />
                Embedding
              </div>

              {/* RAG (Core) */}
              <div 
                className={`velamap-graph-node ${activeNode === 'RAG' ? 'active' : ''}`}
                style={{ position: 'absolute', left: '50%', top: '35%', transform: 'translate(-50%, -50%)', padding: '16px 24px', fontSize: '16px', fontWeight: 600 }}
                onClick={() => setActiveNode('RAG')}
              >
                <Layers size={20} className="node-icon" color={activeNode === 'RAG' ? "var(--teal)" : "var(--muted)"} />
                RAG 
              </div>

              {/* LLM */}
              <div 
                className={`velamap-graph-node ${activeNode === 'LLM' ? 'active' : ''}`}
                style={{ position: 'absolute', right: '8%', top: '28%' }}
                onClick={() => setActiveNode('LLM')}
              >
                <Cpu size={16} className="node-icon" color="var(--muted)" />
                LLM
              </div>

              {/* Retriever */}
              <div 
                className={`velamap-graph-node ${activeNode === 'Retriever' ? 'active' : ''}`}
                style={{ position: 'absolute', left: '50%', top: '65%', transform: 'translate(-50%, -50%)' }}
                onClick={() => setActiveNode('Retriever')}
              >
                <Search size={16} className="node-icon" color="var(--muted)" />
                Retriever
              </div>

              {/* Vector DB */}
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

        <div style={styles.rightLayout}>
          {/* 4. Path Exploration Area */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--ink)' }}>
              Explore Next <ArrowRight size={16} color="var(--teal)" />
            </h3>
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

          {/* 5. Solutions Area */}
          <div className="card" style={{ padding: '20px', background: 'var(--ink)', color: '#fff', borderColor: 'var(--ink)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#fff' }}>
              Recommended Tools <ArrowRight size={16} color="var(--teal-mid)" />
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Vector Databases</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '6px 12px' }}>Pinecone</span>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '6px 12px' }}>Weaviate</span>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '6px 12px' }}>Supabase via pgvector</span>
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
    </div>
  );
}

const styles = {
  container: {
    padding: '32px 36px',
    maxWidth: '1200px',
    margin: '0 auto',
    minHeight: '100%',
  },
  header: {
    marginBottom: '24px',
  },
  pageTitle: {
    fontFamily: '"Noto Serif SC", serif',
    fontSize: '28px',
    fontWeight: 600,
    color: 'var(--ink, #1a1a2e)',
    marginBottom: '6px',
  },
  pageSub: {
    fontSize: '14px',
    color: 'var(--muted, #8888aa)',
  },
  searchForm: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--card, #fff)',
    border: '1px solid var(--border, #e8e8f0)',
    borderRadius: '12px',
    padding: '6px 6px 6px 16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
    maxWidth: '600px',
  },
  searchIcon: {
    color: 'var(--muted)',
    marginRight: '10px',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '15px',
    color: 'var(--ink)',
    background: 'transparent',
  },
  aiBriefCard: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    marginBottom: '24px',
    background: 'linear-gradient(to right, var(--card), var(--surface))',
    borderLeft: '4px solid var(--teal)',
  },
  aiIconWrapper: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'var(--teal-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  twoColLayout: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '24px',
    alignItems: 'start',
  },
  graphSection: {
    minHeight: '400px',
    display: 'flex',
    flexDirection: 'column',
  },
  graphCanvas: {
    flex: 1,
    background: 'var(--surface)',
    borderRadius: '8px',
    border: '1px dashed var(--border2)',
    position: 'relative',
    overflow: 'hidden',
  },
  rightLayout: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  }
};
