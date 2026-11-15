/**
 * Knowledge Graph Query Engine
 *
 * Provides queryable, scalable abstractions over the curriculum DAG:
 * - Macro Topic-level graph with entering/outgoing connections
 * - Hierarchical expand/collapse state query
 * - Topological learning path queries between concepts (e.g. L01 -> L57)
 * - Upstream/downstream ramification sub-DAG queries
 */

import {
  type GraphNode,
  type KnowledgeDAG,
  getKnowledgeDAG,
  computeNodeReadiness
} from './knowledgeGraph';
import { TOPICS, type Topic } from './curriculum';

export interface TopicMacroNode {
  topic: Topic;
  lectures: GraphNode[];
  incomingTopicIds: string[];
  outgoingTopicIds: string[];
  incomingEdgesCount: number;
  outgoingEdgesCount: number;
  softLinkTopicIds: string[];
  masteredCount: number;
  readyCount: number;
  percentComplete: number;
}

export interface TopicMacroEdge {
  fromTopicId: string;
  toTopicId: string;
  dependencyCount: number;
  lectureConnections: Array<{ fromLectureId: string; toLectureId: string }>;
}

export interface LearningPathResult {
  startNode: GraphNode;
  targetNode: GraphNode;
  isReachable: boolean;
  shortestPath: GraphNode[];
  prerequisiteSubDAG: GraphNode[];
  remainingToMaster: GraphNode[];
}

export interface GraphQueryFilter {
  query?: string;
  topicId?: string;
  status?: 'all' | 'ready' | 'completed' | 'locked';
  expandedTopicIds?: Set<string>;
  expandedNodeIds?: Set<string>;
}

/**
 * Builds the macro topic-level DAG showing entering and outgoing connections
 * between the 10 curriculum topics.
 */
export function buildTopicMacroGraph(
  dag: KnowledgeDAG = getKnowledgeDAG(),
  completedSet: Set<string> = new Set()
): {
  topicNodes: TopicMacroNode[];
  topicEdges: TopicMacroEdge[];
  topicMap: Map<string, TopicMacroNode>;
} {
  const topicMap = new Map<string, TopicMacroNode>();
  const edgeMap = new Map<string, TopicMacroEdge>();

  // 1. Initialize topic nodes
  for (const topic of TOPICS) {
    const topicLectures = dag.nodeList.filter(n => n.topicId === topic.id);
    let masteredCount = 0;
    let readyCount = 0;

    for (const l of topicLectures) {
      if (completedSet.has(l.id)) {
        masteredCount++;
      } else {
        const readiness = computeNodeReadiness(l.id, completedSet);
        if (readiness.status === 'ready') readyCount++;
      }
    }

    topicMap.set(topic.id, {
      topic,
      lectures: topicLectures,
      incomingTopicIds: [],
      outgoingTopicIds: [],
      incomingEdgesCount: 0,
      outgoingEdgesCount: 0,
      softLinkTopicIds: [],
      masteredCount,
      readyCount,
      percentComplete: topicLectures.length > 0 ? Math.round((masteredCount / topicLectures.length) * 100) : 0
    });
  }

  // 2. Discover macro entering & outgoing edges
  const incomingSets = new Map<string, Set<string>>();
  const outgoingSets = new Map<string, Set<string>>();
  const softSets = new Map<string, Set<string>>();

  for (const topic of TOPICS) {
    incomingSets.set(topic.id, new Set());
    outgoingSets.set(topic.id, new Set());
    softSets.set(topic.id, new Set());
  }

  for (const node of dag.nodeList) {
    // Hard prerequisites
    for (const pId of node.prerequisites) {
      const pNode = dag.nodes.get(pId);
      if (pNode && pNode.topicId !== node.topicId) {
        incomingSets.get(node.topicId)!.add(pNode.topicId);
        outgoingSets.get(pNode.topicId)!.add(node.topicId);

        const edgeKey = `${pNode.topicId}->${node.topicId}`;
        if (!edgeMap.has(edgeKey)) {
          edgeMap.set(edgeKey, {
            fromTopicId: pNode.topicId,
            toTopicId: node.topicId,
            dependencyCount: 0,
            lectureConnections: []
          });
        }
        const edge = edgeMap.get(edgeKey)!;
        edge.dependencyCount++;
        edge.lectureConnections.push({ fromLectureId: pId, toLectureId: node.id });
      }
    }

    // Soft links
    for (const link of node.softLinks) {
      const targetNode = dag.nodes.get(link.targetId);
      if (targetNode && targetNode.topicId !== node.topicId) {
        softSets.get(node.topicId)!.add(targetNode.topicId);
        softSets.get(targetNode.topicId)!.add(node.topicId);
      }
    }
  }

  for (const [topicId, node] of topicMap.entries()) {
    node.incomingTopicIds = Array.from(incomingSets.get(topicId) || []).sort();
    node.outgoingTopicIds = Array.from(outgoingSets.get(topicId) || []).sort();
    node.softLinkTopicIds = Array.from(softSets.get(topicId) || []).sort();

    // Sum incoming/outgoing connection counts
    let inCount = 0;
    let outCount = 0;
    for (const edge of edgeMap.values()) {
      if (edge.toTopicId === topicId) inCount += edge.dependencyCount;
      if (edge.fromTopicId === topicId) outCount += edge.dependencyCount;
    }
    node.incomingEdgesCount = inCount;
    node.outgoingEdgesCount = outCount;
  }

  const topicNodes = Array.from(topicMap.values()).sort((a, b) => a.topic.number - b.topic.number);
  const topicEdges = Array.from(edgeMap.values());

  return { topicNodes, topicEdges, topicMap };
}

