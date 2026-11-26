import './knowledgeMap.css';
import { useState, type ReactNode } from 'react';
import { ArrowDownFromLine, ArrowUpFromLine, ChevronRight, Check } from 'lucide-react';
import { type StudyGraph } from '../lib/studyGraph';
export function DagRamificationExplorer({
  graph,
  id,
  completed,
  onSelect,
  children,
  track
}: {
  graph: StudyGraph;
  id: string;
  completed: ReadonlySet<string>;
  onSelect: (id: string) => void;
  children: ReactNode;
  track?: ReadonlySet<string>;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  function lane(before: boolean) {
    const ids = (before ? graph.incoming : graph.outgoing).get(id) ?? [];
    const label = before ? 'Prerequisites' : 'Next lectures',
      key = id + ':' + label;
    return (
      <section className={'connection-lane ' + (before ? 'incoming' : 'outgoing')} aria-label={label}>
        <h2>
          {before ? <ArrowUpFromLine size={15} /> : <ArrowDownFromLine size={15} />} {label}{' '}
          <small>{ids.length}</small>
        </h2>
        {ids.length === 0 && (
          <p className="subtle">{before ? 'No prerequisites' : 'No dependent lectures'}</p>
        )}
        <ul className="connection-list">
          {ids.slice(0, expanded[key] ? undefined : 4).map((n) => (
            <li key={n}>
              <button
                type="button"
                onClick={() => onSelect(n)}
                aria-label={'Explore ' + graph.nodes.get(n)!.title}
              >
                <strong>{graph.nodes.get(n)!.title}</strong>
                {completed.has(n) && (
                  <small>
                    <Check size={12} /> Done
                  </small>
                )}
                {track && !track.has(n) && <small>Outside this track</small>}
                <ChevronRight size={15} />
              </button>
            </li>
          ))}
        </ul>
        {ids.length > 4 && (
          <button
            type="button"
            className="text-button"
            aria-expanded={!!expanded[key]}
            onClick={() => setExpanded({ ...expanded, [key]: !expanded[key] })}
          >
            {expanded[key] ? 'Show fewer' : 'Show all connections (' + ids.length + ')'}
          </button>
        )}
      </section>
    );
  }
  return (
    <div className="connection-explorer">
      <div className="connection-diagram">
        {lane(true)}
        <section className="connection-focus" aria-label="Selected lesson">
          {children}
        </section>
        {lane(false)}
      </div>
    </div>
  );
}
