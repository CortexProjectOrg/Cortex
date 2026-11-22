import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowRight, CheckCircle2, ChevronRight, Circle, GitFork } from 'lucide-react';
import {
  computeNodeReadiness,
  projectCatalogStudyGraph,
  type GraphNode,
  type KnowledgeDAG
} from '../lib/knowledgeGraph';
import { NodeCard, type StudyCardActions } from './graph/NodeCard';

interface Props {
  dag: KnowledgeDAG;
  filteredNodeIds: Set<string>;
  selectedNodeId: string;
  onSelectNode: (id: string) => void;
  onExploreGraph: (id: string) => void;
  onShowDetails: (id: string, opener: HTMLButtonElement) => void;
  studyActions?: StudyCardActions;
  completedSet: Set<string>;
}

const PAGE_SIZE = 4;

function ConnectionLane({
  title,
  nodes,
  emptyMessage,
  completedSet,
  onSelectNode,
  incoming
}: {
  title: string;
  nodes: GraphNode[];
  emptyMessage: string;
  completedSet: Set<string>;
  onSelectNode: (id: string) => void;
  incoming?: boolean;
}) {
  const [limit, setLimit] = useState(PAGE_SIZE);
  return (
    <section
      className={incoming ? 'connection-lane incoming' : 'connection-lane outgoing'}
      aria-label={title}
    >
      <h2>
        {incoming ? <ArrowDownToLine aria-hidden size={16} /> : <GitFork aria-hidden size={16} />}
        {title} <small>{nodes.length}</small>
      </h2>
      {nodes.length ? (
        <ul className="connection-list">
          {nodes.slice(0, limit).map((node) => (
            <li key={node.id}>
              <article aria-label={node.title}>
                <button
                  type="button"
                  aria-label={`Explore ${node.title}`}
                  onClick={() => onSelectNode(node.id)}
                >
                  <span className="connection-meta">
                    {completedSet.has(node.id) ? (
                      <>
                        <CheckCircle2 size={13} /> Done ·{' '}
                      </>
                    ) : null}
                    Lecture {node.lectureNumber}
                  </span>
                  <strong>{node.title}</strong>
                  <ChevronRight size={15} aria-hidden />
                </button>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <p className="connection-empty">{emptyMessage}</p>
      )}
      {limit < nodes.length && (
        <button
          type="button"
          className="text-button connection-more"
          onClick={() => setLimit(limit + PAGE_SIZE)}
        >
          Show more ({nodes.length - limit})
        </button>
      )}
    </section>
  );
}

export function DagRamificationExplorer({
  dag,
  filteredNodeIds,
  selectedNodeId,
  onSelectNode,
  onExploreGraph,
  onShowDetails,
  studyActions,
  completedSet
}: Props) {
  const focusPanel = useRef<HTMLElement>(null);
  const navigating = useRef(false);
  const followConnection = (id: string) => {
    navigating.current = true;
    onSelectNode(id);
  };
  useLayoutEffect(() => {
    if (navigating.current) focusPanel.current?.focus();
    navigating.current = false;
  }, [selectedNodeId]);
  const selected = dag.nodes.get(selectedNodeId);
  if (!selected) return null;
  const graph = projectCatalogStudyGraph(dag);
  const prerequisites = graph.incoming.get(selected.id) ?? [];
  const unlocks = graph.outgoing.get(selected.id) ?? [];
  const visible = (ids: readonly string[]) =>
    ids.filter((id) => filteredNodeIds.has(id)).map((id) => dag.nodes.get(id)!);
  const related = visible(selected.softLinks.map((link) => link.targetId));
  return (
    <div className="connection-explorer">
      <label className="connection-picker">
        Focus lesson
        <select value={selected.id} onChange={(event) => onSelectNode(event.target.value)}>
          {dag.nodeList
            .filter((node) => filteredNodeIds.has(node.id))
            .map((node) => (
              <option value={node.id} key={node.id}>
                {node.title}
              </option>
            ))}
        </select>
      </label>
      <div className="connection-diagram">
        <ConnectionLane
          key={`before-${selected.id}`}
          incoming
          title="Prerequisites"
          nodes={visible(prerequisites)}
          emptyMessage={prerequisites.length ? 'Hidden by current filters' : 'No prerequisites'}
          completedSet={completedSet}
          onSelectNode={followConnection}
        />
        <section className="connection-focus" aria-label="Selected lecture" ref={focusPanel} tabIndex={-1}>
          <h2>
            <Circle size={14} aria-hidden /> Selected lecture
          </h2>
          <NodeCard
            key={selected.id}
            node={selected}
            readiness={computeNodeReadiness(selected.id, completedSet, dag)}
            isSelected
            context={selected.topicTitle}
            onExplore={() => onExploreGraph(selected.id)}
            studyActions={studyActions}
            onDetails={(opener) => onShowDetails(selected.id, opener)}
          />
        </section>
        <ConnectionLane
          key={`after-${selected.id}`}
          title="Next lectures"
          nodes={visible(unlocks)}
          emptyMessage={unlocks.length ? 'Hidden by current filters' : 'No dependent lectures'}
          completedSet={completedSet}
          onSelectNode={followConnection}
        />
      </div>
      {related.length > 0 && (
        <details className="connection-related" key={selected.id}>
          <summary>Related lectures ({related.length})</summary>
          <ul>
            {related.map((node) => (
              <li key={node.id}>
                <button type="button" className="text-button" onClick={() => followConnection(node.id)}>
                  {node.title} <ArrowRight size={13} />
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
