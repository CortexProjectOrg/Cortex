import type { GraphNode, KnowledgeDAG } from './knowledgeGraph';

export interface NodeLayout {
  node: GraphNode;
  x: number;
  y: number;
  width: number;
  height: number;
  inX: number; // Top-center port (entering prerequisites)
  inY: number;
  outX: number; // Bottom-center port (outgoing unlocks)
  outY: number;
  level: number;
}

export interface TransitiveReductionResult {
  /**
   * For each visible node id, the list of visible prerequisite ids
   * with transitively redundant edges removed.
   */
  essentialPrerequisites: Map<string, string[]>;
  /**
   * Set of edge IDs ("fromId->toId") that are transitively redundant
   * in the visible subgraph (bypassed through intermediate visible nodes).
   */
  redundantEdges: Set<string>;
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
  transitiveReduction: TransitiveReductionResult;
}

export interface LayoutOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  levelHeight?: number;
  minNodeGap?: number;
  extraBranchGap?: number;
  topPadding?: number;
}

const DEFAULT_OPTIONS: Required<LayoutOptions> = {
  nodeWidth: 220,
  nodeHeight: 78,
  levelHeight: 195,
  minNodeGap: 65,
  extraBranchGap: 45,
  topPadding: 50
};

/**
 * Computes the transitive reduction of the visible subgraph.
 * An edge u -> v is transitively redundant if there is an alternative directed path
 * of length >= 2 from u to v through other visible nodes.
 */
export function computeVisibleTransitiveReduction(
  visibleNodes: GraphNode[],
  dag: KnowledgeDAG
): TransitiveReductionResult {
  const visibleSet = new Set(visibleNodes.map((n) => n.id));
  const essentialPrerequisites = new Map<string, string[]>();
  const redundantEdges = new Set<string>();

  // Map of direct visible prerequisites for each visible node
  const directVisiblePrereqs = new Map<string, string[]>();
  visibleNodes.forEach((node) => {
    directVisiblePrereqs.set(
      node.id,
      node.prerequisites.filter((pId) => visibleSet.has(pId))
    );
  });

  // For each node v, check which of its parents u have an alternative path
  // to v through other visible nodes (i.e. u can reach some other parent w of v).
  visibleNodes.forEach((targetNode) => {
    const parents = directVisiblePrereqs.get(targetNode.id) || [];
    if (parents.length <= 1) {
      essentialPrerequisites.set(targetNode.id, [...parents]);
      return;
    }

    const parentsSet = new Set(parents);
    const essential: string[] = [];

    parents.forEach((u) => {
      let isRedundant = false;
      const visited = new Set<string>([u]);
      const queue = [u];

      while (queue.length > 0) {
        const curr = queue.shift()!;
        const currNode = dag.nodes.get(curr);
        if (!currNode) continue;

        for (const childId of currNode.unlockedLectures) {
          if (!visibleSet.has(childId)) continue;
          if (childId === targetNode.id) continue; // Direct edge to target doesn't count

          if (parentsSet.has(childId) && childId !== u) {
            isRedundant = true;
            break;
          }

          if (!visited.has(childId)) {
            visited.add(childId);
            queue.push(childId);
          }
        }

        if (isRedundant) break;
      }

      if (isRedundant) {
        redundantEdges.add(`${u}->${targetNode.id}`);
      } else {
        essential.push(u);
      }
    });

    essentialPrerequisites.set(targetNode.id, essential);
  });

  return { essentialPrerequisites, redundantEdges };
}

