import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  computeNodeReadiness,
  getKnowledgeDAG,
  projectCatalogStudyGraph,
  type KnowledgeDAG
} from '../lib/knowledgeGraph';
import { queryLectures } from '../lib/knowledgeGraphQuery';
import { lectureRoute } from '../lib/model';
import { toggleLecture } from '../lib/progress';
import { formatStudyTime } from '../lib/studyTime';
import { getReadiness, getShortestRoute, getStudyOrder, type StudyDirection } from '../lib/studyGraph';
import { useWorkspace } from '../lib/workspace';
import { DagRamificationExplorer } from './DagRamificationExplorer';
import { HierarchicalTopicGraph } from './HierarchicalTopicGraph';
import { InteractiveDagCanvas } from './InteractiveDagCanvas';

import { GraphToolbar, type StatusFilter, type ViewMode } from './graph/GraphToolbar';
import { Modal } from './ui/Modal';
import { LectureDetailDrawer } from './graph/LectureDetailDrawer';
import { StratifiedTreeView } from './graph/StratifiedTreeView';
import { NodeCard, type StudyCardActions } from './graph/NodeCard';
import { StudyBranchList } from './graph/StudyBranchList';
import { PaperStudyResult } from './graph/PaperStudyResult';

function RouteEndpoint({
  dag,
  label,
  searchLabel,
  value,
  onChange
}: {
  dag: KnowledgeDAG;
  label: string;
  searchLabel: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [query, setQuery] = useState('');
  const matches = queryLectures({ query }, dag);
  const selected = value ? dag.nodes.get(value) : undefined;
  const pinned = selected && !matches.some((node) => node.id === selected.id) ? [selected] : [];
  const options = [...matches, ...pinned].sort(
    (a, b) => a.lectureNumber - b.lectureNumber || a.id.localeCompare(b.id)
  );
  return (
    <div className="study-route-endpoint">
      <label>
        {searchLabel}
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <label>
        {label}
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">Choose a lesson</option>
          {options.map((node) => (
            <option key={node.id} value={node.id}>
              {node.title}
            </option>
          ))}
        </select>
      </label>
      {matches.length === 0 && <span role="status">No matching lessons</span>}
    </div>
  );
}

export function KnowledgeGraphView() {
  const [searchParams] = useSearchParams();
  return searchParams.get('study') === 'paper' ? (
    <div className="page paper-planner">
      <h1>Knowledge map</h1>
      <PaperStudyResult host="map" />
    </div>
  ) : (
    <CatalogKnowledgeGraphView focusId={searchParams.get('focus')} />
  );
}

function CatalogKnowledgeGraphView({ focusId }: { focusId: string | null }) {
  const { data, update } = useWorkspace();

  const dag = useMemo(() => getKnowledgeDAG(), []);
  const graph = projectCatalogStudyGraph(dag);
  const completedSet = useMemo(() => new Set(data.completedLectures || []), [data.completedLectures]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    focusId && dag.nodes.has(focusId) ? focusId : null
  );
  const [detailsNodeId, setDetailsNodeId] = useState<string | null>(null);
  const detailsOpener = useRef<HTMLButtonElement | null>(null);
  const page = useRef<HTMLDivElement>(null);
  const [branch, setBranch] = useState<{ root: string; direction: StudyDirection } | null>(null);
  const [branchDepth, setBranchDepth] = useState(2);
  const [startId, setStartId] = useState('');
  const [goalId, setGoalId] = useState('');
  const [routeOpen, setRouteOpen] = useState(false);
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

  useEffect(() => {
    if (detailsNodeId || !detailsOpener.current) return;
    const opener = detailsOpener.current;
    detailsOpener.current = null;
    if (opener.isConnected && !opener.closest('[hidden]')) opener.focus();
    else page.current?.querySelector<HTMLInputElement>('[aria-label="Search knowledge map"]')?.focus();
  }, [detailsNodeId]);

  const studyActions: StudyCardActions = useMemo(
    () => ({
      select: setSelectedNodeId,
      branch: (root, direction) => {
        setSelectedNodeId(root);
        setBranch({ root, direction });
        setBranchDepth(2);
      },
      start: (id) => {
        setStartId(id);
        setRouteOpen(true);
      },
      goal: (id) => {
        setGoalId(id);
        setRouteOpen(true);
      }
    }),
    []
  );

  const showDetails = (id: string, opener: HTMLButtonElement) => {
    detailsOpener.current = opener;
    setDetailsNodeId(id);
  };
  const detailsNode = detailsNodeId ? dag.nodes.get(detailsNodeId) || null : null;
  const detailsReadiness = detailsNode ? computeNodeReadiness(detailsNode.id, completedSet, dag) : null;

  const exploreNode = (id: string) => {
    setSelectedNodeId(id);
    setViewMode('canvas');
  };

  const toggleLectureMastery = (id: string) => update((cur) => toggleLecture(cur, id));

  // Node readiness map for fast queries
  const nodeReadinessMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeNodeReadiness>>();
    for (const node of dag.nodeList) {
      map.set(node.id, computeNodeReadiness(node.id, completedSet, dag));
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

  const filteredNodes = useMemo(
    () =>
      queryLectures({ query: searchQuery, status: statusFilter, topicId: topicFilter }, dag, completedSet),
    [dag, completedSet, statusFilter, topicFilter, searchQuery]
  );

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);
  const order = goalId ? getStudyOrder(graph, goalId, completedSet) : null;
  const route = startId && goalId ? getShortestRoute(graph, startId, goalId) : null;
  const previewCompleted = branch && new Set([...completedSet, branch.root]);
  const catalogLink = (id: string) => {
    const node = dag.nodes.get(id)!;
    return <Link to={lectureRoute(node.topicId, id)}>{node.title}</Link>;
  };

  return (
    <div className="page" ref={page} style={{ maxWidth: '1440px' }}>
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

      <details
        className="path-finder"
        open={routeOpen}
        onToggle={(event) => setRouteOpen(event.currentTarget.open)}
      >
        <summary>Study route</summary>
        <div className="path-fields study-route-fields">
          <RouteEndpoint
            dag={dag}
            label="From"
            searchLabel="Search starting lessons"
            value={startId}
            onChange={setStartId}
          />
          <RouteEndpoint
            dag={dag}
            label="To"
            searchLabel="Search goal lessons"
            value={goalId}
            onChange={setGoalId}
          />
        </div>
        {route &&
          (route.length ? (
            <ol aria-label="Shortest prerequisite route" className="study-route-chain">
              {route.map((id) => (
                <li key={id}>{catalogLink(id)}</li>
              ))}
            </ol>
          ) : (
            <p>No connecting route</p>
          ))}
        {order && (
          <section aria-label="Study order" className="study-route-order">
            <h2>Study order</h2>
            {order.next && <p>Next: {catalogLink(order.next)}</p>}
            {!order.next && completedSet.has(goalId) && <p>Goal complete</p>}
            {order.remaining.length > 0 && (
              <p>
                {formatStudyTime(order.remainingMinutes)} remaining
                {order.unknownDurationCount > 0 && ` · ${order.unknownDurationCount} without an estimate`}
              </p>
            )}
            <ol>
              {order.remaining.map((id) => (
                <li key={id}>
                  {catalogLink(id)}
                  {order.background.has(id) && <small>Background to revisit</small>}
                </li>
              ))}
            </ol>
          </section>
        )}
      </details>

      {branch && (
        <section className="study-focus" aria-label="Focused lesson connections">
          <div className="study-focus-toolbar">
            <h2>{branch.direction === 'prerequisites' ? 'Prerequisites' : 'What this unlocks'}</h2>
            <label>
              Depth{' '}
              <select value={branchDepth} onChange={(event) => setBranchDepth(Number(event.target.value))}>
                {[1, 2, 3, 4, 5, 6].map((depth) => (
                  <option key={depth}>{depth}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="text-button"
              onClick={(event) => {
                const search = page.current?.querySelector<HTMLInputElement>(
                  '[aria-label="Search knowledge map"]'
                );
                if (event.currentTarget === document.activeElement) search?.focus();
                setBranch(null);
              }}
            >
              Close connections
            </button>
          </div>
          <StudyBranchList
            key={`${branch.root}:${branch.direction}`}
            graph={graph}
            root={branch.root}
            direction={branch.direction}
            depth={branchDepth}
            selected={selectedNodeId}
            renderNode={({ id }) => {
              const node = dag.nodes.get(id)!;
              const readiness = nodeReadinessMap.get(id)!;
              const preview =
                id !== branch.root &&
                branch.direction === 'unlocks' &&
                readiness.status !== 'completed' &&
                previewCompleted
                  ? getReadiness(graph, id, previewCompleted)
                  : null;
              const label =
                preview &&
                (readiness.status === 'ready'
                  ? 'Ready now'
                  : preview.status === 'ready'
                    ? 'Ready after this lesson'
                    : 'More prerequisites needed');
              return (
                <>
                  <NodeCard
                    node={node}
                    readiness={readiness}
                    isSelected={selectedNodeId === id}
                    studyActions={studyActions}
                    onExplore={() => exploreNode(id)}
                    onDetails={(opener) => showDetails(id, opener)}
                  />
                  {label && (
                    <p className="study-preview">
                      {label}
                      {preview?.missingPrereqs.map((missing) => (
                        <span key={missing}>{catalogLink(missing)}</span>
                      ))}
                    </p>
                  )}
                </>
              );
            }}
          />
        </section>
      )}

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
              onSelectNode={exploreNode}
              onShowDetails={showDetails}
              studyActions={studyActions}
              completedSet={completedSet}
            />
          )}

          {viewMode === 'canvas' && filteredNodes.length > 0 && (
            <InteractiveDagCanvas
              dag={dag}
              filteredNodeIds={filteredNodeIds}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              onShowDetails={showDetails}
              studyActions={studyActions}
              completedSet={completedSet}
              onSelectTopic={(tId) => setTopicFilter(tId)}
            />
          )}

          {viewMode === 'ramifications' && filteredNodes.length > 0 && (
            <DagRamificationExplorer
              dag={dag}
              selectedNodeId={selectedNodeId ?? filteredNodes[0].id}
              onSelectNode={setSelectedNodeId}
              onShowDetails={showDetails}
              studyActions={studyActions}
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
              onSelectNode={exploreNode}
              onShowDetails={showDetails}
              studyActions={studyActions}
            />
          )}
        </div>

        {/* Selected Node Inspector Drawer */}
        {detailsNode && detailsReadiness && (
          <Modal label="Lecture details" onClose={() => setDetailsNodeId(null)}>
            <LectureDetailDrawer
              selectedNode={detailsNode}
              selectedReadiness={detailsReadiness}
              dag={dag}
              completedSet={completedSet}
              onSelectNode={setDetailsNodeId}
              onClose={() => setDetailsNodeId(null)}
              onToggleMastery={toggleLectureMastery}
            />
          </Modal>
        )}
      </div>
    </div>
  );
}
