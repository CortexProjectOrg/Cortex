import React from 'react';
import { CheckCircle2, Sparkles, Lock, Share2 } from 'lucide-react';
import type { GraphNode, computeNodeReadiness } from '../../lib/knowledgeGraph';

interface NodeCardProps {
  node: GraphNode;
  readiness: ReturnType<typeof computeNodeReadiness>;
  isSelected: boolean;
  onClick: () => void;
}

export function NodeCard({
  node,
  readiness,
  isSelected,
  onClick
}: NodeCardProps) {
  const isCompleted = readiness.status === 'completed';
  const isReady = readiness.status === 'ready';

  return (
    <div
      onClick={onClick}
      style={{
        border: `1.5px solid ${
          isSelected
            ? 'var(--accent)'
            : isCompleted
            ? '#b5cba8'
            : isReady
            ? '#a9c5eb'
            : 'var(--line)'
        }`,
        background: isSelected
          ? '#f4f8f2'
          : isCompleted
          ? '#fcfdfb'
          : 'var(--surface)',
        borderRadius: '8px',
        padding: '14px 15px',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
        boxShadow: isSelected ? '0 4px 14px rgba(58, 93, 73, 0.12)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      {/* Card Header: Node ID & Status Icon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}
      >
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.6px',
            color: 'var(--muted)'
          }}
        >
          L{String(node.lectureNumber).padStart(2, '0')} · RANK {node.topologicalRank}
        </span>

        {isCompleted ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              color: '#2d6a4f',
              fontWeight: 600
            }}
          >
            <CheckCircle2 size={13} /> Mastered
          </span>
        ) : isReady ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              color: '#1a73e8',
              fontWeight: 600
            }}
          >
            <Sparkles size={13} /> Ready
          </span>
        ) : (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              color: '#9e7b28',
              fontWeight: 600
            }}
          >
            <Lock size={12} /> {readiness.missingPrereqs.length} left
          </span>
        )}
      </div>

      {/* Card Title */}
      <h4
        style={{
          fontFamily: 'var(--serif)',
          fontSize: '15px',
          lineHeight: '1.3',
          margin: '0 0 6px',
          color: 'var(--ink)'
        }}
      >
        {node.title}
      </h4>

      <p
        style={{
          fontSize: '11px',
          color: 'var(--muted)',
          lineHeight: '1.45',
          margin: '0 0 12px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}
      >
        {node.subtitle}
      </p>

      {/* Card Footer: Prerequisite Counts & Soft Link Badges */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: '8px',
          borderTop: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: 'var(--muted)'
        }}
      >
        <span>
          {node.prerequisites.length} prereq{node.prerequisites.length === 1 ? '' : 's'} ·{' '}
          {node.unlockedLectures.length} unlock{node.unlockedLectures.length === 1 ? '' : 's'}
        </span>

        {node.softLinks.length > 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              color: '#b07d2b',
              fontWeight: 600,
              background: '#fcf3e6',
              padding: '1px 5px',
              borderRadius: '4px'
            }}
            title={`${node.softLinks.length} cross-field connections`}
          >
            <Share2 size={11} /> {node.softLinks.length}
          </span>
        )}
      </div>
    </div>
  );
}
