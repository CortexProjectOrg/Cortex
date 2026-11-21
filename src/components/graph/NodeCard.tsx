import { BookOpen, CheckCircle2, GitBranch, Info, Lock, Sparkles, UnfoldVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { GraphNode, computeNodeReadiness } from '../../lib/knowledgeGraph';
import type { StudyDirection } from '../../lib/studyGraph';

export interface StudyCardActions {
  select: (id: string) => void;
  branch: (id: string, direction: StudyDirection) => void;
  start: (id: string) => void;
  goal: (id: string) => void;
}

interface NodeCardProps {
  node: GraphNode;
  readiness: ReturnType<typeof computeNodeReadiness>;
  isSelected: boolean;
  onExplore: () => void;
  onDetails: (opener: HTMLButtonElement) => void;
  onExpand?: () => void;
  isExpanded?: boolean;
  context?: string;
  variant?: 'list' | 'canvas';
  studyActions?: StudyCardActions;
}
export function NodeCard({
  node,
  readiness,
  isSelected,
  onExplore,
  onDetails,
  onExpand,
  isExpanded = false,
  context,
  variant = 'list',
  studyActions
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
      {studyActions ? (
        <button
          className="graph-node-title"
          type="button"
          aria-pressed={isSelected}
          onClick={() => studyActions.select(node.id)}
        >
          <strong>{node.title}</strong>
        </button>
      ) : (
        <strong>{node.title}</strong>
      )}
      {context && <span className="graph-node-context">{context}</span>}
      <div className="graph-node-actions" onPointerDown={(event) => event.stopPropagation()}>
        <button type="button" onClick={onExplore} aria-label={`Explore ${node.title}`}>
          <GitBranch size={14} /> Explore
        </button>
        {onExpand && (
          <button
            type="button"
            onClick={onExpand}
            aria-label={isExpanded ? `Collapse ${node.title} to 1-hop` : `Expand ${node.title}`}
          >
            <UnfoldVertical size={14} /> {isExpanded ? '1-Hop' : 'Expand'}
          </button>
        )}
        <button
          type="button"
          onClick={(event) => onDetails(event.currentTarget)}
          aria-label={`Details for ${node.title}`}
        >
          <Info size={14} /> Details
        </button>
        <Link to={`/topics/${node.topicId}/${node.id}`} aria-label={`Read ${node.title}`}>
          <BookOpen size={14} /> Read
        </Link>
      </div>
      {studyActions && (
        <div
          className="graph-node-actions graph-study-actions"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button type="button" onClick={() => studyActions.branch(node.id, 'prerequisites')}>
            Prerequisites
          </button>
          <button type="button" onClick={() => studyActions.branch(node.id, 'unlocks')}>
            What this unlocks
          </button>
          {isSelected && (
            <>
              <button type="button" onClick={() => studyActions.start(node.id)}>
                Set as start
              </button>
              <button type="button" onClick={() => studyActions.goal(node.id)}>
                Set as goal
              </button>
            </>
          )}
        </div>
      )}
    </article>
  );
}
