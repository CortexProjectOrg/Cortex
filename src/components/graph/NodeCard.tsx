import { BookOpen, CheckCircle2, GitBranch, Info, Lock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { GraphNode, computeNodeReadiness } from '../../lib/knowledgeGraph';
interface NodeCardProps {
  node: GraphNode;
  readiness: ReturnType<typeof computeNodeReadiness>;
  isSelected: boolean;
  onExplore: () => void;
  onDetails: () => void;
  context?: string;
  variant?: 'list' | 'canvas';
}
export function NodeCard({
  node,
  readiness,
  isSelected,
  onExplore,
  onDetails,
  context,
  variant = 'list'
}: NodeCardProps) {
  const completed = readiness.status === 'completed',
    ready = readiness.status === 'ready';
  return (
    <article
      className={`graph-node-card graph-node-card--${variant}`}
      aria-label={node.title}
      data-selected={isSelected}
    >
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
      {context && <span className="graph-node-context">{context}</span>}
      <div className="graph-node-actions" onPointerDown={(event) => event.stopPropagation()}>
        <button type="button" onClick={onExplore} aria-label={`Explore ${node.title}`}>
          <GitBranch size={14} /> Explore
        </button>
        <button type="button" onClick={onDetails} aria-label={`Details for ${node.title}`}>
          <Info size={14} /> Details
        </button>
        <Link to={`/topics/${node.topicId}/${node.id}`} aria-label={`Read ${node.title}`}>
          <BookOpen size={14} /> Read
        </Link>
      </div>
    </article>
  );
}
