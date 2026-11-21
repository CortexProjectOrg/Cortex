import {
  computeNodeReadiness,
  getLectureRamification,
  projectCatalogStudyGraph,
  type KnowledgeDAG
} from '../lib/knowledgeGraph';
import { NodeCard, type StudyCardActions } from './graph/NodeCard';
interface Props {
  dag: KnowledgeDAG;
  filteredNodeIds: Set<string>;
  selectedNodeId: string;
  onSelectNode: (id: string) => void;
  onShowDetails: (id: string, opener: HTMLButtonElement) => void;
  studyActions?: StudyCardActions;
  completedSet: Set<string>;
}
export function DagRamificationExplorer({
  dag,
  filteredNodeIds,
  selectedNodeId,
  onSelectNode,
  onShowDetails,
  studyActions,
  completedSet
}: Props) {
  const connections = getLectureRamification(selectedNodeId, completedSet, dag);
  if (!connections) return null;
  const graph = projectCatalogStudyGraph(dag);
  const declared = (ids: readonly string[] | undefined) => (ids ?? []).map((id) => dag.nodes.get(id)!);
  const groups = [
    { title: 'Prerequisites', nodes: declared(graph.incoming.get(selectedNodeId)) },
    { title: 'Selected lecture', nodes: [connections.node] },
    { title: 'Next lectures', nodes: declared(graph.outgoing.get(selectedNodeId)) },
    { title: 'Related lectures', nodes: connections.softLinks.map((link) => link.targetNode) }
  ];
  return (
    <div className="connection-groups">
      {groups.map((group) => {
        const nodes = group.nodes.filter(
          (node) => node.id === selectedNodeId || filteredNodeIds.has(node.id)
        );
        return (
          <section key={group.title} aria-label={group.title}>
            <h2>{group.title}</h2>
            {nodes.length ? (
              <div className="graph-card-grid">
                {nodes.map((node) => (
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
            ) : (
              <p className="subtle">No matching lectures.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
