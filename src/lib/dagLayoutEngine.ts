import type { GraphNode, KnowledgeDAG } from './knowledgeGraph';

export interface NodeLayout {
  node: GraphNode;
  x: number;
  y: number;
  width: number;
  height: number;
  inX: number;  // Top-center port (entering prerequisites)
  inY: number;
  outX: number; // Bottom-center port (outgoing unlocks)
  outY: number;
  level: number;
}

export interface DagLayoutResult {
  layoutMap: Map<string, NodeLayout>;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
  };
}

export interface LayoutOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  levelHeight?: number;
  minNodeGap?: number;
  topPadding?: number;
}

const DEFAULT_OPTIONS: Required<LayoutOptions> = {
  nodeWidth: 230,
  nodeHeight: 84,
  levelHeight: 165,
  minNodeGap: 40,
  topPadding: 60
};

/**
 * Top-to-Bottom Sugiyama-style Barycentric Layout Engine with Collision Resolution.
 * Positions visible DAG nodes strictly top-to-bottom:
 * Bedrock / Axioms at the top -> Foundations -> Intermediate -> Applications at bottom.
 */
export function computeTopDownDagLayout(
  visibleNodes: GraphNode[],
  dag: KnowledgeDAG,
  options: LayoutOptions = {}
): DagLayoutResult {
  const opts: Required<LayoutOptions> = { ...DEFAULT_OPTIONS, ...options };
  const layoutMap = new Map<string, NodeLayout>();

  if (!visibleNodes.length) {
    return {
      layoutMap,
      bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 }
    };
  }

  const visibleSet = new Set(visibleNodes.map(n => n.id));

  // 1. Assign compact normalized levels based on topological ranks of visible nodes
  const activeRanks = Array.from(new Set(visibleNodes.map(n => n.topologicalRank))).sort((a, b) => a - b);
  const rankToLevel = new Map<number, number>();
  activeRanks.forEach((rank, idx) => {
    rankToLevel.set(rank, idx);
  });

  const levelBuckets = new Map<number, GraphNode[]>();
  for (let i = 0; i < activeRanks.length; i++) {
    levelBuckets.set(i, []);
  }

  for (const node of visibleNodes) {
    const level = rankToLevel.get(node.topologicalRank) ?? 0;
    levelBuckets.get(level)!.push(node);
  }

  // Intermediate position tracker
  const posX = new Map<string, number>();

  // 2. Initial placement level-by-level
  const maxLevel = activeRanks.length - 1;

  for (let lvl = 0; lvl <= maxLevel; lvl++) {
    const nodes = levelBuckets.get(lvl) || [];
    if (!nodes.length) continue;

    if (lvl === 0) {
      // Level 0: Sort by lecture number and place centered around X=0
      nodes.sort((a, b) => a.lectureNumber - b.lectureNumber);
      const totalWidth = (nodes.length - 1) * (opts.nodeWidth + opts.minNodeGap);
      const startX = -totalWidth / 2;
      nodes.forEach((n, idx) => {
        posX.set(n.id, startX + idx * (opts.nodeWidth + opts.minNodeGap));
      });
    } else {
      // Compute preferred X as centroid of visible parents in previous levels
      const preferred = new Map<string, number>();

      for (const node of nodes) {
        const visibleParents = node.prerequisites.filter(pId => visibleSet.has(pId));
        if (visibleParents.length > 0) {
          const avgX = visibleParents.reduce((sum, pId) => sum + (posX.get(pId) ?? 0), 0) / visibleParents.length;
          preferred.set(node.id, avgX);
        } else {
          preferred.set(node.id, 0);
        }
      }

      // Sort nodes in this level by preferred X
      nodes.sort((a, b) => (preferred.get(a.id) ?? 0) - (preferred.get(b.id) ?? 0));

      // Resolve overlaps left to right
      placeAndResolveOverlaps(nodes, preferred, posX, opts.nodeWidth, opts.minNodeGap);
    }
  }

  // 3. Bottom-Up Relaxation Pass (align parents over children centroids)
  for (let lvl = maxLevel - 1; lvl >= 0; lvl--) {
    const nodes = levelBuckets.get(lvl) || [];
    if (!nodes.length) continue;

    const preferred = new Map<string, number>();
    for (const node of nodes) {
      const visibleChildren = node.unlockedLectures.filter(cId => visibleSet.has(cId));
      if (visibleChildren.length > 0) {
        const childAvgX = visibleChildren.reduce((sum, cId) => sum + (posX.get(cId) ?? 0), 0) / visibleChildren.length;
        preferred.set(node.id, (posX.get(node.id)! + childAvgX) / 2);
      } else {
        preferred.set(node.id, posX.get(node.id)!);
      }
    }

    nodes.sort((a, b) => (preferred.get(a.id) ?? 0) - (preferred.get(b.id) ?? 0));
    placeAndResolveOverlaps(nodes, preferred, posX, opts.nodeWidth, opts.minNodeGap);
  }

  // 4. Top-Down Relaxation Pass (align children under parents centroids)
  for (let lvl = 1; lvl <= maxLevel; lvl++) {
    const nodes = levelBuckets.get(lvl) || [];
    if (!nodes.length) continue;

    const preferred = new Map<string, number>();
    for (const node of nodes) {
      const visibleParents = node.prerequisites.filter(pId => visibleSet.has(pId));
      if (visibleParents.length > 0) {
        const parentAvgX = visibleParents.reduce((sum, pId) => sum + (posX.get(pId) ?? 0), 0) / visibleParents.length;
        preferred.set(node.id, (posX.get(node.id)! + parentAvgX) / 2);
      } else {
        preferred.set(node.id, posX.get(node.id)!);
      }
    }

    nodes.sort((a, b) => (preferred.get(a.id) ?? 0) - (preferred.get(b.id) ?? 0));
    placeAndResolveOverlaps(nodes, preferred, posX, opts.nodeWidth, opts.minNodeGap);
  }

  // 5. Final centering of all levels
  let overallMinX = Infinity;
  let overallMaxX = -Infinity;
  posX.forEach(x => {
    overallMinX = Math.min(overallMinX, x);
    overallMaxX = Math.max(overallMaxX, x + opts.nodeWidth);
  });

  const centerOffset = -(overallMinX + overallMaxX) / 2;

  // 6. Build final NodeLayout records with ports
  let minY = Infinity;
  let maxY = -Infinity;
  let minX = Infinity;
  let maxX = -Infinity;

  for (let lvl = 0; lvl <= maxLevel; lvl++) {
    const nodes = levelBuckets.get(lvl) || [];
    const y = opts.topPadding + lvl * opts.levelHeight;

    for (const node of nodes) {
      const rawX = posX.get(node.id) ?? 0;
      const x = Math.round(rawX + centerOffset);

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x + opts.nodeWidth);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y + opts.nodeHeight);

      layoutMap.set(node.id, {
        node,
        x,
        y,
        width: opts.nodeWidth,
        height: opts.nodeHeight,
        inX: Math.round(x + opts.nodeWidth / 2),
        inY: y,
        outX: Math.round(x + opts.nodeWidth / 2),
        outY: y + opts.nodeHeight,
        level: lvl
      });
    }
  }

  return {
    layoutMap,
    bounds: {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    }
  };
}