/**
 * Top-to-Bottom Sugiyama-style Barycentric Layout Engine with Transitive Reduction & Collision Resolution.
 * Positions visible DAG nodes strictly top-to-bottom:
 * - Eliminates transitively redundant bypass edges for maximum visual sparsity.
 * - Dynamic level assignment based on visible longest paths.
 * - Parents above children with generous horizontal and vertical breathing room.
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
      bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 },
      transitiveReduction: {
        essentialPrerequisites: new Map(),
        redundantEdges: new Set()
      }
    };
  }

  const visibleSet = new Set(visibleNodes.map((n) => n.id));

  // 1. Compute Transitive Reduction on visible nodes
  const tr = computeVisibleTransitiveReduction(visibleNodes, dag);
  const { essentialPrerequisites } = tr;

  // 2. Assign dynamic levels based on visible topological longest paths
  // Ensures every visible parent sits at a strictly lower level index than its children,
  // without artificial gaps from unexpanded global ranks.
  const levelMap = new Map<string, number>();

  function getNodeLevel(nodeId: string, visiting: Set<string>): number {
    if (levelMap.has(nodeId)) return levelMap.get(nodeId)!;
    if (visiting.has(nodeId)) return 0;
    visiting.add(nodeId);

    const node = dag.nodes.get(nodeId);
    // Use all visible prerequisites to guarantee strict monotonicity
    const parents = node ? node.prerequisites.filter((pId) => visibleSet.has(pId)) : [];

    let maxParentLvl = -1;
    for (const pId of parents) {
      maxParentLvl = Math.max(maxParentLvl, getNodeLevel(pId, visiting));
    }

    visiting.delete(nodeId);
    const lvl = maxParentLvl + 1;
    levelMap.set(nodeId, lvl);
    return lvl;
  }

  const visitingSet = new Set<string>();
  visibleNodes.forEach((node) => {
    getNodeLevel(node.id, visitingSet);
  });

  const maxLevel = Math.max(...Array.from(levelMap.values()), 0);

  const levelBuckets = new Map<number, GraphNode[]>();
  for (let i = 0; i <= maxLevel; i++) {
    levelBuckets.set(i, []);
  }

  visibleNodes.forEach((node) => {
    const lvl = levelMap.get(node.id) ?? 0;
    levelBuckets.get(lvl)!.push(node);
  });

  // Intermediate position tracker
  const posX = new Map<string, number>();

  // 3. Initial placement level-by-level
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
        // Prefer essential structural parents for direct alignment
        const parents = essentialPrerequisites.get(node.id) || [];
        const visibleParents =
          parents.length > 0 ? parents : node.prerequisites.filter((pId) => visibleSet.has(pId));

        if (visibleParents.length > 0) {
          const avgX =
            visibleParents.reduce((sum, pId) => sum + (posX.get(pId) ?? 0), 0) / visibleParents.length;
          preferred.set(node.id, avgX);
        } else {
          preferred.set(node.id, 0);
        }
      }

      // Sort nodes in this level by preferred X
      nodes.sort((a, b) => (preferred.get(a.id) ?? 0) - (preferred.get(b.id) ?? 0));

      // Resolve overlaps left to right with extra branch spacing for sparsity
      placeAndResolveOverlaps(
        nodes,
        preferred,
        posX,
        opts.nodeWidth,
        opts.minNodeGap,
        opts.extraBranchGap,
        essentialPrerequisites
      );
    }
  }

  // 4. Bottom-Up Relaxation Pass (align parents over children centroids)
  for (let lvl = maxLevel - 1; lvl >= 0; lvl--) {
    const nodes = levelBuckets.get(lvl) || [];
    if (!nodes.length) continue;

    const preferred = new Map<string, number>();
    for (const node of nodes) {
      const visibleChildren = node.unlockedLectures.filter((cId) => visibleSet.has(cId));
      if (visibleChildren.length > 0) {
        const childAvgX =
          visibleChildren.reduce((sum, cId) => sum + (posX.get(cId) ?? 0), 0) / visibleChildren.length;
        preferred.set(node.id, (posX.get(node.id)! + childAvgX) / 2);
      } else {
        preferred.set(node.id, posX.get(node.id)!);
      }
    }

    nodes.sort((a, b) => (preferred.get(a.id) ?? 0) - (preferred.get(b.id) ?? 0));
    placeAndResolveOverlaps(
      nodes,
      preferred,
      posX,
      opts.nodeWidth,
      opts.minNodeGap,
      opts.extraBranchGap,
      essentialPrerequisites
    );
  }

  // 5. Top-Down Relaxation Pass (align children under parents centroids)
  for (let lvl = 1; lvl <= maxLevel; lvl++) {
    const nodes = levelBuckets.get(lvl) || [];
    if (!nodes.length) continue;

    const preferred = new Map<string, number>();
    for (const node of nodes) {
      const parents = essentialPrerequisites.get(node.id) || [];
      const visibleParents =
        parents.length > 0 ? parents : node.prerequisites.filter((pId) => visibleSet.has(pId));

      if (visibleParents.length > 0) {
        const parentAvgX =
          visibleParents.reduce((sum, pId) => sum + (posX.get(pId) ?? 0), 0) / visibleParents.length;
        preferred.set(node.id, (posX.get(node.id)! + parentAvgX) / 2);
      } else {
        preferred.set(node.id, posX.get(node.id)!);
      }
    }

    nodes.sort((a, b) => (preferred.get(a.id) ?? 0) - (preferred.get(b.id) ?? 0));
    placeAndResolveOverlaps(
      nodes,
      preferred,
      posX,
      opts.nodeWidth,
      opts.minNodeGap,
      opts.extraBranchGap,
      essentialPrerequisites
    );
  }

  // 6. Centering of all levels
  let overallMinX = Infinity;
  let overallMaxX = -Infinity;
  posX.forEach((x) => {
    overallMinX = Math.min(overallMinX, x);
    overallMaxX = Math.max(overallMaxX, x + opts.nodeWidth);
  });

  const centerOffset = -(overallMinX + overallMaxX) / 2;

  // 7. Build final NodeLayout records with top-down ports
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
    },
    transitiveReduction: tr
  };
}

/**
 * Places nodes sequentially left-to-right enforcing minimum gaps and extra spacing
 * between unrelated branches to favour sparsity.
 */
