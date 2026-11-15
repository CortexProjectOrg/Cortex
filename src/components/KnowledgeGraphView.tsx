import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Network,
  CheckCircle2,
  Lock,
  ArrowRight,
  BookOpen,
  Sparkles,
  Search,
  Filter,
  Layers,
  ChevronRight,
  GitFork,
  X,
  ExternalLink,
  ShieldAlert,
  Clock3,
  Check,
  Share2,
  Workflow,
  HelpCircle,
  Maximize2
} from 'lucide-react';
import {
  getKnowledgeDAG,
  computeNodeReadiness,
  type GraphNode,
  type KnowledgeDAG,
  type SoftLink
} from '../lib/knowledgeGraph';
import { TOPICS, ALL_LECTURES } from '../lib/curriculum';
import { useWorkspace } from '../lib/workspace';

type ViewMode = 'stratified' | 'topics' | 'matrix';
type StatusFilter = 'all' | 'ready' | 'completed' | 'locked';

export function KnowledgeGraphView() {
  const { data, update } = useWorkspace();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const focusId = searchParams.get('focus');

  const dag = useMemo(() => getKnowledgeDAG(), []);
  const completedSet = useMemo(() => new Set(data.completedLectures || []), [data.completedLectures]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(focusId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('stratified');

  // Sync focus param
  useEffect(() => {
    if (focusId && dag.nodes.has(focusId)) {
      setSelectedNodeId(focusId);
    }
  }, [focusId, dag]);

  const selectedNode = selectedNodeId ? dag.nodes.get(selectedNodeId) || null : null;
  const selectedReadiness = selectedNode ? computeNodeReadiness(selectedNode.id, completedSet) : null;

  // Toggle mastery for a lecture
  const toggleLectureMastery = (nodeId: string) => {
    update(cur => {
      const existing = cur.completedLectures || [];
      const updated = existing.includes(nodeId)
        ? existing.filter(id => id !== nodeId)
        : [...existing, nodeId];
      return {
        ...cur,
        completedLectures: updated
      };
    });
  };

  // Node readiness map for fast queries
  const nodeReadinessMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeNodeReadiness>>();
    for (const node of dag.nodeList) {
      map.set(node.id, computeNodeReadiness(node.id, completedSet));
    }
    return map;
  }, [dag, completedSet]);

  // Overall Statistics
  const stats = useMemo(() => {
    let completed = 0;
    let ready = 0;
    let locked = 0;

    for (const [, r] of nodeReadinessMap.entries()) {
      if (r.status === 'completed') completed++;
      else if (r.status === 'ready') ready++;
      else locked++;
    }

    return {
      total: dag.nodeList.length,
      completed,
      ready,
      locked,
      percentDone: Math.round((completed / dag.nodeList.length) * 100),
      edges: dag.totalPrerequisiteEdges,
      softLinks: dag.totalSoftLinks,
      maxRank: Math.max(...dag.nodeList.map(n => n.topologicalRank))
    };
  }, [dag, nodeReadinessMap]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return dag.nodeList.filter(node => {
      const readiness = nodeReadinessMap.get(node.id);
      if (statusFilter !== 'all' && readiness?.status !== statusFilter) {
        return false;
      }
      if (topicFilter !== 'all' && node.topicId !== topicFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = node.title.toLowerCase().includes(q);
        const matchesSubtitle = node.subtitle.toLowerCase().includes(q);
        const matchesQuestion = node.question.toLowerCase().includes(q);
        const matchesId = node.id.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSubtitle && !matchesQuestion && !matchesId) {
          return false;
        }
      }
      return true;
    });
  }, [dag, nodeReadinessMap, statusFilter, topicFilter, searchQuery]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map(n => n.id)), [filteredNodes]);

  return (
    <div className="page" style={{ maxWidth: '1440px' }}>
      {/* Page Header */}
      <div className="page-title-row" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <span className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Network size={14} /> MATHEMATICAL CURRICULUM ARCHITECTURE · STRICT DAG
          </span>
          <h1 style={{ fontSize: '36px', margin: '8px 0 10px' }}>Knowledge Tree & Dependency DAG</h1>
          <p style={{ maxWidth: '780px', fontSize: '13px', lineHeight: '1.7', color: 'var(--muted)' }}>
            All 60 monothematic lectures form a strictly acyclic directed graph (DAG). Foundational mathematical
            axioms flow downstream into Clifford normalizers, Krylov solvers, and quantum error-correcting codes.
            Zero cycles are mathematically proven via Kahn&apos;s algorithm. Non-blocking soft links capture cross-disciplinary contamination.
          </p>
        </div>

        {/* Global Progress Metric */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: '10px',
            padding: '16px 20px',
            minWidth: '260px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 650, color: 'var(--muted)', letterSpacing: '0.8px' }}>
              CURRICULUM MASTERY
            </span>
            <strong style={{ fontSize: '14px', color: 'var(--accent)' }}>{stats.percentDone}%</strong>
          </div>
          <div
            style={{
              height: '6px',
              background: 'var(--line)',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '10px'
            }}
          >
            <div
              style={{
                width: `${stats.percentDone}%`,
                height: '100%',
                background: 'var(--accent)',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)' }}>
            <span>
              <strong style={{ color: 'var(--ink)' }}>{stats.completed}</strong> / {stats.total} Mastered
            </span>
            <span>
              <strong style={{ color: '#2d6a4f' }}>{stats.ready}</strong> Ready to Learn
            </span>
          </div>
        </div>
      </div>

      {/* DAG Invariant Proof & Stats Bar */}
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

      {/* Filter and Control Toolbar */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: '9px',
          padding: '14px 18px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 320px' }}>
          {/* Search Field */}
          <div className="search-field small" style={{ flex: 1, minWidth: '220px' }}>
            <Search size={15} />
            <input
              type="text"
              placeholder="Search concepts, questions, or lecture titles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--muted)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Topic Select */}
          <select
            value={topicFilter}
            onChange={e => setTopicFilter(e.target.value)}
            style={{
              border: '1px solid var(--line)',
              background: 'var(--bg)',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '11px',
              color: 'var(--ink)'
            }}
          >
            <option value="all">All 10 Topics</option>
            {TOPICS.map(t => (
              <option key={t.id} value={t.id}>
                Topic {t.number}: {t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Status Pill Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: 'var(--muted)', marginRight: '4px' }}>Status:</span>
          {(
            [
              { key: 'all', label: `All (${dag.nodeList.length})` },
              { key: 'ready', label: `Ready (${stats.ready})` },
              { key: 'completed', label: `Mastered (${stats.completed})` },
              { key: 'locked', label: `Locked (${stats.locked})` }
            ] as const
          ).map(tab => (
            <button
              key={tab.key}
              type="button"
              className={`button small ${statusFilter === tab.key ? 'primary' : 'secondary'}`}
              style={{
                minHeight: '32px',
                padding: '5px 11px',
                fontSize: '11px',
                borderRadius: '6px'
              }}
              onClick={() => setStatusFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="segmented">
          <button
            type="button"
            className={viewMode === 'stratified' ? 'selected' : ''}
            onClick={() => setViewMode('stratified')}
            title="Stratified Layered DAG Tree"
          >
            <GitFork size={14} /> Stratified Tiers
          </button>
          <button
            type="button"
            className={viewMode === 'topics' ? 'selected' : ''}
            onClick={() => setViewMode('topics')}
            title="Curriculum Topic Clusters"
          >
            <Layers size={14} /> Topic Clusters
          </button>
          <button
            type="button"
            className={viewMode === 'matrix' ? 'selected' : ''}
            onClick={() => setViewMode('matrix')}
            title="Compact Monothematic Matrix"
          >
            <BookOpen size={14} /> Monothematic Matrix
          </button>
        </div>
      </div>

      {/* Main Graph Content Area & Details Drawer */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedNode ? 'minmax(0, 1fr) 390px' : 'minmax(0, 1fr)',
          gap: '24px',
          alignItems: 'start'
        }}
      >
        {/* Graph Display Area */}
        <div style={{ minWidth: 0 }}>
          {viewMode === 'stratified' && (
            <StratifiedTreeView
              dag={dag}
              filteredNodeIds={filteredNodeIds}
              nodeReadinessMap={nodeReadinessMap}
              selectedNodeId={selectedNodeId}
              onSelectNode={id => setSelectedNodeId(id)}
            />
          )}

          {viewMode === 'topics' && (
            <TopicClustersView
              dag={dag}
              filteredNodeIds={filteredNodeIds}
              nodeReadinessMap={nodeReadinessMap}
              selectedNodeId={selectedNodeId}
              onSelectNode={id => setSelectedNodeId(id)}
            />
          )}

          {viewMode === 'matrix' && (
            <MatrixGridView
              dag={dag}
              filteredNodeIds={filteredNodeIds}
              nodeReadinessMap={nodeReadinessMap}
              selectedNodeId={selectedNodeId}
              onSelectNode={id => setSelectedNodeId(id)}
            />
          )}
        </div>

        {/* Selected Node Inspector Drawer */}
        {selectedNode && selectedReadiness && (
          <aside
            style={{
              position: 'sticky',
              top: '20px',
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
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
                onClick={() => setSelectedNodeId(null)}
                title="Close Inspector"
                style={{ width: '28px', height: '28px', minWidth: '28px' }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: '1.6', marginBottom: '18px' }}>
              {selectedNode.subtitle}
            </p>

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
                className={`button small ${selectedReadiness.status === 'completed' ? 'soft' : 'secondary'}`}
                onClick={() => toggleLectureMastery(selectedNode.id)}
                style={{ minHeight: '36px', fontSize: '11px' }}
                title="Toggle completion status"
              >
                {selectedReadiness.status === 'completed' ? (
                  <>
                    <Check size={14} style={{ color: 'var(--accent)' }} /> Mastered
                  </>
                ) : (
                  'Mark Mastered'
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
              <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.8px', color: 'var(--accent)', display: 'block', marginBottom: '3px' }}>
                MONOTHEMATIC CORE QUESTION
              </span>
              <p style={{ fontSize: '12px', fontStyle: 'italic', fontFamily: 'var(--serif)', margin: 0, color: 'var(--ink)' }}>
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
                <strong>60 min · Pack {selectedNode.packNumber}.{selectedNode.packSlot}</strong>
              </div>
            </div>

            {/* Hard Prerequisites Section */}
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
                  HARD PREREQUISITES ({selectedNode.prerequisites.length})
                </span>
                <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                  {selectedNode.prerequisites.length === 0 ? 'Foundational Axiom' : `${selectedReadiness.percentReady}% Met`}
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
                  {selectedNode.prerequisites.map(pId => {
                    const pNode = dag.nodes.get(pId);
                    if (!pNode) return null;
                    const isMet = completedSet.has(pId);

                    return (
                      <div
                        key={pId}
                        onClick={() => setSelectedNodeId(pId)}
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
                            <div style={{ fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

            {/* Directly Unlocked Section */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.5px', marginBottom: '10px' }}>
                DIRECTLY UNLOCKS ({selectedNode.unlockedLectures.length})
              </div>
              {selectedNode.unlockedLectures.length === 0 ? (
                <p style={{ fontSize: '11px', color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
                  Terminal apex node in the curriculum tree.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedNode.unlockedLectures.map(uId => {
                    const uNode = dag.nodes.get(uId);
                    if (!uNode) return null;
                    const uMet = completedSet.has(uId);

                    return (
                      <div
                        key={uId}
                        onClick={() => setSelectedNodeId(uId)}
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
                          <div style={{ fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                  {selectedNode.softLinks.map(link => {
                    const targetNode = dag.nodes.get(link.targetId);
                    if (!targetNode) return null;

                    return (
                      <div
                        key={link.targetId}
                        onClick={() => setSelectedNodeId(link.targetId)}
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
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------------------------
// VIEW 1: Stratified Layered DAG Tree
// -------------------------------------------------------------------------------------------
function StratifiedTreeView({
  dag,
  filteredNodeIds,
  nodeReadinessMap,
  selectedNodeId,
  onSelectNode
}: {
  dag: KnowledgeDAG;
  filteredNodeIds: Set<string>;
  nodeReadinessMap: Map<string, ReturnType<typeof computeNodeReadiness>>;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {dag.layers.map(layer => {
        const visibleNodes = layer.nodes.filter(n => filteredNodeIds.has(n.id));
        if (visibleNodes.length === 0) return null;

        return (
          <div
            key={layer.rank}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: '9px',
              padding: '18px 20px',
              position: 'relative'
            }}
          >
            {/* Layer Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
                paddingBottom: '10px',
                borderBottom: '1px solid var(--line)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'var(--soft)',
                    color: 'var(--accent)',
                    fontSize: '11px',
                    fontWeight: 700
                  }}
                >
                  {layer.rank}
                </span>
                <div>
                  <h4 style={{ fontFamily: 'var(--serif)', fontSize: '16px', margin: 0 }}>
                    {layer.title}
                  </h4>
                  <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                    Topological Depth {layer.rank} · {visibleNodes.length} Monothematic Concepts
                  </span>
                </div>
              </div>
            </div>

            {/* Nodes Grid in this Layer */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '12px'
              }}
            >
              {visibleNodes.map(node => {
                const readiness = nodeReadinessMap.get(node.id)!;
                const isSelected = selectedNodeId === node.id;

                return (
                  <NodeCard
                    key={node.id}
                    node={node}
                    readiness={readiness}
                    isSelected={isSelected}
                    onClick={() => onSelectNode(node.id)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// -------------------------------------------------------------------------------------------
// VIEW 2: Topic Clusters View
// -------------------------------------------------------------------------------------------
function TopicClustersView({
  dag,
  filteredNodeIds,
  nodeReadinessMap,
  selectedNodeId,
  onSelectNode
}: {
  dag: KnowledgeDAG;
  filteredNodeIds: Set<string>;
  nodeReadinessMap: Map<string, ReturnType<typeof computeNodeReadiness>>;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {TOPICS.map(topic => {
        const topicNodes = dag.nodeList.filter(
          n => n.topicId === topic.id && filteredNodeIds.has(n.id)
        );
        if (topicNodes.length === 0) return null;

        const topicDone = topicNodes.filter(n => nodeReadinessMap.get(n.id)?.status === 'completed').length;

        return (
          <div
            key={topic.id}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: '9px',
              padding: '20px'
            }}
          >
            {/* Topic Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--line)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className={`chapter-dot ${topic.color}`} style={{ width: '28px', height: '28px', fontSize: '11px' }}>
                  {topic.number}
                </span>
                <div>
                  <h3 style={{ fontFamily: 'var(--serif)', fontSize: '19px', margin: 0 }}>
                    Topic {topic.number}: {topic.title}
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    {topic.subtitle}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                <strong>{topicDone}</strong> / {topicNodes.length} Mastered
              </div>
            </div>

            {/* Nodes Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '12px'
              }}
            >
              {topicNodes.map(node => {
                const readiness = nodeReadinessMap.get(node.id)!;
                const isSelected = selectedNodeId === node.id;

                return (
                  <NodeCard
                    key={node.id}
                    node={node}
                    readiness={readiness}
                    isSelected={isSelected}
                    onClick={() => onSelectNode(node.id)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// -------------------------------------------------------------------------------------------
// VIEW 3: Compact Monothematic Matrix View
// -------------------------------------------------------------------------------------------
function MatrixGridView({
  dag,
  filteredNodeIds,
  nodeReadinessMap,
  selectedNodeId,
  onSelectNode
}: {
  dag: KnowledgeDAG;
  filteredNodeIds: Set<string>;
  nodeReadinessMap: Map<string, ReturnType<typeof computeNodeReadiness>>;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
}) {
  const visibleNodes = dag.nodeList.filter(n => filteredNodeIds.has(n.id));

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '12px'
      }}
    >
      {visibleNodes.map(node => {
        const readiness = nodeReadinessMap.get(node.id)!;
        const isSelected = selectedNodeId === node.id;

        return (
          <NodeCard
            key={node.id}
            node={node}
            readiness={readiness}
            isSelected={isSelected}
            onClick={() => onSelectNode(node.id)}
          />
        );
      })}
    </div>
  );
}

// -------------------------------------------------------------------------------------------
// SHARED COMPONENT: Node Card
// -------------------------------------------------------------------------------------------
function NodeCard({
  node,
  readiness,
  isSelected,
  onClick
}: {
  node: GraphNode;
  readiness: ReturnType<typeof computeNodeReadiness>;
  isSelected: boolean;
  onClick: () => void;
}) {
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