/**
 * Helper to place nodes using preferred X and enforce minimum gaps without overlaps.
 */
function placeAndResolveOverlaps(
  nodes: GraphNode[],
  preferred: Map<string, number>,
  posX: Map<string, number>,
  nodeWidth: number,
  minGap: number
) {
  if (!nodes.length) return;

  const currentX: number[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    let targetX = preferred.get(node.id) ?? (posX.get(node.id) ?? 0);
    if (i > 0) {
      const prevX = currentX[i - 1];
      if (targetX < prevX + nodeWidth + minGap) {
        targetX = prevX + nodeWidth + minGap;
      }
    }
    currentX.push(targetX);
  }

  // Adjust center back towards average preferred center
  const avgPref = nodes.reduce((sum, n) => sum + (preferred.get(n.id) ?? 0), 0) / nodes.length;
  const avgPlaced = currentX.reduce((sum, x) => sum + x, 0) / currentX.length;
  const shift = avgPref - avgPlaced;

  nodes.forEach((n, idx) => {
    posX.set(n.id, currentX[idx] + shift);
  });
}

/**
 * Expands direct prerequisites for a given target node into the visible set.
 */
export function expandNodePrerequisites(
  currentVisible: Set<string>,
  targetId: string,
  dag: KnowledgeDAG
): Set<string> {
  const next = new Set(currentVisible);
  const target = dag.nodes.get(targetId);
  if (target) {
    target.prerequisites.forEach(pId => next.add(pId));
  }
  return next;
}

/**
 * Collapses direct prerequisites of a target node from the visible set,
 * preserving any nodes that are protected or needed by other visible nodes.
 */