function placeAndResolveOverlaps(
  nodes: GraphNode[],
  preferred: Map<string, number>,
  posX: Map<string, number>,
  nodeWidth: number,
  minGap: number,
  extraBranchGap: number,
  essentialPrereqs?: Map<string, string[]>
) {
  if (!nodes.length) return;

  const currentX: number[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    let targetX = preferred.get(node.id) ?? posX.get(node.id) ?? 0;
    if (i > 0) {
      const prevX = currentX[i - 1];
      const prevNode = nodes[i - 1];

      // Check if adjacent nodes share any structural parent
      let shareParent = false;
      if (essentialPrereqs) {
        const currParents = new Set(essentialPrereqs.get(node.id) || []);
        const prevParents = essentialPrereqs.get(prevNode.id) || [];
        shareParent = prevParents.some((p) => currParents.has(p));
      }

      // Add extra branch gap between unrelated branches for visual sparsity
      const gap = shareParent || !essentialPrereqs ? minGap : minGap + extraBranchGap;
      if (targetX < prevX + nodeWidth + gap) {
        targetX = prevX + nodeWidth + gap;
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
    target.prerequisites.forEach((pId) => next.add(pId));
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

  target.prerequisites.forEach((pId) => {
    if (protectedIds?.has(pId)) return;
    // Another dependent is visible if it is in `next`, not the target, and not one of the prereqs being collapsed
    const otherVisibleDependent = dag.nodeList.some(
      (n) =>
        n.id !== targetId && !targetPrereqsSet.has(n.id) && next.has(n.id) && n.prerequisites.includes(pId)
    );
    if (!otherVisibleDependent) {
      toRemove.add(pId);
    }
  });

  toRemove.forEach((id) => next.delete(id));
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
    target.unlockedLectures.forEach((uId) => next.add(uId));
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

  target.unlockedLectures.forEach((uId) => {
    if (protectedIds?.has(uId)) return;
    // Another parent is visible if it is in `next`, not the target, and not one of the unlocks being collapsed
    const otherVisibleParent = dag.nodeList.some(
      (n) =>
        n.id !== targetId && !targetUnlocksSet.has(n.id) && next.has(n.id) && n.unlockedLectures.includes(uId)
    );
    if (!otherVisibleParent) {
      toRemove.add(uId);
    }
  });

  toRemove.forEach((id) => next.delete(id));
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
    cur.prerequisites.forEach((pId) => {
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
    cur.unlockedLectures.forEach((uId) => {
      if (!next.has(uId)) {
        next.add(uId);
        queue.push(uId);
      }
    });
  }
  return next;
}

/**
 * Prunes the visible set down to strictly the active focal node,
 * its visible upstream ancestors, and its visible downstream descendants.
 * Prunes unrelated side branches to ensure maximum sparsity and cognitive clarity.
 */
export function pruneToActiveBranch(
  currentVisible: Set<string>,
  targetId: string,
  dag: KnowledgeDAG
): Set<string> {
  const targetNode = dag.nodes.get(targetId);
  if (!targetNode) return currentVisible;

  const activeBranch = new Set<string>([targetId]);

  // Direct and transitive ancestors
  targetNode.allPrerequisites.forEach((pId) => {
    if (currentVisible.has(pId)) activeBranch.add(pId);
  });

  // Direct and transitive descendants
  targetNode.allUnlocked.forEach((uId) => {
    if (currentVisible.has(uId)) activeBranch.add(uId);
  });

  return activeBranch;
}

/**
 * Returns the 1-hop focal neighborhood: target + its direct prerequisites + direct unlocks.
 * If includeDerived is true, also includes derived prerequisites and derived unlocks.
 */
export function getOneHopNeighborhood(
  targetId: string,
  dag: KnowledgeDAG,
  includeDerived: boolean = false
): Set<string> {
  const set = new Set<string>([targetId]);
  const node = dag.nodes.get(targetId);
  if (node) {
    node.prerequisites.forEach((p) => set.add(p));
    node.unlockedLectures.forEach((u) => set.add(u));
    if (includeDerived) {
      (node.derivedPrerequisites || []).forEach((p) => set.add(p));
      (node.derivedUnlocked || []).forEach((u) => set.add(u));
    }
  }
  return set;
}

/**
 * Returns all foundational root nodes with zero prerequisites (Axioms / Bedrock).
 */
export function getBedrockRootNodeIds(dag: KnowledgeDAG): Set<string> {
  const set = new Set<string>();
  dag.nodeList.forEach((node) => {
    if (node.prerequisites.length === 0) {
      set.add(node.id);
    }
  });
  return set;
}
