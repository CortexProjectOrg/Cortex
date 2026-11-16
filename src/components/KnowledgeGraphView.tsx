import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { computeNodeReadiness, getKnowledgeDAG } from '../lib/knowledgeGraph';
import { toggleLecture } from '../lib/progress';
import { useWorkspace } from '../lib/workspace';
import { DagRamificationExplorer } from './DagRamificationExplorer';
import { HierarchicalTopicGraph } from './HierarchicalTopicGraph';
import { InteractiveDagCanvas } from './InteractiveDagCanvas';

import { GraphToolbar, type StatusFilter, type ViewMode } from './graph/GraphToolbar';
import { Modal } from './ui/Modal';
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

  // Sync focus param
  useEffect(() => {
    if (focusId && dag.nodes.has(focusId)) {
      setSelectedNodeId(focusId);
    }
  }, [focusId, dag]);

  const selectedNode = selectedNodeId ? dag.nodes.get(selectedNodeId) || null : null;
  const selectedReadiness = selectedNode ? computeNodeReadiness(selectedNode.id, completedSet) : null;

  const toggleLectureMastery = (id: string) => update((cur) => toggleLecture(cur, id));

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
      maxRank: Math.max(...dag.nodeList.map((n) => n.topologicalRank))
    };
  }, [dag, nodeReadinessMap]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return dag.nodeList.filter((node) => {
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

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  return (
    <div className="page" style={{ maxWidth: '1440px' }}>
      <div className="page-title-row">
        <h1>Knowledge map</h1>
        <span className="subtle">
          {stats.completed}/{stats.total} done
        </span>
      </div>
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
        className="graph-content"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: '24px',
          alignItems: 'start'
        }}
      >
        {/* Graph Display Area */}
        <div style={{ minWidth: 0 }}>
          {filteredNodes.length === 0 && <p className="empty-state">No lectures match these filters.</p>}
          {viewMode === 'hierarchical' && filteredNodes.length > 0 && (
            <HierarchicalTopicGraph
              dag={dag}
              filteredNodeIds={filteredNodeIds}
              selectedNodeId={selectedNodeId}
              onSelectNode={(id) => setSelectedNodeId(id)}
              completedSet={completedSet}
            />
          )}

          {viewMode === 'canvas' && filteredNodes.length > 0 && (
            <InteractiveDagCanvas
              dag={dag}
              filteredNodeIds={filteredNodeIds}
              selectedNodeId={selectedNodeId}
              onSelectNode={(id) => setSelectedNodeId(id)}
              completedSet={completedSet}
              onSelectTopic={(tId) => setTopicFilter(tId)}
            />
          )}

          {viewMode === 'ramifications' && filteredNodes.length > 0 && (
            <DagRamificationExplorer
              dag={dag}
              selectedNodeId={
                selectedNodeId && filteredNodeIds.has(selectedNodeId) ? selectedNodeId : filteredNodes[0].id
              }
              onSelectNode={(id) => setSelectedNodeId(id)}
              filteredNodeIds={filteredNodeIds}
              completedSet={completedSet}
            />
          )}

          {viewMode === 'stratified' && filteredNodes.length > 0 && (
            <StratifiedTreeView
              dag={dag}
              filteredNodeIds={filteredNodeIds}
              nodeReadinessMap={nodeReadinessMap}
              selectedNodeId={selectedNodeId}
              onSelectNode={(id) => setSelectedNodeId(id)}
            />
          )}
        </div>

        {/* Selected Node Inspector Drawer */}
        {selectedNode && selectedReadiness && (
          <Modal label="Lecture details" onClose={() => setSelectedNodeId(null)}>
            <LectureDetailDrawer
              selectedNode={selectedNode}
              selectedReadiness={selectedReadiness}
              dag={dag}
              completedSet={completedSet}
              onSelectNode={(id) => setSelectedNodeId(id)}
              onClose={() => setSelectedNodeId(null)}
              onToggleMastery={toggleLectureMastery}
            />
          </Modal>
        )}
      </div>
    </div>
  );
}
