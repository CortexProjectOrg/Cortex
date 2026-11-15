import { describe, it, expect } from 'vitest';
import {
  buildKnowledgeDAG,
  getKnowledgeDAG,
  computeNodeReadiness,
  getTopicRamification,
  getLectureRamification,
  LECTURE_DEPENDENCIES,
  type GraphNode
} from '../src/lib/knowledgeGraph';
import {
  buildTopicMacroGraph,
  findLearningPath,
  queryLectures
} from '../src/lib/knowledgeGraphQuery';
import {
  prepareGraphDatabasePayload,
  CLIENT_GRAPH_VERSION
} from '../src/lib/graphStore';
import { ALL_LECTURES } from '../src/lib/curriculum';

describe('Knowledge DAG & Dependency Tree Invariants', () => {
  const dag = getKnowledgeDAG();

  it('contains all 60 monothematic lectures as graph nodes', () => {
    expect(dag.nodes.size).toBe(60);
    expect(dag.nodeList.length).toBe(60);
    expect(ALL_LECTURES.length).toBe(60);

    ALL_LECTURES.forEach(l => {
      expect(dag.nodes.has(l.id)).toBe(true);
      const node = dag.nodes.get(l.id)!;
      expect(node.lectureNumber).toBe(l.lectureNumber);
      expect(node.title).toBe(l.title);
      expect(node.topicId).toBe(l.topicId);
    });
  });

  it('strictly satisfies the DAG condition: Kahn algorithm detects ZERO cycles', () => {
    expect(dag.isAcyclic).toBe(true);
    expect(dag.cycleNodes).toBeUndefined();
    expect(dag.topologicalOrder.length).toBe(60);

    // Verify all unique nodes appear in topological order
    const topoSet = new Set(dag.topologicalOrder);
    expect(topoSet.size).toBe(60);
  });

  it('ensures every prerequisite ID exists in the lecture registry (Referential Integrity)', () => {
    dag.nodeList.forEach(node => {
      node.prerequisites.forEach(prereqId => {
        expect(
          dag.nodes.has(prereqId),
          `Node '${node.id}' has non-existent prerequisite '${prereqId}'`
        ).toBe(true);

        // Disallow self-loops
        expect(prereqId).not.toBe(node.id);
      });
    });
  });

  it('enforces that foundational root concepts have in-degree 0 and terminal concepts build on them', () => {
    const rootNodes = dag.nodeList.filter(n => n.inDegree === 0);
    expect(rootNodes.length).toBe(1);
    expect(rootNodes[0].id).toBe('L01-sets-maps-proofs');
    expect(rootNodes[0].topologicalRank).toBe(0);

    // All other 59 lectures must have at least one prerequisite
    const nonRootNodes = dag.nodeList.filter(n => n.id !== 'L01-sets-maps-proofs');
    nonRootNodes.forEach(node => {
      expect(node.prerequisites.length).toBeGreaterThanOrEqual(1);
      expect(node.inDegree).toBeGreaterThanOrEqual(1);
      expect(node.topologicalRank).toBeGreaterThan(0);
    });
  });

  it('verifies topological ordering: prerequisites strictly precede dependents', () => {
    const topoIndexMap = new Map<string, number>();
    dag.topologicalOrder.forEach((id, index) => {
      topoIndexMap.set(id, index);
    });

    dag.nodeList.forEach(node => {
      const nodeIndex = topoIndexMap.get(node.id)!;
      node.prerequisites.forEach(prereqId => {
        const prereqIndex = topoIndexMap.get(prereqId)!;
        expect(
          prereqIndex,
          `Prerequisite '${prereqId}' must appear before '${node.id}' in topological sort`
        ).toBeLessThan(nodeIndex);

        const prereqNode = dag.nodes.get(prereqId)!;
        expect(
          prereqNode.topologicalRank,
          `Prerequisite rank must be strictly less than dependent rank`
        ).toBeLessThan(node.topologicalRank);
      });
    });
  });

  it('verifies bidirectional consistency between prerequisites and unlockedLectures', () => {
    dag.nodeList.forEach(node => {
      // If P is a prerequisite of N, then N must be in P.unlockedLectures
      node.prerequisites.forEach(pId => {
        const parentNode = dag.nodes.get(pId)!;
        expect(
          parentNode.unlockedLectures.includes(node.id),
          `Node '${pId}' should list '${node.id}' in unlockedLectures`
        ).toBe(true);
      });

      // If C is in N.unlockedLectures, then N must be in C.prerequisites
      node.unlockedLectures.forEach(cId => {
        const childNode = dag.nodes.get(cId)!;
        expect(
          childNode.prerequisites.includes(node.id),
          `Node '${cId}' should list '${node.id}' in prerequisites`
        ).toBe(true);
      });
    });
  });

  it('computes transitive ancestry (allPrerequisites) and descendancy (allUnlocked)', () => {
    const rootNode = dag.nodes.get('L01-sets-maps-proofs')!;
    expect(rootNode.allPrerequisites.length).toBe(0);
    // L01 should transitively unlock all or nearly all curriculum nodes
    expect(rootNode.allUnlocked.length).toBe(59);

    // Advanced node: L57 (Quantum Error-Correcting Stabilizer Codes)
    const l57 = dag.nodes.get('L57-qec-stabilizer-codes-automorphisms')!;
    expect(l57.allPrerequisites).toContain('L01-sets-maps-proofs');
    expect(l57.allPrerequisites).toContain('L18-symplectic-product-commutation');
    expect(l57.allPrerequisites).toContain('L27-stabilizer-states-generators');
    expect(l57.allPrerequisites).toContain('L31-gottesman-knill-theorem');
  });

  it('validates cross-disciplinary soft links (cross-field contamination)', () => {
    expect(dag.totalSoftLinks).toBeGreaterThanOrEqual(20);

    dag.nodeList.forEach(node => {
      node.softLinks.forEach(link => {
        // Target must be a valid lecture ID
        expect(
          dag.nodes.has(link.targetId),
          `Soft link target '${link.targetId}' from '${node.id}' must exist`
        ).toBe(true);

        // Cannot link to self
        expect(link.targetId).not.toBe(node.id);

        // Relationship description must be descriptive and non-empty
        expect(link.relationship.trim().length).toBeGreaterThan(15);
      });
    });

    // Check specific cross-field soft link examples
    const l06 = dag.nodes.get('L06-bilinear-symplectic-forms')!;
    const l06LinkToMatchgates = l06.softLinks.find(
      s => s.targetId === 'L56-gaussian-states-matchgate-simulation'
    );
    expect(l06LinkToMatchgates).toBeDefined();

    const l23 = dag.nodes.get('L23-symplectic-clifford-isomorphism')!;
    const l23LinkToQEC = l23.softLinks.find(
      s => s.targetId === 'L57-qec-stabilizer-codes-automorphisms'
    );
    expect(l23LinkToQEC).toBeDefined();
  });

  it('evaluates dynamic node readiness correctly based on user mastery', () => {
    // 1. Initial state: zero lectures completed
    const initialCompleted = new Set<string>();
    const l01Readiness = computeNodeReadiness('L01-sets-maps-proofs', initialCompleted);
    expect(l01Readiness.status).toBe('ready');
    expect(l01Readiness.missingPrereqs.length).toBe(0);
    expect(l01Readiness.percentReady).toBe(100);

    const l02Readiness = computeNodeReadiness('L02-groups-modular-arithmetic', initialCompleted);
    expect(l02Readiness.status).toBe('locked');
    expect(l02Readiness.missingPrereqs).toEqual(['L01-sets-maps-proofs']);
    expect(l02Readiness.percentReady).toBe(0);

    // 2. User completes L01
    const completedAfterL01 = new Set(['L01-sets-maps-proofs']);
    const l01Completed = computeNodeReadiness('L01-sets-maps-proofs', completedAfterL01);
    expect(l01Completed.status).toBe('completed');

    const l02NowReady = computeNodeReadiness('L02-groups-modular-arithmetic', completedAfterL01);
    expect(l02NowReady.status).toBe('ready');
    expect(l02NowReady.missingPrereqs.length).toBe(0);
    expect(l02NowReady.percentReady).toBe(100);

    // L03 requires both L01 and L02
    const l03Partial = computeNodeReadiness('L03-finite-fields-gf2-gfp', completedAfterL01);
    expect(l03Partial.status).toBe('locked');
    expect(l03Partial.completedPrereqs).toEqual(['L01-sets-maps-proofs']);
    expect(l03Partial.missingPrereqs).toEqual(['L02-groups-modular-arithmetic']);
    expect(l03Partial.percentReady).toBe(50);
  });

  it('computes browsable topic-level ramifications (prerequisites, progression, and next topics)', () => {
    // Topic 1: Mathematical Foundations
    const topic1Ramification = getTopicRamification('math-foundations', dag);
    expect(topic1Ramification).not.toBeNull();
    expect(topic1Ramification!.prerequisiteTopics.length).toBe(0); // Bedrock root topic
    expect(topic1Ramification!.nextTopics.length).toBeGreaterThan(0); // Unlocks downstream topics
    expect(topic1Ramification!.entryLectures.length).toBeGreaterThanOrEqual(1);

    // Topic 4: Clifford Operations
    const topic4Ramification = getTopicRamification('clifford-operations', dag);
    expect(topic4Ramification).not.toBeNull();
    // Prerequisite topics should include pauli-group or math-foundations
    const prereqTopicIds = topic4Ramification!.prerequisiteTopics.map(p => p.topic.id);
    expect(prereqTopicIds).toContain('pauli-group');
    // Next topics should include stabilizer-formalism or simulation-architecture
    const nextTopicIds = topic4Ramification!.nextTopics.map(n => n.topic.id);
    expect(nextTopicIds).toContain('stabilizer-formalism');
  });

  it('computes browsable lecture-level ramifications (upstream distance layers, downstream unlocks, and actionable next steps)', () => {
    // Check L23: Symplectic-Clifford Isomorphism
    const l23Ramification = getLectureRamification('L23-symplectic-clifford-isomorphism', new Set(), dag);
    expect(l23Ramification).not.toBeNull();
    expect(l23Ramification!.directPrerequisites.length).toBe(3); // L07, L18, L21
    expect(l23Ramification!.ancestorTiers.length).toBeGreaterThanOrEqual(2);
    expect(l23Ramification!.directUnlocked.length).toBeGreaterThanOrEqual(2); // L24, L26, etc.
    expect(l23Ramification!.softLinks.length).toBeGreaterThanOrEqual(1);

    // With completed set covering L23's prerequisites, L23 is ready
    const completedPrereqs = new Set([
      'L07-symplectic-group-sp2n',
      'L18-symplectic-product-commutation',
      'L21-clifford-group-definition'
    ]);
    const l23Ready = getLectureRamification('L23-symplectic-clifford-isomorphism', completedPrereqs, dag);
    expect(l23Ready).not.toBeNull();
  });

  it('builds queryable topic macro graph with scalable entering and outgoing connections', () => {
    const { topicNodes, topicEdges, topicMap } = buildTopicMacroGraph(dag, new Set());
    expect(topicNodes.length).toBe(10);
    expect(topicEdges.length).toBeGreaterThanOrEqual(10);

    // Topic 1 has 0 incoming topics (axiomatic bedrock)
    const topic1 = topicMap.get('math-foundations')!;
    expect(topic1.incomingTopicIds.length).toBe(0);
    expect(topic1.incomingEdgesCount).toBe(0);
    expect(topic1.outgoingTopicIds.length).toBeGreaterThan(0);

    // Topic 4 (Cliffords) has incoming from Topic 1 or Topic 3 and outgoing to Topic 5
    const topic4 = topicMap.get('clifford-operations')!;
    expect(topic4.incomingTopicIds.length).toBeGreaterThanOrEqual(1);
    expect(topic4.outgoingTopicIds.length).toBeGreaterThanOrEqual(1);
  });

  it('queries topological learning path and prerequisite corridors between concepts', () => {
    // Path from L01 (Sets & Proofs) to L57 (Quantum Error Correcting Stabilizer Codes)
    const path = findLearningPath(
      'L01-sets-maps-proofs',
      'L57-qec-stabilizer-codes-automorphisms',
      new Set(),
      dag
    );

    expect(path).not.toBeNull();
    expect(path!.isReachable).toBe(true);
    expect(path!.shortestPath.length).toBeGreaterThanOrEqual(3);
    expect(path!.shortestPath[0].id).toBe('L01-sets-maps-proofs');
    expect(path!.shortestPath[path!.shortestPath.length - 1].id).toBe(
      'L57-qec-stabilizer-codes-automorphisms'
    );

    // Unreachable backward query (L57 to L01 is false because L01 does not depend on L57)
    const backwardPath = findLearningPath(
      'L57-qec-stabilizer-codes-automorphisms',
      'L01-sets-maps-proofs',
      new Set(),
      dag
    );
    expect(backwardPath).not.toBeNull();
    expect(backwardPath!.isReachable).toBe(false);
  });

  it('prepares static graph database persistence payload for Neon PostgreSQL', () => {
    const payload = prepareGraphDatabasePayload(dag);
    expect(payload.version).toBe(CLIENT_GRAPH_VERSION);
    expect(payload.topics.length).toBe(10);
    expect(payload.lectures.length).toBe(60);
    expect(payload.dependencies.length).toBeGreaterThanOrEqual(70);

    // Verify hard prerequisites and soft links exist in database payload
    const hardDeps = payload.dependencies.filter(d => d.edgeType === 'hard_prerequisite');
    const softDeps = payload.dependencies.filter(d => d.edgeType === 'soft_link');
    expect(hardDeps.length).toBe(dag.totalPrerequisiteEdges);
    expect(softDeps.length).toBe(dag.totalSoftLinks);
  });
});
