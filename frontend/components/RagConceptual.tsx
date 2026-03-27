import React from 'react';
import { Layers, ArrowRight, ChevronsRight } from 'lucide-react';

export default function RagConceptual() {
  return (
    <div className="rag-conceptual-container">
      <style>{`
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
        <div className="card" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'linear-gradient(to right, var(--card), var(--surface))', borderLeft: '4px solid var(--teal)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)'}}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--teal-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Layers size={16} color="var(--teal)" />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--teal)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Overview</div>
            <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--ink2)', margin: 0 }}>
              <strong>RAG (Retrieval-Augmented Generation)</strong> is a method that enhances Large Language Models (LLMs) by retrieving external knowledge from a database before generating an answer. It grounds AI responses in factual, up-to-date information.
            </p>
          </div>
        </div>

        {/* 2. Path Exploration Area */}
        <div className="card" style={{ padding: '20px', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--ink)', fontSize: '16px', fontWeight: 600 }}>
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

        {/* 3. Solutions Area */}
        <div className="card" style={{ padding: '20px', background: 'var(--ink)', color: '#fff', borderRadius: '12px', border: '1px solid var(--ink)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#fff', fontSize: '16px', fontWeight: 600 }}>
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
  );
}
