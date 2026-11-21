export interface StudyNode {
  id: string;
  title: string;
  kind: 'catalog' | 'concept' | 'target';
  catalogLectureId?: string;
  lectureNumber?: number;
  minutes: number | null;
}

export interface StudyEdge {
  prerequisiteId: string;
  dependentId: string;
  sources: readonly ('catalog' | 'paper')[];
}

export interface StudyGraph {
  nodes: ReadonlyMap<string, StudyNode>;
  edges: readonly StudyEdge[];
  incoming: ReadonlyMap<string, readonly string[]>;
  outgoing: ReadonlyMap<string, readonly string[]>;
}

export type StudyDirection = 'prerequisites' | 'unlocks';

export function compareStudyNodes(a: StudyNode, b: StudyNode) {
  const left = a.lectureNumber ?? Infinity;
  const right = b.lectureNumber ?? Infinity;
  if (left !== right) return left - right;
  return a.id < b.id ? -1 : a.id === b.id ? 0 : 1;
}

export function buildStudyGraph(nodes: readonly StudyNode[], edges: Iterable<StudyEdge>): StudyGraph {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const incoming = new Map(nodes.map(({ id }) => [id, [] as string[]]));
  const outgoing = new Map(nodes.map(({ id }) => [id, [] as string[]]));
  const edgeByPair = new Map<string, StudyEdge>();
  for (const edge of edges) {
    const prerequisites = incoming.get(edge.dependentId);
    const dependents = outgoing.get(edge.prerequisiteId);
    if (!prerequisites || !dependents) continue;
    const key = JSON.stringify([edge.prerequisiteId, edge.dependentId]);
    const previous = edgeByPair.get(key);
    if (!previous) {
      prerequisites.push(edge.prerequisiteId);
      dependents.push(edge.dependentId);
    }
    edgeByPair.set(key, { ...edge, sources: [...new Set([...(previous?.sources ?? []), ...edge.sources])] });
  }
  const compare = (a: string, b: string) => compareStudyNodes(nodeById.get(a)!, nodeById.get(b)!);
  for (const neighbors of incoming.values()) neighbors.sort(compare);
  for (const neighbors of outgoing.values()) neighbors.sort(compare);
  return { nodes: nodeById, edges: [...edgeByPair.values()], incoming, outgoing };
}

export function getReadiness(graph: StudyGraph, id: string, completed: ReadonlySet<string>) {
  const requirements = graph.incoming.get(id);
  if (!requirements)
    return { status: 'locked' as const, completedPrereqs: [], missingPrereqs: [], percentReady: 0 };
  const completedPrereqs = requirements.filter((prerequisite) => completed.has(prerequisite));
  const missingPrereqs = requirements.filter((prerequisite) => !completed.has(prerequisite));
  const status: 'completed' | 'locked' | 'ready' = completed.has(id)
    ? 'completed'
    : missingPrereqs.length
      ? 'locked'
      : 'ready';
  const percentReady =
    status === 'locked' ? Math.round((completedPrereqs.length / requirements.length) * 100) : 100;
  return { status, completedPrereqs, missingPrereqs, percentReady };
}

export function getNeighborhood(graph: StudyGraph, root: string, direction: StudyDirection, depth: number) {
  if (!graph.nodes.has(root)) return [];
  const adjacency = direction === 'prerequisites' ? graph.incoming : graph.outgoing;
  const visited = new Set([root]);
  const result = [{ id: root, distance: 0 }];
  for (let i = 0; i < result.length; i++) {
    const { id, distance } = result[i];
    if (distance >= depth) continue;
    for (const adjacent of adjacency.get(id) ?? []) {
      if (visited.has(adjacent)) continue;
      visited.add(adjacent);
      result.push({ id: adjacent, distance: distance + 1 });
    }
  }
  return result;
}

export function getShortestRoute(graph: StudyGraph, start: string, goal: string) {
  if (!graph.nodes.has(start) || !graph.nodes.has(goal)) return [];
  const previous = new Map<string, string | null>([[start, null]]);
  const queue = [start];
  for (let i = 0; i < queue.length && !previous.has(goal); i++) {
    for (const adjacent of graph.outgoing.get(queue[i]) ?? []) {
      if (previous.has(adjacent)) continue;
      previous.set(adjacent, queue[i]);
      queue.push(adjacent);
    }
  }
  if (!previous.has(goal)) return [];
  const route = [goal];
  for (let id = previous.get(goal); id != null; id = previous.get(id)) route.push(id);
  return route.reverse();
}

export function getStudyOrder(graph: StudyGraph, goal: string, completed: ReadonlySet<string>) {
  const closure = getNeighborhood(graph, goal, 'prerequisites', Infinity);
  const degree = new Map(closure.map(({ id }) => [id, graph.incoming.get(id)!.length]));
  const compare = (a: string, b: string) => compareStudyNodes(graph.nodes.get(b)!, graph.nodes.get(a)!);
  const available = [...degree.keys()].filter((id) => degree.get(id) === 0).sort(compare);
  const ordered: string[] = [];
  while (available.length) {
    const id = available.pop()!;
    ordered.push(id);
    let added = false;
    for (const dependent of graph.outgoing.get(id) ?? []) {
      const current = degree.get(dependent);
      if (current === undefined) continue;
      degree.set(dependent, current - 1);
      if (current === 1) {
        available.push(dependent);
        added = true;
      }
    }
    if (added) available.sort(compare);
  }
  if (ordered.length !== closure.length) throw new Error('The study graph contains a cycle.');

  const active = new Set<string>();
  const required = degree.has(goal) ? [goal] : [];
  while (required.length) {
    const id = required.pop()!;
    if (completed.has(id) || active.has(id)) continue;
    active.add(id);
    required.push(...(graph.incoming.get(id) ?? []));
  }
  const remaining = ordered.filter((id) => !completed.has(id) && graph.nodes.get(id)!.kind !== 'target');
  const background = new Set(remaining.filter((id) => !active.has(id)));
  const next = remaining.find(
    (id) => active.has(id) && getReadiness(graph, id, completed).status === 'ready'
  );
  let remainingMinutes = 0;
  let unknownDurationCount = 0;
  for (const id of remaining) {
    const minutes = graph.nodes.get(id)!.minutes;
    if (minutes === null) unknownDurationCount++;
    else remainingMinutes += minutes;
  }
  return { ordered, remaining, background, next, remainingMinutes, unknownDurationCount };
}
