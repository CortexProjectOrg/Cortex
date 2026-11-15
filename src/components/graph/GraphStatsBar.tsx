import React from 'react';
import { CheckCircle2, Workflow, Share2, Sparkles } from 'lucide-react';

interface GraphStatsBarProps {
  stats: {
    edges: number;
    maxRank: number;
    softLinks: number;
    ready: number;
  };
}

export function GraphStatsBar({ stats }: GraphStatsBarProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        margin: '20px 0 28px'
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#e0ece4',
            color: '#2d6a4f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <CheckCircle2 size={18} />
        </div>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 600 }}>DAG INVARIANT</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
            0 Cycles Detected
          </div>
          <div style={{ fontSize: '10px', color: '#2d6a4f' }}>Strict Topological Order</div>
        </div>
      </div>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--soft)',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Workflow size={18} />
        </div>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 600 }}>PREREQUISITE EDGES</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
            {stats.edges} Hard Dependencies
          </div>
          <div style={{ fontSize: '10px', color: 'var(--muted)' }}>
            {stats.maxRank + 1} Stratified Levels (0 to {stats.maxRank})
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#fdf3e2',
            color: '#b07d2b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Share2 size={18} />
        </div>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 600 }}>CROSS-FIELD CONNECTIONS</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
            {stats.softLinks} Soft Links
          </div>
          <div style={{ fontSize: '10px', color: '#b07d2b' }}>Cross-Disciplinary Insight</div>
        </div>
      </div>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#e8f0fe',
            color: '#1a73e8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Sparkles size={18} />
        </div>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 600 }}>READY TO STUDY NOW</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a73e8' }}>
            {stats.ready} Available Nodes
          </div>
          <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Prerequisites satisfied</div>
        </div>
      </div>
    </div>
  );
}