/**
 * Finds the shortest and complete dependency path from a start lecture to a target lecture.
 * E.g., How to get from L01 (Sets & Maps) to L57 (Surface Codes)?
 */
export function findLearningPath(
  startId: string,
  targetId: string,
  completedSet: Set<string> = new Set(),
  dag: KnowledgeDAG = getKnowledgeDAG()
): LearningPathResult | null {
  const startNode = dag.nodes.get(startId);
  const targetNode = dag.nodes.get(targetId);
  if (!startNode || !targetNode) return null;

  if (startId === targetId) {
    return {
      startNode,
      targetNode,
      isReachable: true,
      shortestPath: [startNode],
      prerequisiteSubDAG: [startNode],
      remainingToMaster: completedSet.has(startId) ? [] : [startNode]
    };
  }

  // Check if start is in target's ancestors
  const isReachable = targetNode.allPrerequisites.includes(startId);

  // BFS backwards from target to start to find shortest path
  const queue: Array<{ id: string; path: string[] }> = [{ id: targetId, path: [targetId] }];
  const visited = new Set<string>([targetId]);
  let shortestPathIds: string[] = [];

  while (queue.length > 0) {
    const { id, path } = queue.shift()!;
    if (id === startId) {
      shortestPathIds = [...path].reverse();
      break;
    }

    const node = dag.nodes.get(id);
    if (node) {
      for (const pId of node.prerequisites) {
        if (!visited.has(pId)) {
          visited.add(pId);
          queue.push({ id: pId, path: [...path, pId] });
        }
      }
    }
  }

  const shortestPath = shortestPathIds.map(id => dag.nodes.get(id)!).filter(Boolean);

  // Build the complete prerequisite sub-DAG between start and target
  const subDAGIds = new Set<string>([targetId]);
  const toExplore = [targetId];

  while (toExplore.length > 0) {
    const currId = toExplore.pop()!;
    const node = dag.nodes.get(currId);
    if (!node) continue;

    for (const pId of node.prerequisites) {
      // Only include nodes that are on or above the start node or prerequisites of target
      if (!subDAGIds.has(pId)) {
        subDAGIds.add(pId);
        if (pId !== startId) {
          toExplore.push(pId);
        }
      }
    }
  }

  const prerequisiteSubDAG = Array.from(subDAGIds)
    .map(id => dag.nodes.get(id)!)
    .filter(Boolean)
    .sort((a, b) => a.lectureNumber - b.lectureNumber);

  const remainingToMaster = prerequisiteSubDAG.filter(n => !completedSet.has(n.id));

  return {
    startNode,
    targetNode,
    isReachable,
    shortestPath,
    prerequisiteSubDAG,
    remainingToMaster
  };
}

/**
 * Filter and query the DAG based on search keywords, status, and topics.
 */
export function queryLectures(
  filter: GraphQueryFilter,
  dag: KnowledgeDAG = getKnowledgeDAG(),
  completedSet: Set<string> = new Set()
): GraphNode[] {
  return dag.nodeList.filter(node => {
    if (filter.topicId && filter.topicId !== 'all' && node.topicId !== filter.topicId) {
      return false;
    }

    if (filter.status && filter.status !== 'all') {
      const readiness = computeNodeReadiness(node.id, completedSet);
      if (readiness.status !== filter.status) return false;
    }

    if (filter.query && filter.query.trim()) {
      const q = filter.query.toLowerCase().trim();
      const match =
        node.title.toLowerCase().includes(q) ||
        node.subtitle.toLowerCase().includes(q) ||
        node.question.toLowerCase().includes(q) ||
        node.id.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });
}
