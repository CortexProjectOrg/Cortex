/**
 * Knowledge DAG & Dependency Graph for Cortex Monothematic Lectures
 *
 * Implements a strict Directed Acyclic Graph (DAG) for all 60 foundational lectures.
 * Every lecture has explicit hard dependencies (prerequisites) guaranteed to be cycle-free
 * via Kahn's algorithm. Terminal apex concepts build strictly upon upstream foundational nodes.
 *
 * Also models cross-disciplinary "soft links" representing conceptual cross-contamination
 * across fields (e.g. symplectic geometry <-> fermionic matchgates, stabilizer tableaux <-> QEC codes).
 */

import { ALL_LECTURES, TOPICS, type Lecture, type Topic } from './curriculumCatalog';

export interface SoftLink {
  targetId: string;
  relationship: string;
}

export interface GraphNode {
  id: string;
  lectureNumber: number;
  title: string;
  subtitle: string;
  topicId: string;
  topicNumber: number;
  topicTitle: string;
  topicColor: string;
  packNumber: number;
  packSlot: number;
  question: string;
  prerequisites: string[]; // Direct hard prerequisites (structural predecessors)
  unlockedLectures: string[]; // Direct downstream lectures (structural dependents)
  derivedPrerequisites: string[]; // Derived prerequisites bypassed via intermediate lectures
  derivedUnlocked: string[]; // Derived downstream unlocks bypassed via intermediate lectures
  rawPrerequisites: string[]; // Raw declared prerequisites before reduction
  allPrerequisites: string[]; // Complete transitive ancestors (topological order)
  allUnlocked: string[]; // Complete transitive descendants
  softLinks: SoftLink[]; // Cross-field cross-contamination links
  inDegree: number;
  outDegree: number;
  topologicalRank: number; // Tier / depth (0 for root, 1, 2...)
}

export interface KnowledgeDAG {
  nodes: Map<string, GraphNode>;
  nodeList: GraphNode[];
  topologicalOrder: string[];
  layers: Array<{ rank: number; title: string; nodes: GraphNode[] }>;
  isAcyclic: boolean;
  cycleNodes?: string[];
  totalPrerequisiteEdges: number;
  totalDirectEdges: number;
  totalDerivedEdges: number;
  totalSoftLinks: number;
}

export interface NodeReadiness {
  status: 'completed' | 'ready' | 'locked';
  completedPrereqs: string[];
  missingPrereqs: string[];
  percentReady: number;
}

/**
 * Mathematically grounded hard prerequisites and cross-disciplinary soft links
 * for all 60 monothematic lectures.
 *
 * Hard prerequisites: strictly necessary theoretical foundations.
 * Soft links: cross-pollinated insights between distinct fields.
 */
export const LECTURE_DEPENDENCIES: Record<string, { prereqs: string[]; softLinks: SoftLink[] }> =
  Object.fromEntries(
    ALL_LECTURES.map((lecture) => [
      lecture.id,
      { prereqs: lecture.prerequisites, softLinks: lecture.softLinks || [] }
    ])
  );

/**
 * Builds and validates the Knowledge DAG.
 * Uses Kahn's algorithm to strictly verify acyclicity and determine topological rank.
 */
