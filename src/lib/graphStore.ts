/**
 * Static Graph Persistence & Synchronization Engine
 *
 * Ensures the static knowledge tree DAG is queryable, cached locally for offline PWA,
 * and persisted / kept updated against the Neon PostgreSQL database.
 */

import { getKnowledgeDAG, type KnowledgeDAG } from './knowledgeGraph';
import { TOPICS } from './curriculum';

const GRAPH_STORAGE_KEY = 'ainotes_curriculum_dag_meta';
export const CLIENT_GRAPH_VERSION = '2.1.0';

export interface GraphSyncStatus {
  persistedInDb: boolean;
  version: string;
  lastSyncedAt?: string;
}

/**
 * Prepares the static curriculum payload for database synchronization.
 */
export function prepareGraphDatabasePayload(dag: KnowledgeDAG = getKnowledgeDAG()) {
  const topics = TOPICS.map(t => ({
    id: t.id,
    number: t.number,
    title: t.title,
    subtitle: t.subtitle,
    description: t.description,
    color: t.color,
    symbol: t.symbol
  }));

  const lectures = dag.nodeList.map(n => ({
    id: n.id,
    topicId: n.topicId,
    lectureNumber: n.lectureNumber,
    title: n.title,
    subtitle: n.subtitle,
    question: n.question,
    packNumber: n.packNumber,
    packSlot: n.packSlot,
    topologicalRank: n.topologicalRank
  }));

  const dependencies: Array<{
    fromId: string;
    toId: string;
    edgeType: 'hard_prerequisite' | 'soft_link';
    relationship?: string;
  }> = [];

  for (const node of dag.nodeList) {
    for (const pId of node.prerequisites) {
      dependencies.push({
        fromId: pId,
        toId: node.id,
        edgeType: 'hard_prerequisite'
      });
    }

    for (const s of node.softLinks) {
      dependencies.push({
        fromId: node.id,
        toId: s.targetId,
        edgeType: 'soft_link',
        relationship: s.relationship
      });
    }
  }

  return { topics, lectures, dependencies, version: CLIENT_GRAPH_VERSION };
}

/**
 * Asynchronously syncs the static knowledge DAG with the database.
 * If Neon PostgreSQL is configured on the backend, updates the DB tables.
 */
export async function syncGraphWithDatabase(): Promise<GraphSyncStatus> {
  if (typeof window === 'undefined') {
    return { persistedInDb: false, version: CLIENT_GRAPH_VERSION };
  }

  try {
    const payload = prepareGraphDatabasePayload();

    const res = await fetch('/api/graph', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      const status: GraphSyncStatus = {
        persistedInDb: true,
        version: data.version || CLIENT_GRAPH_VERSION,
        lastSyncedAt: data.syncedAt || new Date().toISOString()
      };
      localStorage.setItem(GRAPH_STORAGE_KEY, JSON.stringify(status));
      return status;
    }
  } catch (err) {
    // Offline or serverless not available - continue seamlessly with local static DAG
    console.debug('Static graph DB sync deferred (offline or serverless):', err);
  }

  return {
    persistedInDb: false,
    version: CLIENT_GRAPH_VERSION,
    lastSyncedAt: new Date().toISOString()
  };
}
