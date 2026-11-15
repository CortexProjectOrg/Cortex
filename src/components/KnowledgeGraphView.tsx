import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Network } from 'lucide-react';
import {
  getKnowledgeDAG,
  computeNodeReadiness
} from '../lib/knowledgeGraph';
import { useWorkspace } from '../lib/workspace';
import { InteractiveDagCanvas } from './InteractiveDagCanvas';
import { DagRamificationExplorer } from './DagRamificationExplorer';
import { HierarchicalTopicGraph } from './HierarchicalTopicGraph';
import { syncGraphWithDatabase } from '../lib/graphStore';
import { GraphStatsBar } from './graph/GraphStatsBar';
import { GraphToolbar, type ViewMode, type StatusFilter } from './graph/GraphToolbar';
import { LectureDetailDrawer } from './graph/LectureDetailDrawer';
import { StratifiedTreeView } from './graph/StratifiedTreeView';

export function KnowledgeGraphView() {
  const { data, update } = useWorkspace();
  const [searchParams] = useSearchParams();
  const focusId = searchParams.get('focus');

  const dag = useMemo(() => getKnowledgeDAG(), []);
  const completedSet = useMemo(() => new Set(data.completedLectures || []), [data.completedLectures]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(focusId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('hierarchical');

  // Ensure static DAG is persisted and kept updated in Neon DB
  useEffect(() => {
    void syncGraphWithDatabase();
  }, []);

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
      <GraphStatsBar stats={stats} />

      {/* Filter and Control Toolbar */}
      <GraphToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        topicFilter={topicFilter}
        setTopicFilter={setTopicFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        viewMode={viewMode}
        setViewMode={setViewMode}
        totalNodes={dag.nodeList.length}
        stats={stats}
      />

      {/* Main Graph Content Area & Details Drawer */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            selectedNode && viewMode !== 'ramifications' && viewMode !== 'hierarchical'
              ? 'minmax(0, 1fr) 390px'
              : 'minmax(0, 1fr)',
          gap: '24px',
          alignItems: 'start'
        }}
      >
        {/* Graph Display Area */}
        <div style={{ minWidth: 0 }}>
          {viewMode === 'hierarchical' && (
            <HierarchicalTopicGraph
              dag={dag}
              selectedNodeId={selectedNodeId}
              onSelectNode={id => setSelectedNodeId(id)}
              completedSet={completedSet}
              onToggleMastery={toggleLectureMastery}
            />
          )}

          {viewMode === 'canvas' && (
            <InteractiveDagCanvas
              dag={dag}
              selectedNodeId={selectedNodeId}
              onSelectNode={id => setSelectedNodeId(id)}
              completedSet={completedSet}
              focusedTopicId={topicFilter !== 'all' ? topicFilter : undefined}
              onSelectTopic={tId => setTopicFilter(tId)}
            />
          )}

          {viewMode === 'ramifications' && (
            <DagRamificationExplorer
              dag={dag}
              selectedNodeId={selectedNodeId || 'L01-sets-maps-proofs'}
              onSelectNode={id => setSelectedNodeId(id)}
              selectedTopicId={topicFilter !== 'all' ? topicFilter : selectedNode?.topicId || 'math-foundations'}
              onSelectTopic={tId => setTopicFilter(tId)}
              completedSet={completedSet}
              onToggleMastery={toggleLectureMastery}
            />
          )}

          {viewMode === 'stratified' && (
            <StratifiedTreeView
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
          <LectureDetailDrawer
            selectedNode={selectedNode}
            selectedReadiness={selectedReadiness}
            dag={dag}
            completedSet={completedSet}
            onSelectNode={id => setSelectedNodeId(id)}
            onClose={() => setSelectedNodeId(null)}
            onToggleMastery={toggleLectureMastery}
          />
        )}
      </div>
    </div>
  );
}