export function buildKnowledgeDAG(
  lectures: Omit<Lecture, 'content'>[] = ALL_LECTURES,
  topics: Topic[] = TOPICS
): KnowledgeDAG {
  const topicMap = new Map<string, Topic>(topics.map((t) => [t.id, t]));

  // Initialize nodes
  const nodeMap = new Map<string, GraphNode>();
  const rawPrereqsMap = new Map<string, string[]>();
  const rawAdjacencyList = new Map<string, string[]>();
  const rawInDegreeMap = new Map<string, number>();

  let totalSoftLinks = 0;

  for (const lecture of lectures) {
    const topic = topicMap.get(lecture.topicId) || topics[0];
    const depData = { prereqs: lecture.prerequisites, softLinks: lecture.softLinks || [] };
    const rawPrereqs = [...depData.prereqs];
    rawPrereqsMap.set(lecture.id, rawPrereqs);
    totalSoftLinks += depData.softLinks.length;

    nodeMap.set(lecture.id, {
      id: lecture.id,
      lectureNumber: lecture.lectureNumber,
      title: lecture.title,
      subtitle: lecture.subtitle,
      topicId: lecture.topicId,
      topicNumber: topic.number,
      topicTitle: topic.title,
      topicColor: topic.color,
      packNumber: lecture.packNumber || lecture.sundaySession || 1,
      packSlot: lecture.packSlot || lecture.sundaySlot || 1,
      question: lecture.question,
      prerequisites: [], // populated with direct prerequisites below
      unlockedLectures: [], // populated with direct unlocks below
      derivedPrerequisites: [],
      derivedUnlocked: [],
      rawPrerequisites: rawPrereqs,
      allPrerequisites: [],
      allUnlocked: [],
      softLinks: [...depData.softLinks],
      inDegree: 0,
      outDegree: 0,
      topologicalRank: 0
    });

    rawInDegreeMap.set(lecture.id, 0);
    rawAdjacencyList.set(lecture.id, []);
  }

  // Populate raw edges & in-degrees
  for (const [id, rawPrereqs] of rawPrereqsMap.entries()) {
    for (const prereqId of rawPrereqs) {
      if (nodeMap.has(prereqId)) {
        rawAdjacencyList.get(prereqId)!.push(id);
        rawInDegreeMap.set(id, (rawInDegreeMap.get(id) || 0) + 1);
      } else {
        console.warn(`Prerequisite '${prereqId}' not found in lectures for node '${id}'.`);
      }
    }
  }

  // Kahn's algorithm for topological sort and cycle detection on raw graph
  const currentInDegree = new Map<string, number>(rawInDegreeMap);
  const queue: string[] = [];

  for (const [id, degree] of currentInDegree.entries()) {
    if (degree === 0) {
      queue.push(id);
    }
  }

  const topologicalOrder: string[] = [];

  while (queue.length > 0) {
    const u = queue.shift()!;
    topologicalOrder.push(u);

    for (const v of rawAdjacencyList.get(u) || []) {
      const remainingDegree = (currentInDegree.get(v) || 0) - 1;
      currentInDegree.set(v, remainingDegree);
      if (remainingDegree === 0) {
        queue.push(v);
      }
    }
  }

  const isAcyclic = topologicalOrder.length === lectures.length;
  const cycleNodes = isAcyclic
    ? undefined
    : lectures.map((l) => l.id).filter((id) => !topologicalOrder.includes(id));

  // Compute full transitive ancestors in topological order
  const fullAncestorsMap = new Map<string, Set<string>>();
  for (const id of topologicalOrder) {
    const ancestors = new Set<string>();
    const rawParents = rawPrereqsMap.get(id) || [];
    for (const p of rawParents) {
      ancestors.add(p);
      const parentAncestors = fullAncestorsMap.get(p);
      if (parentAncestors) {
        parentAncestors.forEach((a) => ancestors.add(a));
      }
    }
    fullAncestorsMap.set(id, ancestors);
  }

  // Global Transitive Reduction: Classify raw dependencies as DIRECT or DERIVED
  // A raw parent u of node v is DERIVED if there exists another raw parent w of v (w !== u)
  // such that u is an ancestor of w (i.e. alternative path u -> ... -> w -> v exists).
  // Otherwise, u is a strictly DIRECT prerequisite!
  const directPrereqsMap = new Map<string, string[]>();
  const derivedPrereqsMap = new Map<string, string[]>();

  for (const id of topologicalOrder) {
    const rawParents = rawPrereqsMap.get(id) || [];
    const direct: string[] = [];
    const derived: string[] = [];

    for (const u of rawParents) {
      let isDerived = false;
      for (const w of rawParents) {
        if (w !== u && fullAncestorsMap.get(w)?.has(u)) {
          isDerived = true;
          break;
        }
      }
      if (isDerived) {
        derived.push(u);
      } else {
        direct.push(u);
      }
    }

    directPrereqsMap.set(id, direct);
    derivedPrereqsMap.set(id, derived);
  }

  // Populate direct and derived unlocks across all nodes
  const directUnlockedMap = new Map<string, string[]>();
  const derivedUnlockedMap = new Map<string, string[]>();
  for (const id of topologicalOrder) {
    directUnlockedMap.set(id, []);
    derivedUnlockedMap.set(id, []);
  }

  for (const id of topologicalOrder) {
    for (const p of directPrereqsMap.get(id) || []) {
      directUnlockedMap.get(p)?.push(id);
    }
    for (const p of derivedPrereqsMap.get(id) || []) {
      derivedUnlockedMap.get(p)?.push(id);
    }
  }

  let totalDirectEdges = 0;
  let totalDerivedEdges = 0;

  for (const [id, node] of nodeMap.entries()) {
    const directPrereqs = directPrereqsMap.get(id) || [];
    const derivedPrereqs = derivedPrereqsMap.get(id) || [];
    const directUnlocked = directUnlockedMap.get(id) || [];
    const derivedUnlocked = derivedUnlockedMap.get(id) || [];

    node.prerequisites = directPrereqs;
    node.derivedPrerequisites = derivedPrereqs;
    node.unlockedLectures = directUnlocked;
    node.derivedUnlocked = derivedUnlocked;
    node.inDegree = directPrereqs.length;
    node.outDegree = directUnlocked.length;

    totalDirectEdges += directPrereqs.length;
    totalDerivedEdges += derivedPrereqs.length;
  }

  // Compute topological rank (depth from root) based on direct prerequisites
  for (const id of topologicalOrder) {
    const node = nodeMap.get(id)!;
    if (node.prerequisites.length === 0) {
      node.topologicalRank = 0;
    } else {
      const maxPrereqRank = Math.max(...node.prerequisites.map((p) => nodeMap.get(p)?.topologicalRank ?? 0));
      node.topologicalRank = maxPrereqRank + 1;
    }
  }

  // Compute transitive ancestors (allPrerequisites) in topological order
  for (const id of topologicalOrder) {
    const node = nodeMap.get(id)!;
    const ancestors = Array.from(fullAncestorsMap.get(id) || []);
    node.allPrerequisites = ancestors.sort((a, b) => {
      return (nodeMap.get(a)?.topologicalRank ?? 0) - (nodeMap.get(b)?.topologicalRank ?? 0);
    });
  }

  // Compute transitive descendants (allUnlocked) in reverse topological order
  for (let i = topologicalOrder.length - 1; i >= 0; i--) {
    const id = topologicalOrder[i];
    const node = nodeMap.get(id)!;
    const descendantSet = new Set<string>();

    for (const childId of node.unlockedLectures) {
      descendantSet.add(childId);
      const childDescendants = nodeMap.get(childId)?.allUnlocked || [];
      for (const d of childDescendants) {
        descendantSet.add(d);
      }
    }
    node.allUnlocked = Array.from(descendantSet).sort((a, b) => {
      return (nodeMap.get(a)?.topologicalRank ?? 0) - (nodeMap.get(b)?.topologicalRank ?? 0);
    });
  }

  // Build stratified layers
  const maxRank = Math.max(0, ...Array.from(nodeMap.values()).map((n) => n.topologicalRank));
  const layers: Array<{ rank: number; title: string; nodes: GraphNode[] }> = [];

  const tierTitles: Record<number, string> = {
    0: 'Foundational Bedrock',
    1: 'Algebraic Structures',
    2: 'Linear & Symplectic Forms',
    3: 'Symplectic Groups & Quantum States',
    4: 'Entanglement & Single-Qubit Pauli',
    5: 'N-Qubit Pauli & Binary Representation',
    6: 'Clifford Group Normalizers',
    7: 'Stabilizer Formalism & Tableaux',
    8: 'Measurement & Polynomial Simulation',
    9: 'Compiler Routes & Normal Forms',
    10: 'Many-Body Models & Lattice Hamiltonians',
    11: 'Hamiltonian Symmetries & Graph Automorphisms',
    12: 'Symmetry Sector Diagonalization',
    13: 'Krylov Subspaces & Power Iteration',
    14: 'Matrix-Free Lanczos Solvers',
    15: 'Measurement Budgets & Variances',
    16: 'Commutation Graphs & Maximal Cliques',
    17: 'Simultaneous Measurement Rotations',
    18: 'Bayesian Shot Allocation & MCMC',
    19: 'Majorana Modes & Error Mitigation',
    20: 'Fermionic Matchgate Polynomial Simulation',
    21: 'QEC Codes & CUDA Kernels',
    22: 'Apex Frontiers: Multi-GPU Lanczos & Qudits'
  };

  for (let r = 0; r <= maxRank; r++) {
    const nodesInRank = Array.from(nodeMap.values())
      .filter((n) => n.topologicalRank === r)
      .sort((a, b) => a.lectureNumber - b.lectureNumber);

    if (nodesInRank.length > 0) {
      layers.push({
        rank: r,
        title: tierTitles[r] || `Tier ${r}`,
        nodes: nodesInRank
      });
    }
  }

  const nodeList = Array.from(nodeMap.values()).sort((a, b) => a.lectureNumber - b.lectureNumber);

  return {
    nodes: nodeMap,
    nodeList,
    topologicalOrder,
    layers,
    isAcyclic,
    cycleNodes,
    totalPrerequisiteEdges: totalDirectEdges,
    totalDirectEdges,
    totalDerivedEdges,
    totalSoftLinks
  };
}

