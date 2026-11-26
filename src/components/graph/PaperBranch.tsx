import type { ReactNode } from 'react';
import { visibleBranch, type Expansions } from '../../lib/visibleBranch';
import type { StudyDirection, StudyGraph } from '../../lib/studyGraph';
import { CompactNode } from './CompactNode';

export function PaperBranch({
  graph,
  root,
  selected,
  branches,
  toggle,
  inspect
}: {
  graph: StudyGraph;
  root: string;
  selected: string;
  branches: Expansions;
  toggle: (id: string, d: StudyDirection) => void;
  inspect: (id: string) => void;
}) {
  const { seen, limited } = visibleBranch(graph, root, branches);
  const visited = new Set<string>();
  function branch(id: string): ReactNode {
    visited.add(id);
    const node = graph.nodes.get(id)!;
    const isOpen = (d: StudyDirection) => branches[id]?.[d] ?? id === root;
    return (
      <li key={id}>
        <CompactNode
          title={node.title}
          incoming={graph.incoming.get(id)?.length ?? 0}
          outgoing={graph.outgoing.get(id)?.length ?? 0}
          isOpen={isOpen}
          toggle={(d) => toggle(id, d)}
          info={() => inspect(id)}
          selected={id === selected}
        />
        {(['prerequisites', 'unlocks'] as const).map((d) => {
          if (!isOpen(d)) return null;
          const children =
            (d === 'prerequisites' ? graph.incoming : graph.outgoing).get(id)?.filter((n) => seen.has(n)) ??
            [];
          return (
            children.length > 0 && (
              <ul key={d} aria-label={d === 'prerequisites' ? 'Prerequisites' : 'Next lectures'}>
                {children.map((n) =>
                  visited.has(n) ? (
                    <li key={n}>
                      <button className="text-button" onClick={() => inspect(n)}>
                        {graph.nodes.get(n)!.title} · Shared
                      </button>
                    </li>
                  ) : (
                    branch(n)
                  )
                )}
              </ul>
            )
          );
        })}
      </li>
    );
  }
  return (
    <nav className="paper-branch" aria-label="Theorem dependency tree">
      <ul>{branch(root)}</ul>
      {limited && <p>Open Info to see every direct connection.</p>}
    </nav>
  );
}
