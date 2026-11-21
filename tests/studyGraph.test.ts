import { describe, expect, it } from 'vitest';
import { ALL_LECTURES, TOPICS } from '../src/lib/curriculumCatalog';
import { buildKnowledgeDAG, projectCatalogStudyGraph } from '../src/lib/knowledgeGraph';
import { findLearningPath, queryLectures } from '../src/lib/knowledgeGraphQuery';
import {
  buildStudyGraph,
  getNeighborhood,
  getReadiness,
  getShortestRoute,
  getStudyOrder,
  type StudyNode
} from '../src/lib/studyGraph';

const node = (id: string, minutes = 10): StudyNode => ({ id, title: id, kind: 'catalog', minutes });
const edge = (prerequisiteId: string, dependentId: string) => ({
  prerequisiteId,
  dependentId,
  sources: ['catalog'] as const
});

describe('study graph queries', () => {
  it('uses declared shortcuts for readiness and the shortest route without dropping goal branches', () => {
    const nodes = ['A', 'B', 'C', 'D'].map((id) => node(id));
    const edges = [edge('A', 'B'), edge('B', 'C')];
    const graph = buildStudyGraph(nodes, [...edges, edge('A', 'C')]);
    expect(getShortestRoute(graph, 'A', 'C')).toEqual(['A', 'C']);
    expect(getShortestRoute(graph, 'D', 'C')).toEqual([]);
    expect(getShortestRoute(graph, 'C', 'C')).toEqual(['C']);
    expect(getReadiness(graph, 'C', new Set(['B']))).toEqual({
      status: 'locked',
      completedPrereqs: ['B'],
      missingPrereqs: ['A'],
      percentReady: 50
    });
    const withShortcut = getStudyOrder(graph, 'C', new Set(['B']));
    expect(withShortcut.remaining).toEqual(['A', 'C']);
    expect(withShortcut.next).toBe('A');
    expect(withShortcut.background.size).toBe(0);
    const withoutShortcut = getStudyOrder(buildStudyGraph(nodes, edges), 'C', new Set(['B']));
    expect(withoutShortcut.remaining).toEqual(['A', 'C']);
    expect(withoutShortcut.next).toBe('C');
    expect(withoutShortcut.background).toEqual(new Set(['A']));
  });

  it('counts common prerequisites once and computes minimum display distance', () => {
    const graph = buildStudyGraph(
      [node('base'), node('left', 15), node('right', 20), node('goal', 5)],
      [
        edge('base', 'left'),
        edge('base', 'right'),
        edge('left', 'goal'),
        edge('right', 'goal'),
        edge('base', 'left')
      ]
    );
    expect(graph.edges).toHaveLength(4);
    expect(getStudyOrder(graph, 'goal', new Set())).toMatchObject({
      remaining: ['base', 'left', 'right', 'goal'],
      remainingMinutes: 50
    });
    expect(getStudyOrder(graph, 'goal', new Set(['base']))).toMatchObject({
      remaining: ['left', 'right', 'goal'],
      remainingMinutes: 40
    });
    expect(getNeighborhood(graph, 'goal', 'prerequisites', 2)).toEqual([
      { id: 'goal', distance: 0 },
      { id: 'left', distance: 1 },
      { id: 'right', distance: 1 },
      { id: 'base', distance: 2 }
    ]);
  });

  it('indexes wide and deep graphs without losing reachable siblings or the end of a chain', () => {
    const nodes = Array.from({ length: 1000 }, (_, index) => node(`n${index.toString().padStart(4, '0')}`));
    const star = buildStudyGraph(
      nodes,
      nodes.slice(1).map(({ id }) => edge(nodes[0].id, id))
    );
    expect(getNeighborhood(star, nodes[0].id, 'unlocks', 1)).toHaveLength(1000);
    const chain = buildStudyGraph(
      nodes,
      nodes.slice(1).map(({ id }, index) => edge(nodes[index].id, id))
    );
    expect(getNeighborhood(chain, nodes[999].id, 'prerequisites', 2)).toHaveLength(3);
    expect(getStudyOrder(chain, nodes[999].id, new Set()).remaining).toHaveLength(1000);
    expect(chain.edges).toHaveLength(999);
  });

  it('uses the supplied catalog metadata and preserves full closures for equal and disconnected endpoints', () => {
    const [first, second, third] = ALL_LECTURES;
    const dag = buildKnowledgeDAG(
      [
        { ...first, durationMinutes: 17, prerequisites: ['missing'] },
        { ...second, prerequisites: [first.id] },
        { ...third, prerequisites: [] }
      ],
      TOPICS
    );
    const graph = projectCatalogStudyGraph(dag);
    expect(projectCatalogStudyGraph(dag)).toBe(graph);
    expect(graph.incoming.get(first.id)).toEqual([]);
    expect(graph.nodes.get(first.id)?.minutes).toBe(17);
    expect(
      findLearningPath(second.id, second.id, new Set(), dag)?.prerequisiteSubDAG.map((entry) => entry.id)
    ).toEqual([first.id, second.id]);
    expect(
      findLearningPath(third.id, second.id, new Set(), dag)?.remainingToMaster.map((entry) => entry.id)
    ).toEqual([first.id, second.id]);
    expect(queryLectures({ query: 'groups' }, dag)).toContain(dag.nodes.get(second.id));
  });
});