// Singleton cached instance
let cachedDAG: KnowledgeDAG | null = null;

export function getKnowledgeDAG(): KnowledgeDAG {
  if (!cachedDAG) {
    cachedDAG = buildKnowledgeDAG(ALL_LECTURES);
  }
  return cachedDAG;
}

/**
 * Computes readiness status for a lecture based on completed lectures.
 */
export function computeNodeReadiness(
  nodeId: string,
  completedLectureIds: Set<string> | string[]
): NodeReadiness {
  const dag = getKnowledgeDAG();
  const node = dag.nodes.get(nodeId);
  const completedSet =
    completedLectureIds instanceof Set ? completedLectureIds : new Set(completedLectureIds);

  if (!node) {
    return {
      status: 'locked',
      completedPrereqs: [],
      missingPrereqs: [],
      percentReady: 0
    };
  }

  const isCompleted = completedSet.has(nodeId);
  const totalPrereqs = node.prerequisites.length;

  if (totalPrereqs === 0) {
    return {
      status: isCompleted ? 'completed' : 'ready',
      completedPrereqs: [],
      missingPrereqs: [],
      percentReady: 100
    };
  }

  const completedPrereqs: string[] = [];
  const missingPrereqs: string[] = [];

  for (const p of node.prerequisites) {
    if (completedSet.has(p)) {
      completedPrereqs.push(p);
    } else {
      missingPrereqs.push(p);
    }
  }

  const percentReady = Math.round((completedPrereqs.length / totalPrereqs) * 100);

  if (isCompleted) {
    return {
      status: 'completed',
      completedPrereqs,
      missingPrereqs,
      percentReady: 100
    };
  }

  if (missingPrereqs.length === 0) {
    return {
      status: 'ready',
      completedPrereqs,
      missingPrereqs: [],
      percentReady: 100
    };
  }

  return {
    status: 'locked',
    completedPrereqs,
    missingPrereqs,
    percentReady
  };
}

