import { computeNodeReadiness, getLectureRamification, type KnowledgeDAG } from '../lib/knowledgeGraph';
import { NodeCard } from './graph/NodeCard';
interface Props {
  dag: KnowledgeDAG;
  filteredNodeIds: Set<string>;
  selectedNodeId: string;
  onSelectNode: (id: string) => void;
  onShowDetails: (id: string) => void;
  completedSet: Set<string>;
}
export function DagRamificationExplorer({
  dag,
  filteredNodeIds,
  selectedNodeId,
  onSelectNode,
  onShowDetails,
  completedSet
}: Props) {
  const connections = getLectureRamification(selectedNodeId, completedSet, dag);
  if (!connections) return null;
  const groups = [
    { title: 'Prerequisites', nodes: connections.directPrerequisites },
    { title: 'Selected lecture', nodes: [connections.node] },
    { title: 'Next lectures', nodes: connections.directUnlocked },
    { title: 'Related lectures', nodes: connections.softLinks.map((link) => link.targetNode) }
  ];
  return (
    <div className="connection-groups">
      {groups.map((group) => {
        const nodes = group.nodes.filter((node) => filteredNodeIds.has(node.id));
        return (
          <section key={group.title} aria-label={group.title}>
            <h2>{group.title}</h2>
            {nodes.length ? (
              <div className="graph-card-grid">
                {nodes.map((node) => (
                  <NodeCard
                    key={node.id}
                    node={node}
                    readiness={computeNodeReadiness(node.id, completedSet)}
                    isSelected={node.id === selectedNodeId}
                    onExplore={() => onSelectNode(node.id)}
                    onDetails={() => onShowDetails(node.id)}
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
