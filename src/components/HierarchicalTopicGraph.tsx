import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { buildTopicMacroGraph } from '../lib/knowledgeGraphQuery';
import { computeNodeReadiness, type KnowledgeDAG } from '../lib/knowledgeGraph';
import { NodeCard, type StudyCardActions } from './graph/NodeCard';
interface Props {
  dag: KnowledgeDAG;
  filteredNodeIds: Set<string>;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onShowDetails: (id: string, opener: HTMLButtonElement) => void;
  studyActions?: StudyCardActions;
  completedSet: Set<string>;
}
export function HierarchicalTopicGraph({
  dag,
  filteredNodeIds,
  selectedNodeId,
  onSelectNode,
  onShowDetails,
  studyActions,
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
  useEffect(() => {
    const node = selectedNodeId && dag.nodes.get(selectedNodeId);
    if (node) setExpanded((v) => new Set([...v, node.topicId]));
  }, [selectedNodeId, dag]);
  useEffect(() => {
    if (filteredNodeIds.size < dag.nodeList.length) setExpanded(new Set(topics.map((t) => t.topic.id)));
  }, [filteredNodeIds, dag, topics]);
  return (
    <div className="topic-map">
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
                    readiness={computeNodeReadiness(node.id, completedSet, dag)}
                    isSelected={node.id === selectedNodeId}
                    onExplore={() => onSelectNode(node.id)}
                    onDetails={(opener) => onShowDetails(node.id, opener)}
                    studyActions={studyActions}
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
