import type { StudyDirection, StudyGraph } from './studyGraph';

export type Expansions = Record<string, Partial<Record<StudyDirection, boolean>>>;

export function visibleBranch(graph: StudyGraph, root: string, open: Expansions, budget = 120) {
  const seen = new Set<string>();
  const pending = [root];
  while (pending.length) {
    const id = pending.pop()!;
    if (seen.has(id)) continue;
    if (seen.size >= budget) return { seen, limited: true };
    seen.add(id);
    const children: string[] = [];
    for (const direction of ['prerequisites', 'unlocks'] as const) {
      if (!(open[id]?.[direction] ?? id === root)) continue;
      const neighbors = direction === 'prerequisites' ? graph.incoming : graph.outgoing;
      children.push(...(neighbors.get(id) ?? []));
    }
    // Visit deliberately opened branches before filling the remaining budget with default siblings.
    children.sort((a, b) => Number(!!open[b]) - Number(!!open[a]));
    for (const child of children.reverse()) if (!seen.has(child)) pending.push(child);
  }
  return { seen, limited: false };
}
