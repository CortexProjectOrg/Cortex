import { BookOpen, Check, CheckCircle2, ChevronRight, GitBranch, Lock, Share2, X } from 'lucide-react';
import { LECTURE_MAP } from '../../lib/curriculumCatalog';
import { Link } from 'react-router-dom';
import type { GraphNode, KnowledgeDAG, computeNodeReadiness } from '../../lib/knowledgeGraph';

interface LectureDetailDrawerProps {
  selectedNode: GraphNode;
  selectedReadiness: ReturnType<typeof computeNodeReadiness>;
  dag: KnowledgeDAG;
  completedSet: Set<string>;
  onSelectNode: (id: string) => void;
  onClose: () => void;
  onToggleMastery: (nodeId: string) => void;
}

export function LectureDetailDrawer({
  selectedNode,
  selectedReadiness,
  dag,
  completedSet,
  onSelectNode,
  onClose,
  onToggleMastery
}: LectureDetailDrawerProps) {
  const isDone = selectedReadiness.status === 'completed';

  return (
    <aside
      style={{
        position: 'relative',

        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: '10px',
        padding: '24px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto'
      }}
    >
      {/* Drawer Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '16px'
        }}
      >
        <div>
          <span
            style={{
              display: 'inline-block',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '1px',
              padding: '3px 8px',
              borderRadius: '4px',
              background: 'var(--soft)',
              color: 'var(--accent)',
              marginBottom: '6px'
            }}
          >
            TOPIC {selectedNode.topicNumber} · LECTURE {String(selectedNode.lectureNumber).padStart(2, '0')}
          </span>
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: '20px', lineHeight: '1.25', margin: 0 }}>
            {selectedNode.title}
          </h3>
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="Close lecture details"
          style={{ width: '28px', height: '28px', minWidth: '28px' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Status & Action Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}
      >
        <Link
          to={`/topics/${selectedNode.topicId}/${selectedNode.id}`}
          className="button primary small"
          style={{ flex: 1, minHeight: '36px', fontSize: '11px', textDecoration: 'none' }}
        >
          <BookOpen size={14} /> Study Lecture
        </Link>
        <button
          type="button"
          className={`button small ${isDone ? 'soft' : 'secondary'}`}
          onClick={() => onToggleMastery(selectedNode.id)}
          style={{ minHeight: '36px', fontSize: '11px' }}
          title="Toggle completion status"
        >
          {isDone ? (
            <>
              <Check size={14} style={{ color: 'var(--accent)' }} /> Done
            </>
          ) : (
            'Mark done'
          )}
        </button>
      </div>

      {/* Core Question Callout */}
      <div
        style={{
          background: 'var(--bg)',
          borderLeft: '3px solid var(--accent)',
          padding: '12px 14px',
          borderRadius: '0 6px 6px 0',
          marginBottom: '20px'
        }}
      >
        <span
          style={{
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.8px',
            color: 'var(--accent)',
            display: 'block',
            marginBottom: '3px'
          }}
        >
          Key question
        </span>
        <p
          style={{
            fontSize: '12px',
            fontStyle: 'italic',
            fontFamily: 'var(--serif)',
            margin: 0,
            color: 'var(--ink)'
          }}
        >
          &ldquo;{selectedNode.question}&rdquo;
        </p>
      </div>

      {/* Metadata Badges */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          marginBottom: '22px',
          fontSize: '11px'
        }}
      >
        <div style={{ background: 'var(--bg)', padding: '8px 10px', borderRadius: '6px' }}>
          <span style={{ color: 'var(--muted)', display: 'block', fontSize: '9px' }}>TOPOLOGICAL RANK</span>
          <strong>Level {selectedNode.topologicalRank}</strong>
        </div>
        <div style={{ background: 'var(--bg)', padding: '8px 10px', borderRadius: '6px' }}>
          <span style={{ color: 'var(--muted)', display: 'block', fontSize: '9px' }}>EFFORT & PACK</span>
          <strong>
            ~{LECTURE_MAP.get(selectedNode.id)?.durationMinutes} min · Pack {selectedNode.packNumber}.
            {selectedNode.packSlot}
          </strong>
        </div>
      </div>

      {/* Direct Prerequisites Section */}
      <div style={{ marginBottom: '22px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.5px' }}>
            DIRECT PREREQUISITES ({selectedNode.prerequisites.length})
          </span>
          <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
            {selectedNode.prerequisites.length === 0
              ? 'Foundational Axiom'
              : `${selectedReadiness.percentReady}% Met`}
          </span>
        </div>

        {selectedNode.prerequisites.length === 0 ? (
          <div
            style={{
              background: '#eef4ec',
              border: '1px dashed #b9d3b7',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '11px',
              color: '#2d6a4f'
            }}
          >
            Root Concept: Requires no prior quantum or symplectic prerequisites.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {selectedNode.prerequisites.map((pId) => {
              const pNode = dag.nodes.get(pId);
              if (!pNode) return null;
              const isMet = completedSet.has(pId);

              return (
                <div
                  key={pId}
                  onClick={() => onSelectNode(pId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                    background: isMet ? '#f6faf4' : 'var(--bg)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    {isMet ? (
                      <CheckCircle2 size={14} style={{ color: '#2d6a4f', flexShrink: 0 }} />
                    ) : (
                      <Lock size={14} style={{ color: '#c27803', flexShrink: 0 }} />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        L{String(pNode.lectureNumber).padStart(2, '0')}: {pNode.title}
                      </div>
                      <span style={{ fontSize: '9px', color: 'var(--muted)' }}>
                        Topic {pNode.topicNumber} · Rank {pNode.topologicalRank}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--muted)' }} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Derived Prerequisites (Transitive) Section */}
      {selectedNode.derivedPrerequisites && selectedNode.derivedPrerequisites.length > 0 && (
        <div style={{ marginBottom: '22px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#9a6b18',
              letterSpacing: '0.5px',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <GitBranch size={13} />
            DERIVED PREREQUISITES (Transitive · {selectedNode.derivedPrerequisites.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {selectedNode.derivedPrerequisites.map((dpId) => {
              const dpNode = dag.nodes.get(dpId);
              if (!dpNode) return null;
              const isMet = completedSet.has(dpId);

              return (
                <div
                  key={dpId}
                  onClick={() => onSelectNode(dpId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px dashed #dfcbb5',
                    background: '#fffdfa',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    {isMet ? (
                      <CheckCircle2 size={13} style={{ color: '#2d6a4f', flexShrink: 0 }} />
                    ) : (
                      <Lock size={13} style={{ color: '#9a6b18', flexShrink: 0 }} />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: 'var(--ink)'
                        }}
                      >
                        L{String(dpNode.lectureNumber).padStart(2, '0')}: {dpNode.title}
                      </div>
                      <span style={{ fontSize: '8.5px', color: '#9a6b18' }}>
                        Implicit ancestor via direct chain
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={13} style={{ color: 'var(--muted)' }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Directly Unlocked Section */}
      <div style={{ marginBottom: '22px' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--ink)',
            letterSpacing: '0.5px',
            marginBottom: '10px'
          }}
        >
          DIRECTLY UNLOCKS ({selectedNode.unlockedLectures.length})
        </div>
        {selectedNode.unlockedLectures.length === 0 ? (
          <p style={{ fontSize: '11px', color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
            Terminal apex node in the curriculum tree.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {selectedNode.unlockedLectures.map((uId) => {
              const uNode = dag.nodes.get(uId);
              if (!uNode) return null;

              return (
                <div
                  key={uId}
                  onClick={() => onSelectNode(uId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                    background: 'var(--bg)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      L{String(uNode.lectureNumber).padStart(2, '0')}: {uNode.title}
                    </div>
                    <span style={{ fontSize: '9px', color: 'var(--muted)' }}>
                      Topic {uNode.topicNumber} · Rank {uNode.topologicalRank}
                    </span>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--muted)' }} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Derived Unlocks (Transitive) Section */}
      {selectedNode.derivedUnlocked && selectedNode.derivedUnlocked.length > 0 && (
        <div style={{ marginBottom: '22px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#9a6b18',
              letterSpacing: '0.5px',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <GitBranch size={13} />
            DERIVED UNLOCKS (Transitive · {selectedNode.derivedUnlocked.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {selectedNode.derivedUnlocked.map((duId) => {
              const duNode = dag.nodes.get(duId);
              if (!duNode) return null;

              return (
                <div
                  key={duId}
                  onClick={() => onSelectNode(duId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px dashed #dfcbb5',
                    background: '#fffdfa',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'var(--ink)'
                      }}
                    >
                      L{String(duNode.lectureNumber).padStart(2, '0')}: {duNode.title}
                    </div>
                    <span style={{ fontSize: '8.5px', color: '#9a6b18' }}>
                      Downstream successor via intermediate nodes
                    </span>
                  </div>
                  <ChevronRight size={13} style={{ color: 'var(--muted)' }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cross-Disciplinary Soft Links Section */}
      {selectedNode.softLinks.length > 0 && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#b07d2b',
              letterSpacing: '0.5px',
              marginBottom: '10px'
            }}
          >
            <Share2 size={13} />
            CROSS-FIELD SOFT LINKS ({selectedNode.softLinks.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {selectedNode.softLinks.map((link) => {
              const targetNode = dag.nodes.get(link.targetId);
              if (!targetNode) return null;

              return (
                <div
                  key={link.targetId}
                  onClick={() => onSelectNode(link.targetId)}
                  style={{
                    border: '1px solid #ebd8be',
                    background: '#fffdf9',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 650,
                      color: 'var(--ink)',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>
                      L{String(targetNode.lectureNumber).padStart(2, '0')}: {targetNode.title}
                    </span>
                    <span style={{ fontSize: '9px', color: '#b07d2b', fontWeight: 500 }}>
                      Topic {targetNode.topicNumber}
                    </span>
                  </div>
                  <p style={{ fontSize: '10.5px', color: 'var(--muted)', lineHeight: '1.5', margin: 0 }}>
                    {link.relationship}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
