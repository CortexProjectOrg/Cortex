import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Sparkles,
  BookOpen,
  Share2,
  Workflow,
  Search,
  Maximize2,
  Minimize2,
  Compass,
  Check,
  Layers
} from 'lucide-react';
import {
  type GraphNode,
  type KnowledgeDAG,
  computeNodeReadiness
} from '../lib/knowledgeGraph';
import {
  buildTopicMacroGraph,
  findLearningPath,
  type TopicMacroNode,
  type TopicMacroEdge,
  type LearningPathResult
} from '../lib/knowledgeGraphQuery';
import { TOPICS } from '../lib/curriculum';

interface HierarchicalTopicGraphProps {
  dag: KnowledgeDAG;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  completedSet: Set<string>;
  onToggleMastery: (id: string) => void;
}

export function HierarchicalTopicGraph({
  dag,
  selectedNodeId,
  onSelectNode,
  completedSet,
  onToggleMastery
}: HierarchicalTopicGraphProps) {
  // Macro graph data
  const { topicNodes, topicEdges, topicMap } = useMemo(() => {
    return buildTopicMacroGraph(dag, completedSet);
  }, [dag, completedSet]);

  // Expansion states
  const [expandedTopicIds, setExpandedTopicIds] = useState<Set<string>>(() => {
    // By default expand the first topic or the topic of selectedNodeId
    const initial = new Set<string>();
    if (selectedNodeId) {
      const node = dag.nodes.get(selectedNodeId);
      if (node) initial.add(node.topicId);
    } else {
      initial.add('math-foundations');
    }
    return initial;
  });

  const [expandedLectureIds, setExpandedLectureIds] = useState<Set<string>>(new Set());

  // Interactive Query & Path Finder state
  const [searchQuery, setSearchQuery] = useState('');
  const [pathStartId, setPathStartId] = useState<string>('L01-sets-maps-proofs');
  const [pathTargetId, setPathTargetId] = useState<string>('L57-qec-stabilizer-codes-automorphisms');
  const [showPathFinder, setShowPathFinder] = useState(false);
  const [activePathResult, setActivePathResult] = useState<LearningPathResult | null>(null);

  // Sync expanded topic if selectedNodeId changes
  useEffect(() => {
    if (selectedNodeId) {
      const node = dag.nodes.get(selectedNodeId);
      if (node) {
        setExpandedTopicIds(prev => new Set([...prev, node.topicId]));
      }
    }
  }, [selectedNodeId, dag]);

  const toggleTopicExpand = (topicId: string) => {
    setExpandedTopicIds(prev => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  };

  const toggleLectureExpand = (lectureId: string) => {
    setExpandedLectureIds(prev => {
      const next = new Set(prev);
      if (next.has(lectureId)) next.delete(lectureId);
      else next.add(lectureId);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedTopicIds(new Set(TOPICS.map(t => t.id)));
  };

  const collapseAll = () => {
    setExpandedTopicIds(new Set());
    setExpandedLectureIds(new Set());
  };

  // Run Path Finder Query
  const handleCalculatePath = () => {
    const res = findLearningPath(pathStartId, pathTargetId, completedSet, dag);
    setActivePathResult(res);

    if (res && res.isReachable) {
      // Auto-expand all topics involved in the path
      const topicsOnPath = new Set<string>();
      res.prerequisiteSubDAG.forEach(n => topicsOnPath.add(n.topicId));
      setExpandedTopicIds(prev => new Set([...prev, ...topicsOnPath]));
    }
  };

  const pathNodeIdSet = useMemo(() => {
    if (!activePathResult || !activePathResult.isReachable) return new Set<string>();
    return new Set(activePathResult.prerequisiteSubDAG.map(n => n.id));
  }, [activePathResult]);

  // Group topics into 4 pedagogical tiers for visual scaling
  const topicTiers = useMemo(() => {
    return [
      {
        tier: 1,
        title: 'Tier I: Bedrock Foundations & State Spaces',
        topics: topicNodes.filter(t => t.topic.number <= 2)
      },
      {
        tier: 2,
        title: 'Tier II: Symplectic Geometry, Paulis & Clifford Group',
        topics: topicNodes.filter(t => t.topic.number >= 3 && t.topic.number <= 4)
      },
      {
        tier: 3,
        title: 'Tier III: Stabilizers, Classical Simulation & Compilers',
        topics: topicNodes.filter(t => t.topic.number >= 5 && t.topic.number <= 6)
      },
      {
        tier: 4,
        title: 'Tier IV: Hamiltonians, Solvers & Quantum Measurement',
        topics: topicNodes.filter(t => t.topic.number >= 7 && t.topic.number <= 9)
      },
      {
        tier: 5,
        title: 'Tier V: Advanced Apex Frontiers (Fermions, QEC & CUDA)',
        topics: topicNodes.filter(t => t.topic.number === 10)
      }
    ];
  }, [topicNodes]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Query & Action Bar */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: '9px',
          padding: '14px 18px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: '1 1 360px' }}>
          <div className="search-field small" style={{ flex: '1 1 200px' }}>
            <Search size={14} />
            <input
              type="text"
              placeholder="Query any concept, theorem, or question..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            type="button"
            className={`button small ${showPathFinder ? 'primary' : 'secondary'}`}
            style={{ minHeight: '34px', fontSize: '11px' }}
            onClick={() => setShowPathFinder(v => !v)}
          >
            <Compass size={14} /> Path Finder
          </button>
        </div>

        {/* Global Expand / Collapse Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            className="button small secondary"
            style={{ minHeight: '34px', fontSize: '11px', padding: '6px 12px' }}
            onClick={expandAll}
            title="Expand all 10 topics to view internal lectures"
          >
            <Maximize2 size={13} /> Expand All Topics
          </button>
          <button
            type="button"
            className="button small secondary"
            style={{ minHeight: '34px', fontSize: '11px', padding: '6px 12px' }}
            onClick={collapseAll}
            title="Collapse to compact topic nodes"
          >
            <Minimize2 size={13} /> Collapse All
          </button>
        </div>
      </div>

      {/* Path Finder Query Drawer */}
      {showPathFinder && (
        <div
          style={{
            background: '#f8faf7',
            border: '1.5px solid var(--accent)',
            borderRadius: '9px',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={16} style={{ color: 'var(--accent)' }} />
              <strong style={{ fontSize: '12.5px', color: 'var(--ink)' }}>
                Topological Learning Path Query: &ldquo;How do I get to concept X?&rdquo;
              </strong>
            </div>
            <button
              type="button"
              className="text-button"
              style={{ fontSize: '11px' }}
              onClick={() => {
                setShowPathFinder(false);
                setActivePathResult(null);
              }}
            >
              Close
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>Start:</span>
              <select
                value={pathStartId}
                onChange={e => setPathStartId(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '11px', borderRadius: '5px', border: '1px solid var(--line)', background: '#fff' }}
              >
                {dag.nodeList.slice(0, 15).map(n => (
                  <option key={n.id} value={n.id}>
                    L{String(n.lectureNumber).padStart(2, '0')}: {n.title}
                  </option>
                ))}
              </select>
            </div>

            <ArrowRight size={14} style={{ color: 'var(--accent)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>Target:</span>
              <select
                value={pathTargetId}
                onChange={e => setPathTargetId(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '11px', borderRadius: '5px', border: '1px solid var(--line)', background: '#fff' }}
              >
                {dag.nodeList.map(n => (
                  <option key={n.id} value={n.id}>
                    L{String(n.lectureNumber).padStart(2, '0')}: {n.title} (Topic {n.topicNumber})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="button primary small"
              style={{ minHeight: '32px', fontSize: '11px' }}
              onClick={handleCalculatePath}
            >
              Trace Dependency Corridor
            </button>
          </div>

          {activePathResult && (
            <div style={{ marginTop: '8px', padding: '10px 14px', background: '#fff', borderRadius: '6px', border: '1px solid var(--line)' }}>
              {activePathResult.isReachable ? (
                <div>
                  <div style={{ fontSize: '11.5px', color: '#2d6a4f', fontWeight: 650, marginBottom: '6px' }}>
                    ✓ Direct Topological Corridor Found ({activePathResult.shortestPath.length} step chain, {activePathResult.prerequisiteSubDAG.length} total required concepts)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '11px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--muted)' }}>Shortest Spine:</span>
                    {activePathResult.shortestPath.map((step, idx) => (
                      <React.Fragment key={step.id}>
                        <button
                          type="button"
                          onClick={() => onSelectNode(step.id)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: completedSet.has(step.id) ? '#eaf4eb' : 'var(--soft)',
                            border: '1px solid var(--line)',
                            color: 'var(--ink)',
                            fontSize: '10.5px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          L{String(step.lectureNumber).padStart(2, '0')}: {step.title}
                        </button>
                        {idx < activePathResult.shortestPath.length - 1 && (
                          <ChevronRight size={12} style={{ color: 'var(--muted)' }} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '11.5px', color: '#c27803' }}>
                  Target concept is not downstream from start concept. Try choosing an earlier starting concept.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Tier-by-Tier Topic Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {topicTiers.map(tier => (
          <div key={tier.tier}>
            {/* Tier Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '14px',
                paddingBottom: '6px',
                borderBottom: '1.5px solid var(--line)'
              }}
            >
              <span className="eyebrow" style={{ color: 'var(--accent)' }}>
                {tier.title}
              </span>
            </div>

            {/* Topics in this Tier */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: tier.topics.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '18px',
                alignItems: 'start'
              }}
            >
              {tier.topics.map(topicMacro => {
                const isExpanded = expandedTopicIds.has(topicMacro.topic.id);
                const hasPathHighlight = topicMacro.lectures.some(l => pathNodeIdSet.has(l.id));

                return (
                  <TopicNodeCard
                    key={topicMacro.topic.id}
                    topicMacro={topicMacro}
                    isExpanded={isExpanded}
                    onToggleExpand={() => toggleTopicExpand(topicMacro.topic.id)}
                    dag={dag}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={onSelectNode}
                    completedSet={completedSet}
                    onToggleMastery={onToggleMastery}
                    expandedLectureIds={expandedLectureIds}
                    onToggleLectureExpand={toggleLectureExpand}
                    pathNodeIdSet={pathNodeIdSet}
                    searchQuery={searchQuery}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------------------------
// TOPIC NODE CARD (Expandable / Collapsible with Entering & Outgoing Connections)
// -------------------------------------------------------------------------------------------
function TopicNodeCard({
  topicMacro,
  isExpanded,
  onToggleExpand,
  dag,
  selectedNodeId,
  onSelectNode,
  completedSet,
  onToggleMastery,
  expandedLectureIds,
  onToggleLectureExpand,
  pathNodeIdSet,
  searchQuery
}: {
  topicMacro: TopicMacroNode;
  isExpanded: boolean;
  onToggleExpand: () => void;
  dag: KnowledgeDAG;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  completedSet: Set<string>;
  onToggleMastery: (id: string) => void;
  expandedLectureIds: Set<string>;
  onToggleLectureExpand: (id: string) => void;
  pathNodeIdSet: Set<string>;
  searchQuery: string;
}) {
  const { topic, lectures, incomingTopicIds, outgoingTopicIds, incomingEdgesCount, outgoingEdgesCount, masteredCount, percentComplete } = topicMacro;

  // Check if search matches anything in this topic
  const matchesSearch = searchQuery.trim()
    ? topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lectures.some(l => l.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : true;

  if (searchQuery.trim() && !matchesSearch) {
    return null;
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: `1.5px solid ${isExpanded ? 'var(--accent)' : 'var(--line)'}`,
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: isExpanded ? '0 4px 18px rgba(58, 93, 73, 0.08)' : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s'
      }}
    >
      {/* Topic Card Top Banner / Collapsed Header */}
      <div
        style={{
          padding: '16px 18px',
          background: isExpanded ? 'var(--soft)' : 'var(--surface)',
          borderBottom: isExpanded ? '1px solid var(--line)' : 'none',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
        onClick={onToggleExpand}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className={`chapter-dot ${topic.color}`} style={{ width: '28px', height: '28px', fontSize: '11px', fontWeight: 700 }}>
              {topic.number}
            </span>
            <div>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: '17px', margin: 0, color: 'var(--ink)' }}>
                Topic {topic.number}: {topic.title}
              </h3>
              <span style={{ fontSize: '10.5px', color: 'var(--muted)' }}>
                {topic.subtitle}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="icon-button"
            style={{ width: '28px', height: '28px', minWidth: '28px' }}
            title={isExpanded ? 'Collapse Topic' : 'Expand Topic to view internal lectures'}
          >
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Entering & Outgoing Connections Badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '10.5px' }}>
          {/* Entering Connections */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: incomingTopicIds.length === 0 ? 'var(--muted)' : '#2d6a4f',
              background: incomingTopicIds.length === 0 ? 'var(--bg)' : '#eaf4eb',
              padding: '3px 8px',
              borderRadius: '4px',
              fontWeight: 600
            }}
          >
            <ArrowLeft size={11} />
            <span>
              {incomingTopicIds.length === 0 ? 'Root Bedrock (0 incoming)' : `← ${incomingTopicIds.length} Upstream Topics (${incomingEdgesCount} edges)`}
            </span>
          </div>

          {/* Outgoing Connections */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: outgoingTopicIds.length === 0 ? 'var(--muted)' : '#1a73e8',
              background: outgoingTopicIds.length === 0 ? 'var(--bg)' : '#edf4ff',
              padding: '3px 8px',
              borderRadius: '4px',
              fontWeight: 600
            }}
          >
            <span>
              {outgoingTopicIds.length === 0 ? 'Terminal Apex (0 next)' : `${outgoingTopicIds.length} Next Topics (${outgoingEdgesCount} links) →`}
            </span>
            <ArrowRight size={11} />
          </div>
        </div>

        {/* Mastery Progress Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--muted)', marginBottom: '3px' }}>
            <span>Topic Mastery</span>
            <span><strong>{masteredCount}</strong> / {lectures.length} ({percentComplete}%)</span>
          </div>
          <div style={{ height: '4px', background: 'var(--line)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${percentComplete}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s ease' }} />
          </div>
        </div>
      </div>

      {/* Expanded Content: Internal Lectures & Further Connections */}
      {isExpanded && (
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Incoming External Upstream Chips */}
          {incomingTopicIds.length > 0 && (
            <div style={{ padding: '8px 10px', background: '#f8faf7', borderRadius: '6px', border: '1px solid #dce8d8', fontSize: '11px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#2d6a4f', display: 'block', marginBottom: '4px' }}>
                ENTERING CONNECTIONS (Built upon):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {incomingTopicIds.map(tId => {
                  const t = TOPICS.find(top => top.id === tId);
                  if (!t) return null;
                  return (
                    <span
                      key={tId}
                      style={{
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: '#fff',
                        border: '1px solid #c9ebd0',
                        fontSize: '10px',
                        color: 'var(--ink)'
                      }}
                    >
                      ← Topic {t.number}: {t.title}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Internal Monothematic Lectures List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {lectures.map(lectureNode => {
              const isSelected = selectedNodeId === lectureNode.id;
              const isLectureExpanded = expandedLectureIds.has(lectureNode.id);
              const isDone = completedSet.has(lectureNode.id);
              const readiness = computeNodeReadiness(lectureNode.id, completedSet);
              const isReady = readiness.status === 'ready';
              const onPath = pathNodeIdSet.has(lectureNode.id);

              return (
                <div
                  key={lectureNode.id}
                  style={{
                    border: `1.5px solid ${isSelected ? 'var(--accent)' : onPath ? '#10b981' : isDone ? '#c5ddc0' : 'var(--line)'}`,
                    borderRadius: '7px',
                    background: isSelected ? '#f5f9f3' : onPath ? '#f0fdf4' : 'var(--surface)',
                    padding: '10px 12px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    {/* Lecture Title & Number */}
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1, minWidth: 0 }}
                      onClick={() => onSelectNode(lectureNode.id)}
                    >
                      {isDone ? (
                        <CheckCircle2 size={14} style={{ color: '#2d6a4f', flexShrink: 0 }} />
                      ) : isReady ? (
                        <Sparkles size={14} style={{ color: '#1a73e8', flexShrink: 0 }} />
                      ) : (
                        <Lock size={13} style={{ color: '#c27803', flexShrink: 0 }} />
                      )}

                      <div style={{ minWidth: 0 }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)', display: 'block' }}>
                          L{String(lectureNode.lectureNumber).padStart(2, '0')} · Rank {lectureNode.topologicalRank}
                        </span>
                        <div style={{ fontSize: '12px', fontWeight: 650, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {lectureNode.title}
                        </div>
                      </div>
                    </div>

                    {/* Action & Expand Ramification Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Link
                        to={`/topics/${lectureNode.topicId}/${lectureNode.id}`}
                        style={{
                          fontSize: '10px',
                          color: 'var(--accent)',
                          padding: '3px 7px',
                          borderRadius: '4px',
                          background: 'var(--soft)',
                          textDecoration: 'none',
                          fontWeight: 600,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Study
                      </Link>

                      <button
                        type="button"
                        onClick={() => onToggleLectureExpand(lectureNode.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '4px',
                          cursor: 'pointer',
                          color: 'var(--muted)',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Expand further incoming and outgoing connections"
                      >
                        {isLectureExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Further Connection Ramifications when Lecture Expanded */}
                  {isLectureExpanded && (
                    <div
                      style={{
                        marginTop: '10px',
                        paddingTop: '8px',
                        borderTop: '1px dashed var(--line)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        fontSize: '10.5px'
                      }}
                    >
                      {/* Incoming Prerequisites for this lecture */}
                      <div>
                        <strong style={{ color: '#2d6a4f', fontSize: '10px' }}>
                          Incoming Prerequisites ({lectureNode.prerequisites.length}):
                        </strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '3px' }}>
                          {lectureNode.prerequisites.length === 0 ? (
                            <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>None (Axiom)</span>
                          ) : (
                            lectureNode.prerequisites.map(pId => {
                              const pNode = dag.nodes.get(pId);
                              if (!pNode) return null;
                              return (
                                <button
                                  key={pId}
                                  type="button"
                                  onClick={() => onSelectNode(pId)}
                                  style={{
                                    padding: '2px 6px',
                                    borderRadius: '3px',
                                    background: completedSet.has(pId) ? '#eaf4eb' : 'var(--bg)',
                                    border: '1px solid var(--line)',
                                    fontSize: '9.5px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  ← L{String(pNode.lectureNumber).padStart(2, '0')}: {pNode.title}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Outgoing Next Topics Unlocked by this lecture */}
                      <div>
                        <strong style={{ color: '#1a73e8', fontSize: '10px' }}>
                          Outgoing Next Concepts ({lectureNode.unlockedLectures.length}):
                        </strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '3px' }}>
                          {lectureNode.unlockedLectures.length === 0 ? (
                            <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Apex concept</span>
                          ) : (
                            lectureNode.unlockedLectures.map(uId => {
                              const uNode = dag.nodes.get(uId);
                              if (!uNode) return null;
                              return (
                                <button
                                  key={uId}
                                  type="button"
                                  onClick={() => onSelectNode(uId)}
                                  style={{
                                    padding: '2px 6px',
                                    borderRadius: '3px',
                                    background: 'var(--bg)',
                                    border: '1px solid var(--line)',
                                    fontSize: '9.5px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  → L{String(uNode.lectureNumber).padStart(2, '0')}: {uNode.title}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Soft Links if any */}
                      {lectureNode.softLinks.length > 0 && (
                        <div>
                          <strong style={{ color: '#b07d2b', fontSize: '10px' }}>
                            Cross-Field Soft Links ({lectureNode.softLinks.length}):
                          </strong>
                          {lectureNode.softLinks.map(s => {
                            const tNode = dag.nodes.get(s.targetId);
                            if (!tNode) return null;
                            return (
                              <div
                                key={s.targetId}
                                onClick={() => onSelectNode(s.targetId)}
                                style={{
                                  marginTop: '2px',
                                  padding: '4px 6px',
                                  borderRadius: '4px',
                                  background: '#fffdf9',
                                  border: '1px solid #ebd8be',
                                  cursor: 'pointer'
                                }}
                              >
                                <span style={{ fontWeight: 600 }}>
                                  ↔ L{String(tNode.lectureNumber).padStart(2, '0')} ({tNode.title}):
                                </span>{' '}
                                <span style={{ color: 'var(--muted)' }}>{s.relationship}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Outgoing External Next Topics Chips */}
          {outgoingTopicIds.length > 0 && (
            <div style={{ padding: '8px 10px', background: '#f5f9fe', borderRadius: '6px', border: '1px solid #d4e2f9', fontSize: '11px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#1a73e8', display: 'block', marginBottom: '4px' }}>
                OUTGOING CONNECTIONS (Unlocks subsequent topics):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {outgoingTopicIds.map(tId => {
                  const t = TOPICS.find(top => top.id === tId);
                  if (!t) return null;
                  return (
                    <span
                      key={tId}
                      style={{
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: '#fff',
                        border: '1px solid #b9d5f7',
                        fontSize: '10px',
                        color: 'var(--ink)'
                      }}
                    >
                      → Topic {t.number}: {t.title}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
