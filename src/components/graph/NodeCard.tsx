import { CheckCircle2, Lock, Sparkles } from 'lucide-react';
import type { GraphNode, computeNodeReadiness } from '../../lib/knowledgeGraph';
interface NodeCardProps {
  node: GraphNode;
  readiness: ReturnType<typeof computeNodeReadiness>;
  isSelected: boolean;
  onClick: () => void;
}
export function NodeCard({ node, readiness, isSelected, onClick }: NodeCardProps) {
  const completed = readiness.status === 'completed',
    ready = readiness.status === 'ready';
  return (
    <button className="graph-node-card" aria-pressed={isSelected} onClick={onClick}>
      <span className="graph-node-meta">
        <span>Lecture {node.lectureNumber}</span>
        <span>
          {completed ? (
            <>
              <CheckCircle2 size={14} />
              Done
            </>
          ) : ready ? (
            <>
              <Sparkles size={14} />
              Ready
            </>
          ) : (
            <>
              <Lock size={14} />
              {readiness.missingPrereqs.length} to study first
            </>
          )}
        </span>
      </span>
      <strong>{node.title}</strong>
    </button>
  );
}
