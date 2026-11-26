import { ArrowDownFromLine, ArrowUpFromLine, Info } from 'lucide-react';
import type { StudyDirection } from '../../lib/studyGraph';
export function CompactNode({
  title,
  incoming,
  outgoing,
  isOpen,
  toggle,
  info,
  selected = false
}: {
  title: string;
  incoming: number;
  outgoing: number;
  isOpen: (d: StudyDirection) => boolean;
  toggle: (d: StudyDirection) => void;
  info: (opener: HTMLButtonElement) => void;
  selected?: boolean;
}) {
  return (
    <article className="compact-node" aria-label={title} data-selected={selected}>
      <strong>{title}</strong>
      <div className="study-actions">
        {(['prerequisites', 'unlocks'] as const).map((d) => {
          const before = d === 'prerequisites',
            count = before ? incoming : outgoing;
          if (!count) return null;
          const label = (before ? 'Prerequisites' : 'Next lectures') + ' for ' + title + ' (' + count + ')';
          return (
            <button
              className="icon-button"
              key={d}
              type="button"
              title={label}
              aria-label={label}
              aria-expanded={isOpen(d)}
              onClick={() => toggle(d)}
            >
              {before ? <ArrowUpFromLine size={16} /> : <ArrowDownFromLine size={16} />}
            </button>
          );
        })}
        <button
          className="icon-button"
          type="button"
          aria-label={'Info for ' + title}
          title={'Info for ' + title}
          onClick={(e) => info(e.currentTarget)}
        >
          <Info size={17} />
        </button>
      </div>
    </article>
  );
}
