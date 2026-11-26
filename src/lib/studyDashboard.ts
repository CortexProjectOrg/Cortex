import { getKnowledgeDAG, projectCatalogStudyGraph } from './knowledgeGraph';
import { getReadiness } from './studyGraph';

export function trackAnchor(ids: string[], completed: string[]) {
  const graph = projectCatalogStudyGraph(getKnowledgeDAG());
  const done = new Set(completed);
  return (
    ids.find((id) => getReadiness(graph, id, done).status === 'ready') ??
    ids.find((id) => !done.has(id)) ??
    ids[0]
  );
}
