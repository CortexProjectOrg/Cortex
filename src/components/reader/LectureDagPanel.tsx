import React from 'react';
import { Link } from 'react-router-dom';
import { Network, ExternalLink, CheckCircle2, Lock, Share2, ChevronRight } from 'lucide-react';
import type { GraphNode, KnowledgeDAG, SoftLink } from '../../lib/knowledgeGraph';

interface LectureDagPanelProps {
  dagNode: GraphNode;
  dag: KnowledgeDAG;
  lectureId: string;
  completedLectures?: string[];
}

export function LectureDagPanel({
  dagNode,
  dag,
  lectureId,
  completedLectures = []
}: LectureDagPanelProps) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--line, #e2e4da)',
        borderRadius: '8px',
        padding: '18px 22px',
        marginBottom: '28px'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '1px',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Network size={14} /> KNOWLEDGE DAG POSITION & PREREQUISITES
          <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '10px' }}>
            (Topological Rank {dagNode.topologicalRank})
          </span>
        </div>
        <Link
          to={`/tree?focus=${lectureId}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            color: 'var(--accent)',
            fontWeight: 600,
            textDecoration: 'none'
          }}
        >
          View in Knowledge DAG <ExternalLink size={12} />
        </Link>
      </div>

      {/* Hard Prerequisites */}
      <div style={{ marginBottom: dagNode.unlockedLectures.length > 0 || dagNode.softLinks.length > 0 ? '12px' : 0 }}>
        <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
          HARD PREREQUISITES {dagNode.prerequisites.length === 0 ? '(Foundational Bedrock · No Prerequisites)' : `(${dagNode.prerequisites.length})`}:
        </span>
        {dagNode.prerequisites.length === 0 ? (
          <span style={{ fontSize: '11px', color: '#2d6a4f', fontStyle: 'italic' }}>
            Axiomatic starting point. Mastered directly from first principles.
          </span>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {dagNode.prerequisites.map((pId: string) => {
              const pNode = dag.nodes.get(pId);
              if (!pNode) return null;
              const isDone = completedLectures.includes(pId);
              return (
                <Link
                  key={pId}
                  to={`/topics/${pNode.topicId}/${pNode.id}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 9px',
                    borderRadius: '5px',
                    fontSize: '11px',
                    background: isDone ? '#eef4ec' : '#faf5e8',
                    border: `1px solid ${isDone ? '#c5ddc0' : '#e6d3a8'}`,
                    color: isDone ? '#2d6a4f' : '#8f640b',
                    textDecoration: 'none'
                  }}
                >
                  {isDone ? <CheckCircle2 size={12} /> : <Lock size={12} />}
                  <span>L{String(pNode.lectureNumber).padStart(2, '0')}: {pNode.title}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Directly Unlocked */}
      {dagNode.unlockedLectures.length > 0 && (
        <div style={{ marginBottom: (dagNode.derivedUnlocked?.length || 0) > 0 || dagNode.softLinks.length > 0 ? '12px' : 0 }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
            DIRECTLY UNLOCKS ({dagNode.unlockedLectures.length}):
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {dagNode.unlockedLectures.slice(0, 6).map((uId: string) => {
              const uNode = dag.nodes.get(uId);
              if (!uNode) return null;
              return (
                <Link
                  key={uId}
                  to={`/topics/${uNode.topicId}/${uNode.id}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '5px',
                    fontSize: '10.5px',
                    background: 'var(--bg)',
                    border: '1px solid var(--line)',
                    color: 'var(--ink)',
                    textDecoration: 'none'
                  }}
                >
                  <span>L{String(uNode.lectureNumber).padStart(2, '0')}: {uNode.title}</span>
                </Link>
              );
            })}
            {dagNode.unlockedLectures.length > 6 && (
              <span style={{ fontSize: '10.5px', color: 'var(--muted)', alignSelf: 'center' }}>
                +{dagNode.unlockedLectures.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Derived Downstream Unlocks */}
      {dagNode.derivedUnlocked && dagNode.derivedUnlocked.length > 0 && (
        <div style={{ marginBottom: dagNode.softLinks.length > 0 ? '12px' : 0 }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#b45309', display: 'block', marginBottom: '6px' }}>
            DERIVED UNLOCKS (Transitive · {dagNode.derivedUnlocked.length}):
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {dagNode.derivedUnlocked.slice(0, 6).map((uId: string) => {
              const uNode = dag.nodes.get(uId);
              if (!uNode) return null;
              return (
                <Link
                  key={uId}
                  to={`/topics/${uNode.topicId}/${uNode.id}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '5px',
                    fontSize: '10.5px',
                    background: '#fffbf0',
                    border: '1px dashed #d97706',
                    color: '#92400e',
                    textDecoration: 'none'
                  }}
                  title="Indirectly enabled through intermediate lectures"
                >
                  <span>L{String(uNode.lectureNumber).padStart(2, '0')}: {uNode.title}</span>
                </Link>
              );
            })}
            {dagNode.derivedUnlocked.length > 6 && (
              <span style={{ fontSize: '10.5px', color: 'var(--muted)', alignSelf: 'center' }}>
                +{dagNode.derivedUnlocked.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Cross-Disciplinary Soft Links */}
      {dagNode.softLinks.length > 0 && (
        <div>
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#b07d2b', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
            <Share2 size={11} /> CROSS-FIELD SOFT LINKS ({dagNode.softLinks.length}):
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {dagNode.softLinks.map((link: SoftLink) => {
              const targetNode = dag.nodes.get(link.targetId);
              if (!targetNode) return null;
              return (
                <div
                  key={link.targetId}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: '#fefcf8',
                    border: '1px solid #ebd8be',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--ink)', marginRight: '6px' }}>
                      ↔ L{String(targetNode.lectureNumber).padStart(2, '0')} ({targetNode.title}):
                    </strong>
                    <span style={{ color: 'var(--muted)' }}>{link.relationship}</span>
                  </div>
                  <Link
                    to={`/topics/${targetNode.topicId}/${targetNode.id}`}
                    style={{
                      color: 'var(--accent)',
                      fontSize: '10px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      textDecoration: 'none',
                      flexShrink: 0
                    }}
                  >
                    Explore <ChevronRight size={10} style={{ verticalAlign: 'middle' }} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