export interface TopicRamification {
  topic: Topic;
  lectures: GraphNode[];
  prerequisiteTopics: Array<{
    topic: Topic;
    crossEdgesCount: number;
    samplePrereqs: GraphNode[];
  }>;
  nextTopics: Array<{
    topic: Topic;
    crossEdgesCount: number;
    sampleUnlocked: GraphNode[];
  }>;
  entryLectures: GraphNode[];
  exitLectures: GraphNode[];
  internalProgression: Array<{ from: GraphNode; to: GraphNode }>;
  softLinkedTopics: Array<{
    topic: Topic;
    fromLecture: GraphNode;
    toLecture: GraphNode;
    relationship: string;
  }>;
}

export interface LectureRamification {
  node: GraphNode;
  directPrerequisites: GraphNode[];
  ancestorTiers: Array<{ distance: number; title: string; nodes: GraphNode[] }>;
  directUnlocked: GraphNode[];
  descendantTiers: Array<{ distance: number; title: string; nodes: GraphNode[] }>;
  softLinks: Array<{ targetNode: GraphNode; relationship: string }>;
  readyToTackleNext: GraphNode[];
}

/**
 * Calculates topic-level ramifications: which topics are needed first,
 * how lectures progress internally, and which next topics are unlocked.
 */
export function getTopicRamification(
  topicId: string,
  dag: KnowledgeDAG = getKnowledgeDAG()
): TopicRamification | null {
  const topic = TOPICS.find((t) => t.id === topicId);
  if (!topic) return null;

  const topicLectures = dag.nodeList.filter((n) => n.topicId === topicId);
  const prereqTopicMap = new Map<string, { count: number; nodes: Set<string> }>();
  const nextTopicMap = new Map<string, { count: number; nodes: Set<string> }>();
  const internalProgression: Array<{ from: GraphNode; to: GraphNode }> = [];
  const entryLectures: GraphNode[] = [];
  const exitLectures: GraphNode[] = [];

  for (const node of topicLectures) {
    let hasInternalPrereq = false;
    let hasExternalPrereq = false;

    for (const pId of node.prerequisites) {
      const pNode = dag.nodes.get(pId);
      if (!pNode) continue;

      if (pNode.topicId === topicId) {
        hasInternalPrereq = true;
        internalProgression.push({ from: pNode, to: node });
      } else {
        hasExternalPrereq = true;
        if (!prereqTopicMap.has(pNode.topicId)) {
          prereqTopicMap.set(pNode.topicId, { count: 0, nodes: new Set() });
        }
        const entry = prereqTopicMap.get(pNode.topicId)!;
        entry.count++;
        entry.nodes.add(pId);
      }
    }

    if (!hasInternalPrereq || hasExternalPrereq || node.prerequisites.length === 0) {
      entryLectures.push(node);
    }

    let unlocksExternal = false;
    for (const uId of node.unlockedLectures) {
      const uNode = dag.nodes.get(uId);
      if (!uNode) continue;

      if (uNode.topicId !== topicId) {
        unlocksExternal = true;
        if (!nextTopicMap.has(uNode.topicId)) {
          nextTopicMap.set(uNode.topicId, { count: 0, nodes: new Set() });
        }
        const entry = nextTopicMap.get(uNode.topicId)!;
        entry.count++;
        entry.nodes.add(uId);
      }
    }

    if (unlocksExternal) {
      exitLectures.push(node);
    }
  }

  const prerequisiteTopics = Array.from(prereqTopicMap.entries())
    .map(([tId, info]) => {
      const t = TOPICS.find((top) => top.id === tId)!;
      return {
        topic: t,
        crossEdgesCount: info.count,
        samplePrereqs: Array.from(info.nodes)
          .map((id) => dag.nodes.get(id)!)
          .filter(Boolean)
      };
    })
    .sort((a, b) => a.topic.number - b.topic.number);

  const nextTopics = Array.from(nextTopicMap.entries())
    .map(([tId, info]) => {
      const t = TOPICS.find((top) => top.id === tId)!;
      return {
        topic: t,
        crossEdgesCount: info.count,
        sampleUnlocked: Array.from(info.nodes)
          .map((id) => dag.nodes.get(id)!)
          .filter(Boolean)
      };
    })
    .sort((a, b) => a.topic.number - b.topic.number);

  const softLinkedTopics: TopicRamification['softLinkedTopics'] = [];
  for (const node of topicLectures) {
    for (const link of node.softLinks) {
      const targetNode = dag.nodes.get(link.targetId);
      if (targetNode && targetNode.topicId !== topicId) {
        const targetTopic = TOPICS.find((t) => t.id === targetNode.topicId);
        if (targetTopic) {
          softLinkedTopics.push({
            topic: targetTopic,
            fromLecture: node,
            toLecture: targetNode,
            relationship: link.relationship
          });
        }
      }
    }
  }

  return {
    topic,
    lectures: topicLectures,
    prerequisiteTopics,
    nextTopics,
    entryLectures,
    exitLectures,
    internalProgression,
    softLinkedTopics
  };
}

