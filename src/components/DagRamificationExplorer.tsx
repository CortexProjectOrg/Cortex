import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Lock,
  Sparkles,
  Share2,
  ChevronRight,
  Workflow,
  Network,
  Layers,
  Check
} from 'lucide-react';
import {
  type GraphNode,
  type KnowledgeDAG,
  type LectureRamification,
  type TopicRamification,
  getLectureRamification,
  getTopicRamification,
  computeNodeReadiness
} from '../lib/knowledgeGraph';
import { TOPICS } from '../lib/curriculum';

interface DagRamificationExplorerProps {
  dag: KnowledgeDAG;
  selectedNodeId: string;
  onSelectNode: (id: string) => void;
  selectedTopicId: string;
  onSelectTopic: (topicId: string) => void;
  completedSet: Set<string>;
  onToggleMastery: (id: string) => void;
}

export function DagRamificationExplorer({
  dag,
  selectedNodeId,
  onSelectNode,
  selectedTopicId,
  onSelectTopic,
  completedSet,
  onToggleMastery
}: DagRamificationExplorerProps) {
  const lectureRamification = getLectureRamification(selectedNodeId, completedSet, dag);
  const topicRamification = getTopicRamification(selectedTopicId, dag);

  if (!lectureRamification || !topicRamification) {
    return null;
  }

  const focalNode = lectureRamification.node;
  const isFocalCompleted = completedSet.has(focalNode.id);
  const focalReadiness = computeNodeReadiness(focalNode.id, completedSet);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Topic Switcher Bar */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: '9px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.8px', marginRight: '4px' }}>
          SELECT TOPIC:
        </span>
        {TOPICS.map(topic => {
          const isSelected = selectedTopicId === topic.id;
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => {
                onSelectTopic(topic.id);
                // Also select first lecture of that topic
                const firstLecture = dag.nodeList.find(n => n.topicId === topic.id);
                if (firstLecture) onSelectNode(firstLecture.id);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: isSelected ? 700 : 500,
                background: isSelected ? 'var(--soft)' : 'none',
                border: `1px solid ${isSelected ? 'var(--accent)' : 'transparent'}`,
                color: isSelected ? 'var(--accent)' : 'var(--ink)',
                cursor: 'pointer'
              }}
            >
              <span className={`chapter-dot ${topic.color}`} style={{ width: '18px', height: '18px', fontSize: '9px' }}>
                {topic.number}
              </span>
              <span>{topic.title}</span>
            </button>
          );
        })}
      </div>

      {/* Topic-Level Ramification Banner */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: '10px',
          padding: '20px 24px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <span className="eyebrow" style={{ color: 'var(--accent)' }}>
              TOPIC RAMIFICATION VIEW · TOPIC {topicRamification.topic.number}
            </span>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '24px', margin: '4px 0 6px' }}>
              {topicRamification.topic.title}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
              {topicRamification.topic.subtitle}
            </p>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', background: 'var(--bg)', padding: '6px 12px', borderRadius: '6px' }}>
            <strong>{topicRamification.lectures.length}</strong> Monothematic Lectures ·{' '}
            <strong>{topicRamification.prerequisiteTopics.length}</strong> Upstream Topics ·{' '}
            <strong>{topicRamification.nextTopics.length}</strong> Next Topics Unlocked
          </div>
        </div>

        {/* 3-Part Flow: Prerequisite Topics -> Internal Lectures -> Next Topics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(220px, 1fr) minmax(260px, 1.2fr) minmax(220px, 1fr)',
            gap: '16px',
            alignItems: 'stretch'
          }}
        >
          {/* Incoming Topics */}
          <div
            style={{
              background: '#f8faf7',
              border: '1px solid #dce8d8',
              borderRadius: '8px',
              padding: '14px'
            }}
          >
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#2d6a4f', letterSpacing: '0.6px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={13} /> PREREQUISITE TOPICS
            </div>
            {topicRamification.prerequisiteTopics.length === 0 ? (
              <p style={{ fontSize: '11px', color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
                Foundational Starting Bedrock. No prior quantum topics required.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {topicRamification.prerequisiteTopics.map(pt => (
                  <div
                    key={pt.topic.id}
                    onClick={() => {
                      onSelectTopic(pt.topic.id);
                      if (pt.samplePrereqs[0]) onSelectNode(pt.samplePrereqs[0].id);
                    }}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: 650 }}>
                      <span>Topic {pt.topic.number}: {pt.topic.title}</span>
                      <span style={{ fontSize: '9.5px', color: '#2d6a4f' }}>{pt.crossEdgesCount} edges</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Topic Internal Lectures */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1.5px solid var(--accent)',
              borderRadius: '8px',
              padding: '14px'
            }}
          >
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.6px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={13} /> INTERNAL PROGRESSION ({topicRamification.lectures.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {topicRamification.lectures.map(node => {
                const isSelected = selectedNodeId === node.id;
                const isDone = completedSet.has(node.id);
                return (
                  <div
                    key={node.id}
                    onClick={() => onSelectNode(node.id)}
                    style={{
                      background: isSelected ? 'var(--soft)' : 'var(--bg)',
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--line)'}`,
                      borderRadius: '6px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      {isDone ? (
                        <CheckCircle2 size={12} style={{ color: '#2d6a4f', flexShrink: 0 }} />
                      ) : (
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', border: '1px solid var(--muted)', display: 'inline-block', flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: '11px', fontWeight: isSelected ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        L{String(node.lectureNumber).padStart(2, '0')}: {node.title}
                      </span>
                    </div>
                    <span style={{ fontSize: '9px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      Rank {node.topologicalRank}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Outgoing Next Topics */}
          <div
            style={{
              background: '#f4f8fe',
              border: '1px solid #d4e2f9',
              borderRadius: '8px',
              padding: '14px'
            }}
          >
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#1a73e8', letterSpacing: '0.6px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              NEXT TOPICS UNLOCKED <ArrowRight size={13} />
            </div>
            {topicRamification.nextTopics.length === 0 ? (
              <p style={{ fontSize: '11px', color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
                Apex Frontier Topic.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {topicRamification.nextTopics.map(nt => (
                  <div
                    key={nt.topic.id}
                    onClick={() => {
                      onSelectTopic(nt.topic.id);
                      if (nt.sampleUnlocked[0]) onSelectNode(nt.sampleUnlocked[0].id);
                    }}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: 650 }}>
                      <span>Topic {nt.topic.number}: {nt.topic.title}</span>
                      <span style={{ fontSize: '9.5px', color: '#1a73e8' }}>{nt.crossEdgesCount} links</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monothematic Lecture Ramification Tripartite Explorer */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: '10px',
          padding: '24px'
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <span className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Workflow size={13} /> ACTIVE LECTURE RAMIFICATION EXPLORER
          </span>
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: '22px', margin: '4px 0 4px' }}>
            L{String(focalNode.lectureNumber).padStart(2, '0')}: {focalNode.title}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
            Inspect the exact branches that must be mastered before this lecture, and the downstream concepts that branch out from it.
          </p>
        </div>

        {/* 3 Columns: Upstream Prerequisites | Focal Node | Downstream Next Topics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 1.2fr) minmax(280px, 1fr)',
            gap: '20px',
            alignItems: 'start'
          }}
        >
          {/* Upstream Dependencies Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '8px',
                borderBottom: '2px solid #10b981'
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={14} /> UPSTREAM PREREQUISITES
              </span>
              <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                {focalNode.allPrerequisites.length} total ancestors
              </span>
            </div>

            {/* Direct Prerequisites */}
            <div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                DIRECT PREREQUISITES ({focalNode.prerequisites.length}):
              </span>
              {focalNode.prerequisites.length === 0 ? (
                <div style={{ background: '#f4fbf5', border: '1px solid #c9ebd0', padding: '10px 12px', borderRadius: '6px', fontSize: '11px', color: '#2d6a4f' }}>
                  Axiomatic Bedrock: Requires no prior quantum or symplectic concepts.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {lectureRamification.directPrerequisites.map(parent => {
                    const isParentDone = completedSet.has(parent.id);
                    return (
                      <div
                        key={parent.id}
                        onClick={() => onSelectNode(parent.id)}
                        style={{
                          background: isParentDone ? '#f8fdf9' : 'var(--bg)',
                          border: `1.5px solid ${isParentDone ? '#a3d9b0' : 'var(--line)'}`,
                          borderRadius: '8px',
                          padding: '10px 12px',
                          cursor: 'pointer',
                          transition: 'border-color 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)' }}>
                            L{String(parent.lectureNumber).padStart(2, '0')} · Topic {parent.topicNumber}
                          </span>
                          {isParentDone ? (
                            <span style={{ fontSize: '9.5px', color: '#2d6a4f', fontWeight: 650, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <CheckCircle2 size={11} /> Mastered
                            </span>
                          ) : (
                            <span style={{ fontSize: '9.5px', color: '#c27803', fontWeight: 650, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <Lock size={10} /> Incomplete
                            </span>
                          )}
                        </div>
                        <h4 style={{ fontFamily: 'var(--serif)', fontSize: '13px', margin: '0 0 4px', color: 'var(--ink)' }}>
                          {parent.title}
                        </h4>
                        <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 600 }}>
                          Click to explore upstream branch →
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Secondary Ancestors */}
            {lectureRamification.ancestorTiers.length > 1 && (
              <div>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                  SECONDARY FOUNDATIONS ({lectureRamification.ancestorTiers[1].nodes.length}):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {lectureRamification.ancestorTiers[1].nodes.map(node => (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => onSelectNode(node.id)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '5px',
                        fontSize: '10.5px',
                        background: 'var(--bg)',
                        border: '1px solid var(--line)',
                        color: 'var(--ink)',
                        cursor: 'pointer'
                      }}
                    >
                      L{String(node.lectureNumber).padStart(2, '0')}: {node.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Focal Node Column */}
          <div
            style={{
              background: '#f9faf7',
              border: '2px solid var(--accent)',
              borderRadius: '10px',
              padding: '20px',
              boxShadow: '0 6px 20px rgba(58, 93, 73, 0.08)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  background: 'var(--soft)',
                  color: 'var(--accent)',
                  padding: '3px 8px',
                  borderRadius: '4px'
                }}
              >
                ACTIVE FOCAL HUB
              </span>
              <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--muted)' }}>
                Topological Rank {focalNode.topologicalRank}
              </span>
            </div>

            <h3 style={{ fontFamily: 'var(--serif)', fontSize: '20px', lineHeight: '1.25', margin: '0 0 8px' }}>
              {focalNode.title}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: '1.6', marginBottom: '16px' }}>
              {focalNode.subtitle}
            </p>

            {/* Core Question */}
            <div
              style={{
                background: 'var(--surface)',
                borderLeft: '3px solid var(--accent)',
                padding: '10px 14px',
                borderRadius: '0 6px 6px 0',
                marginBottom: '18px'
              }}
            >
              <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.8px', display: 'block', marginBottom: '2px' }}>
                MONOTHEMATIC QUESTION
              </span>
              <p style={{ fontSize: '12px', fontFamily: 'var(--serif)', fontStyle: 'italic', margin: 0, color: 'var(--ink)' }}>
                &ldquo;{focalNode.question}&rdquo;
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <Link
                to={`/topics/${focalNode.topicId}/${focalNode.id}`}
                className="button primary small"
                style={{ flex: 1, minHeight: '36px', fontSize: '11px', textDecoration: 'none' }}
              >
                <BookOpen size={14} /> Study Lecture
              </Link>
              <button
                type="button"
                className={`button small ${isFocalCompleted ? 'soft' : 'secondary'}`}
                style={{ minHeight: '36px', fontSize: '11px' }}
                onClick={() => onToggleMastery(focalNode.id)}
              >
                {isFocalCompleted ? (
                  <>
                    <Check size={14} style={{ color: 'var(--accent)' }} /> Mastered
                  </>
                ) : (
                  'Mark Mastered'
                )}
              </button>
            </div>

            {/* Cross-Disciplinary Soft Links */}
            {focalNode.softLinks.length > 0 && (
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: '14px', marginTop: '14px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#b07d2b', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                  <Share2 size={12} /> CROSS-FIELD CONTAMINATION / SOFT LINKS:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {lectureRamification.softLinks.map(link => (
                    <div
                      key={link.targetNode.id}
                      onClick={() => onSelectNode(link.targetNode.id)}
                      style={{
                        background: '#fffdf9',
                        border: '1px solid #edd9bf',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      <strong style={{ color: 'var(--ink)' }}>
                        ↔ L{String(link.targetNode.lectureNumber).padStart(2, '0')}: {link.targetNode.title}
                      </strong>
                      <p style={{ margin: '3px 0 0', fontSize: '10px', color: 'var(--muted)', lineHeight: '1.4' }}>
                        {link.relationship}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Downstream Unlocked / Next Topics Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '8px',
                borderBottom: '2px solid #3b82f6'
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                DOWNSTREAM NEXT TOPICS <ArrowRight size={14} />
              </span>
              <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                {focalNode.allUnlocked.length} total unlocked
              </span>
            </div>

            {/* Direct Unlocked */}
            <div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                DIRECTLY UNLOCKS ({focalNode.unlockedLectures.length}):
              </span>
              {focalNode.unlockedLectures.length === 0 ? (
                <div style={{ background: '#f5f5f5', border: '1px solid #e0e0e0', padding: '10px 12px', borderRadius: '6px', fontSize: '11px', color: 'var(--muted)' }}>
                  Apex Frontier Concept: No further downstream lectures depend on this.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {lectureRamification.directUnlocked.map(child => {
                    const isChildDone = completedSet.has(child.id);
                    const childReadiness = computeNodeReadiness(child.id, completedSet);
                    const isChildReady = childReadiness.status === 'ready';

                    return (
                      <div
                        key={child.id}
                        onClick={() => onSelectNode(child.id)}
                        style={{
                          background: isChildDone ? '#f8fdf9' : isChildReady ? '#f0f7ff' : 'var(--bg)',
                          border: `1.5px solid ${isChildDone ? '#a3d9b0' : isChildReady ? '#93c5fd' : 'var(--line)'}`,
                          borderRadius: '8px',
                          padding: '10px 12px',
                          cursor: 'pointer',
                          transition: 'border-color 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)' }}>
                            L{String(child.lectureNumber).padStart(2, '0')} · Topic {child.topicNumber}
                          </span>
                          {isChildDone ? (
                            <span style={{ fontSize: '9.5px', color: '#2d6a4f', fontWeight: 650 }}>
                              ✓ Mastered
                            </span>
                          ) : isChildReady ? (
                            <span style={{ fontSize: '9.5px', color: '#1a73e8', fontWeight: 650 }}>
                              ★ Ready Next
                            </span>
                          ) : (
                            <span style={{ fontSize: '9.5px', color: '#9e7b28', fontWeight: 650 }}>
                              🔒 {childReadiness.missingPrereqs.length} left
                            </span>
                          )}
                        </div>
                        <h4 style={{ fontFamily: 'var(--serif)', fontSize: '13px', margin: '0 0 4px', color: 'var(--ink)' }}>
                          {child.title}
                        </h4>
                        <span style={{ fontSize: '10px', color: '#1a73e8', fontWeight: 600 }}>
                          Branch downstream to this lecture →
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Secondary Horizon */}
            {lectureRamification.descendantTiers.length > 1 && (
              <div>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                  SECONDARY HORIZON ({lectureRamification.descendantTiers[1].nodes.length}):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {lectureRamification.descendantTiers[1].nodes.map(node => (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => onSelectNode(node.id)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '5px',
                        fontSize: '10.5px',
                        background: 'var(--bg)',
                        border: '1px solid var(--line)',
                        color: 'var(--ink)',
                        cursor: 'pointer'
                      }}
                    >
                      L{String(node.lectureNumber).padStart(2, '0')}: {node.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