export function collapseNodePrerequisites(
  currentVisible: Set<string>,
  targetId: string,
  dag: KnowledgeDAG,
  protectedIds?: Set<string>
): Set<string> {
  const next = new Set(currentVisible);
  const target = dag.nodes.get(targetId);
  if (!target) return next;

  const targetPrereqsSet = new Set(target.prerequisites);
  const toRemove = new Set<string>();

  target.prerequisites.forEach(pId => {
    if (protectedIds?.has(pId)) return;
    // Another dependent is visible if it is in `next`, not the target, and not one of the prereqs being collapsed
    const otherVisibleDependent = dag.nodeList.some(n =>
      n.id !== targetId &&
      !targetPrereqsSet.has(n.id) &&
      next.has(n.id) &&
      n.prerequisites.includes(pId)
    );
    if (!otherVisibleDependent) {
      toRemove.add(pId);
    }
  });

  toRemove.forEach(id => next.delete(id));
  return next;
}

/**
 * Expands direct unlocked downstream lectures for a target node into the visible set.
 */
export function expandNodeUnlocks(
  currentVisible: Set<string>,
  targetId: string,
  dag: KnowledgeDAG
): Set<string> {
  const next = new Set(currentVisible);
  const target = dag.nodes.get(targetId);
  if (target) {
    target.unlockedLectures.forEach(uId => next.add(uId));
  }
  return next;
}

/**
 * Collapses direct unlocked lectures of a target node from the visible set,
 * preserving any nodes that are protected or unlocked by other visible nodes.
 */
export function collapseNodeUnlocks(
  currentVisible: Set<string>,
  targetId: string,
  dag: KnowledgeDAG,
  protectedIds?: Set<string>
): Set<string> {
  const next = new Set(currentVisible);
  const target = dag.nodes.get(targetId);
  if (!target) return next;

  const targetUnlocksSet = new Set(target.unlockedLectures);
  const toRemove = new Set<string>();

  target.unlockedLectures.forEach(uId => {
    if (protectedIds?.has(uId)) return;
    // Another parent is visible if it is in `next`, not the target, and not one of the unlocks being collapsed
    const otherVisibleParent = dag.nodeList.some(n =>
      n.id !== targetId &&
      !targetUnlocksSet.has(n.id) &&
      next.has(n.id) &&
      n.unlockedLectures.includes(uId)
    );
    if (!otherVisibleParent) {
      toRemove.add(uId);
    }
  });

  toRemove.forEach(id => next.delete(id));
  return next;
}

/**
 * Expands all recursive ancestors up to bedrock axioms for a given node.
 */
export function expandAllAncestors(
  currentVisible: Set<string>,
  targetId: string,
  dag: KnowledgeDAG
): Set<string> {
  const next = new Set(currentVisible);
  const queue = [targetId];
  while (queue.length > 0) {
    const curId = queue.shift()!;
    const cur = dag.nodes.get(curId);
    if (!cur) continue;
    cur.prerequisites.forEach(pId => {
      if (!next.has(pId)) {
        next.add(pId);
        queue.push(pId);
      }
    });
  }
  return next;
}

/**
 * Expands all recursive downstream unlocks for a given node.
 */
export function expandAllDescendants(
  currentVisible: Set<string>,
  targetId: string,
  dag: KnowledgeDAG
): Set<string> {
  const next = new Set(currentVisible);
  const queue = [targetId];
  while (queue.length > 0) {
    const curId = queue.shift()!;
    const cur = dag.nodes.get(curId);
    if (!cur) continue;
    cur.unlockedLectures.forEach(uId => {
      if (!next.has(uId)) {
        next.add(uId);
        queue.push(uId);
      }
    });
  }
  return next;
}

/**
 * Returns the 1-hop focal neighborhood: target + its direct prerequisites + direct unlocks.
 */
export function getOneHopNeighborhood(targetId: string, dag: KnowledgeDAG): Set<string> {
  const set = new Set<string>([targetId]);
  const node = dag.nodes.get(targetId);
  if (node) {
    node.prerequisites.forEach(p => set.add(p));
    node.unlockedLectures.forEach(u => set.add(u));
  }
  return set;
}

/**
 * Returns all foundational root nodes with zero prerequisites (Axioms / Bedrock).
 */
export function getBedrockRootNodeIds(dag: KnowledgeDAG): Set<string> {
  const set = new Set<string>();
  dag.nodeList.forEach(node => {
    if (node.prerequisites.length === 0) {
      set.add(node.id);
    }
  });
  return set;
}