/**
 * Calculates lecture-level ramifications: upstream ancestry branches,
 * downstream unlocked branches, and next actionable lectures.
 */
export function getLectureRamification(
  nodeId: string,
  completedSet: Set<string> = new Set(),
  dag: KnowledgeDAG = getKnowledgeDAG()
): LectureRamification | null {
  const node = dag.nodes.get(nodeId);
  if (!node) return null;

  const directPrerequisites = node.prerequisites.map((p) => dag.nodes.get(p)!).filter(Boolean);

  const directUnlocked = node.unlockedLectures.map((u) => dag.nodes.get(u)!).filter(Boolean);

  // Compute upstream layers by distance
  const ancestorTiers: Array<{ distance: number; title: string; nodes: GraphNode[] }> = [];
  let currentAncestorIds = new Set(node.prerequisites);
  const visitedAncestors = new Set<string>([node.id, ...node.prerequisites]);
  let distanceBack = 1;

  while (currentAncestorIds.size > 0 && distanceBack <= 6) {
    const layerNodes = Array.from(currentAncestorIds)
      .map((id) => dag.nodes.get(id)!)
      .filter(Boolean)
      .sort((a, b) => a.lectureNumber - b.lectureNumber);

    const title =
      distanceBack === 1
        ? 'Direct Prerequisites'
        : distanceBack === 2
          ? 'Secondary Foundations (Grandparents)'
          : `Ancestral Tier -${distanceBack}`;

    ancestorTiers.push({
      distance: distanceBack,
      title,
      nodes: layerNodes
    });

    const nextAncestorIds = new Set<string>();
    for (const aId of currentAncestorIds) {
      const aNode = dag.nodes.get(aId);
      if (aNode) {
        for (const p of aNode.prerequisites) {
          if (!visitedAncestors.has(p)) {
            visitedAncestors.add(p);
            nextAncestorIds.add(p);
          }
        }
      }
    }

    currentAncestorIds = nextAncestorIds;
    distanceBack++;
  }

  // Compute downstream layers by distance
  const descendantTiers: Array<{ distance: number; title: string; nodes: GraphNode[] }> = [];
  let currentDescendantIds = new Set(node.unlockedLectures);
  const visitedDescendants = new Set<string>([node.id, ...node.unlockedLectures]);
  let distanceFwd = 1;

  while (currentDescendantIds.size > 0 && distanceFwd <= 6) {
    const layerNodes = Array.from(currentDescendantIds)
      .map((id) => dag.nodes.get(id)!)
      .filter(Boolean)
      .sort((a, b) => a.lectureNumber - b.lectureNumber);

    const title =
      distanceFwd === 1
        ? 'Directly Unlocks (Next Topics)'
        : distanceFwd === 2
          ? 'Secondary Horizon (Grandchildren)'
          : `Unlocked Tier +${distanceFwd}`;

    descendantTiers.push({
      distance: distanceFwd,
      title,
      nodes: layerNodes
    });

    const nextDescendantIds = new Set<string>();
    for (const dId of currentDescendantIds) {
      const dNode = dag.nodes.get(dId);
      if (dNode) {
        for (const u of dNode.unlockedLectures) {
          if (!visitedDescendants.has(u)) {
            visitedDescendants.add(u);
            nextDescendantIds.add(u);
          }
        }
      }
    }

    currentDescendantIds = nextDescendantIds;
    distanceFwd++;
  }

  const softLinks = node.softLinks
    .map((link) => {
      const targetNode = dag.nodes.get(link.targetId);
      return targetNode ? { targetNode, relationship: link.relationship } : null;
    })
    .filter(Boolean) as Array<{ targetNode: GraphNode; relationship: string }>;

  // Children whose other prerequisites are satisfied (ready to tackle)
  const readyToTackleNext = directUnlocked.filter((child) => {
    return child.prerequisites.every((p) => p === node.id || completedSet.has(p));
  });

  return {
    node,
    directPrerequisites,
    ancestorTiers,
    directUnlocked,
    descendantTiers,
    softLinks,
    readyToTackleNext
  };
}
