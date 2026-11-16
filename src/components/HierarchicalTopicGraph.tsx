import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { buildTopicMacroGraph, findLearningPath } from '../lib/knowledgeGraphQuery';
import { computeNodeReadiness, type KnowledgeDAG } from '../lib/knowledgeGraph';
import { NodeCard } from './graph/NodeCard';
interface Props {
  dag: KnowledgeDAG;
  filteredNodeIds: Set<string>;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  completedSet: Set<string>;
}
export function HierarchicalTopicGraph({
  dag,
  filteredNodeIds,
  selectedNodeId,
  onSelectNode,
  completedSet
}: Props) {
  const topics = useMemo(
    () =>
      buildTopicMacroGraph(dag, completedSet)
        .topicNodes.map((topic) => ({
          ...topic,
          lectures: topic.lectures.filter((n) => filteredNodeIds.has(n.id))
        }))
        .filter((topic) => topic.lectures.length),
    [dag, completedSet, filteredNodeIds]
  );
  const [expanded, setExpanded] = useState(new Set([dag.nodeList[0].topicId]));
  const [start, setStart] = useState(dag.nodeList[0].id);
  const [target, setTarget] = useState(dag.nodeList.at(-1)!.id);
  const [path, setPath] = useState<ReturnType<typeof findLearningPath> | null>(null);
  useEffect(() => {
    const node = selectedNodeId && dag.nodes.get(selectedNodeId);
    if (node) setExpanded((v) => new Set([...v, node.topicId]));
  }, [selectedNodeId, dag]);
  useEffect(() => {
    if (filteredNodeIds.size < dag.nodeList.length) setExpanded(new Set(topics.map((t) => t.topic.id)));
  }, [filteredNodeIds, dag, topics]);
  return (
    <div className="topic-map">
      <details className="path-finder">
        <summary>Find a learning path</summary>
        <div className="path-fields">
          <label>
            From
            <select value={start} onChange={(e) => setStart(e.target.value)}>
              {dag.nodeList.map((n) => (
                <option value={n.id} key={n.id}>
                  {n.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            To
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              {dag.nodeList.map((n) => (
                <option value={n.id} key={n.id}>
                  {n.title}
                </option>
              ))}
            </select>
          </label>
          <button
            className="button small secondary"
            onClick={() => setPath(findLearningPath(start, target, completedSet, dag))}
          >
            Find path
          </button>
        </div>
        {path && (
          <p className="subtle">
            {path.isReachable
              ? path.shortestPath.map((n) => n.title).join(' → ')
              : 'No prerequisite path connects these lectures.'}
          </p>
        )}
      </details>
      {topics.map(({ topic, lectures, masteredCount }) => {
        const open = expanded.has(topic.id);
        return (
          <section key={topic.id} className="topic-map-section">
            <button
              type="button"
              className="topic-map-heading"
              aria-expanded={open}
              onClick={() =>
                setExpanded((previous) => {
                  const next = new Set(previous);
                  if (next.has(topic.id)) next.delete(topic.id);
                  else next.add(topic.id);
                  return next;
                })
              }
            >
              {open ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
              <span>
                {topic.number}. {topic.title}
              </span>
              <small>
                {masteredCount}/{topic.lectureIds.length} done
              </small>
            </button>
            {open && (
              <div className="graph-card-grid">
                {lectures.map((node) => (
                  <NodeCard
                    key={node.id}
                    node={node}
                    readiness={computeNodeReadiness(node.id, completedSet)}
                    isSelected={node.id === selectedNodeId}
                    onClick={() => onSelectNode(node.id)}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
