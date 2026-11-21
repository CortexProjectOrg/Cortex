import { describe, expect, it } from 'vitest';
import {
  buildPaperPlan,
  dependencyOrder,
  matchLecture,
  PAPER_TARGET_ID,
  PaperEvidenceError,
  paperPlanMarkdown
} from '../src/lib/paperPlan';
import { getStudyOrder } from '../src/lib/studyGraph';
import { ALL_LECTURES, LEGACY_LECTURE_MAP, LEGACY_TOPICS, TOPICS } from '../src/lib/curriculum';
import { buildKnowledgeDAG } from '../src/lib/knowledgeGraph';
import { estimateStudyMinutes, formatStudyTime } from '../src/lib/studyTime';
import { parseInk } from '../shared/ink';
import { CANONICAL_PAGE_GEOMETRY } from '../src/lib/ink';
import { paperAnalysis, sourcePaper } from './fixtures/paperAnalysis';

const studyOrder = (plan: ReturnType<typeof buildPaperPlan>) =>
  getStudyOrder(plan.graph!, PAPER_TARGET_ID, new Set());

describe('Paper prerequisite planning', () => {
  it('orders shared prerequisites once, before the theorem prerequisites', () => {
    const input = structuredClone(paperAnalysis);
    input.concepts.push({
      ...input.concepts[1],
      id: 'composition',
      title: 'Composition of functions',
      prerequisites: ['maps']
    });
    input.theorem!.prerequisites.push('composition');
    const plan = buildPaperPlan(input, []);
    const order = studyOrder(plan);
    expect(order.remaining).toEqual([
      'paper:concept:maps',
      'paper:concept:bijections',
      'paper:concept:composition'
    ]);
    expect(order.remainingMinutes).toBe(
      [...plan.graph!.nodes.values()].reduce((sum, node) => sum + (node.minutes ?? 0), 0)
    );
  });
  it('uses local title search and expands the complete catalog closure', () => {
    const input = structuredClone(paperAnalysis);
    input.concepts = [{ ...input.concepts[0], id: 'linear', title: 'Linear maps', prerequisites: [] }];
    input.theorem!.prerequisites = ['linear'];
    const plan = buildPaperPlan(input);
    expect(plan.metadataById.get('catalog:L05-linear-maps-matrices')?.lecture?.id).toBe(
      'L05-linear-maps-matrices'
    );
    expect(studyOrder(plan).remaining).toContain('catalog:L01-sets-maps-proofs');
    expect(studyOrder(plan).remaining.at(-1)).toBe('catalog:L05-linear-maps-matrices');
    expect([...plan.graph!.nodes.values()].some((node) => /pauli|quantum/i.test(node.title))).toBe(false);
  });
  it('merges a shared catalog lesson with its paper concept without counting it twice', () => {
    const input = structuredClone(paperAnalysis);
    input.concepts[1] = {
      ...input.concepts[1],
      title: 'Groups',
      id: 'groups',
      prerequisites: ['maps', 'maps']
    };
    input.theorem!.prerequisites = ['groups'];
    const plan = buildPaperPlan(input);
    const maps = 'catalog:L01-sets-maps-proofs';
    const groups = 'catalog:L02-groups-modular-arithmetic';
    expect(studyOrder(plan).remaining).toEqual([maps, groups]);
    expect(plan.graph!.incoming.get(groups)).toEqual([maps]);
    expect(plan.graph!.edges).toContainEqual({
      prerequisiteId: maps,
      dependentId: groups,
      sources: ['catalog', 'paper']
    });
  });
  it('does not route general maps or groups to specialized applications', () => {
    expect(matchLecture('maps')!.id).toBe('L01-sets-maps-proofs');
    expect(matchLecture('groups')!.id).toBe('L02-groups-modular-arithmetic');
    expect(matchLecture('Pauli group')!.id).toBe('L16-n-qubit-pauli-strings');
    expect(matchLecture('Riemannian manifolds')).toBeUndefined();
  });
  it('finds new named courses while keeping general Fourier analysis on the classical branch', () => {
    expect(matchLecture('FFT')?.id).toBe('L88-dft-fast-fourier-transform');
    expect(matchLecture('Fourier Transform')?.id).toBe('L88-dft-fast-fourier-transform');
    expect(matchLecture('BPP')?.id).toBe('L99-randomized-complexity-amplification');
    expect(matchLecture('BQP')?.id).toBe('L105-bqp-circuit-complexity');
    expect(matchLecture('QMA')?.id).toBe('L106-qma-local-hamiltonian');
    expect(matchLecture('Shor’s algorithm')?.id).toBe('L104-quantum-order-finding');
  });
  it('adds physics and computational math to a paper plan for quantum phase estimation', () => {
    const input = structuredClone(paperAnalysis);
    input.concepts = [
      {
        ...input.concepts[0],
        id: 'phase-estimation',
        title: 'Quantum phase estimation',
        prerequisites: []
      }
    ];
    input.theorem!.prerequisites = ['phase-estimation'];
    const plan = buildPaperPlan(input);
    const order = studyOrder(plan).remaining;
    expect(order).toContain('catalog:L88-dft-fast-fourier-transform');
    expect(order).toContain('catalog:L93-hamiltonian-time-evolution');
    expect(order.at(-1)).toBe('catalog:L103-quantum-phase-estimation');
  });
  it('keeps a cycle-inducing match as a comparison instead of losing a concept', () => {
    const input = structuredClone(paperAnalysis);
    input.concepts[1].title = 'Functions';
    const plan = buildPaperPlan(input);
    expect(
      [...plan.graph!.nodes.values()].filter((node) => node.catalogLectureId === 'L01-sets-maps-proofs')
    ).toHaveLength(1);
    expect(studyOrder(plan).remaining).toHaveLength(2);
    expect(plan.metadataById.get('paper:concept:maps')?.suggestions[0]?.id).toBe('L01-sets-maps-proofs');
  });
  it('merges independent concepts and retains both sets of evidence and study material', () => {
    const input = structuredClone(paperAnalysis);
    input.concepts[1].title = 'Functions';
    input.concepts[1].prerequisites = [];
    input.theorem!.prerequisites = ['maps', 'bijections'];
    const plan = buildPaperPlan(input);
    expect(studyOrder(plan).remaining).toEqual(['catalog:L01-sets-maps-proofs']);
    expect(plan.metadataById.get('catalog:L01-sets-maps-proofs')?.concepts).toEqual([
      input.concepts[1],
      input.concepts[0]
    ]);
    expect(plan.graph!.edges).toHaveLength(1);
    expect(plan.graph!.edges[0].sources).toEqual(['paper']);
  });
  it('suggests fuzzy matches without changing generated lessons and drops matches with specialized ancestors', () => {
    const [concept] = paperAnalysis.concepts;
    const [exampleLecture] = ALL_LECTURES;
    const input = {
      ...paperAnalysis,
      theorem: { ...paperAnalysis.theorem!, prerequisites: [concept.id] },
      concepts: [concept]
    };
    const fuzzy = { ...exampleLecture, id: 'fuzzy', title: 'Maps and Collisions', prerequisites: [] };
    const blocked = { ...exampleLecture, id: 'blocked', title: 'Maps', prerequisites: ['specialized'] };
    const ancestor = { ...exampleLecture, id: 'specialized', title: 'Quantum channels', prerequisites: [] };
    const plan = buildPaperPlan(input, [ancestor, fuzzy, blocked]);
    expect(studyOrder(plan).remaining).toEqual(['paper:concept:maps']);
    expect(plan.metadataById.get('paper:concept:maps')?.suggestions.map(({ id }) => id)).toEqual(['fuzzy']);
  });
  it.each([
    ['BQP', 'L105-bqp-circuit-complexity'],
    ['QMA', 'L106-qma-local-hamiltonian']
  ])('supports specialized activities for %s on generation and import', (title, id) => {
    const input = structuredClone(paperAnalysis);
    input.concepts[0].title = title;
    input.concepts[0].exercise = 'Describe the computation with a quantum circuit.';
    const generated = buildPaperPlan(input, ALL_LECTURES, { kind: 'text', text: sourcePaper });
    const imported = buildPaperPlan(generated.analysis);
    expect(generated.metadataById.get(`catalog:${id}`)?.concepts[0].exercise).toContain('quantum circuit');
    expect(imported.analysis).toEqual(generated.analysis);
  });
  it('keeps a concept named target distinct and checks evidence before pruning', () => {
    const input = structuredClone(paperAnalysis);
    input.concepts[1].id = 'target';
    input.theorem!.prerequisites = ['target'];
    const plan = buildPaperPlan(input, [], { kind: 'text', text: sourcePaper });
    expect(studyOrder(plan).remaining).toContain('paper:concept:target');
    expect(plan.graph!.nodes.get(PAPER_TARGET_ID)?.kind).toBe('target');
    input.concepts.push({ ...input.concepts[0], id: 'unused', title: 'Topology', evidence: '  ' });
    expect(() => buildPaperPlan(input, [], { kind: 'text', text: sourcePaper })).toThrow(PaperEvidenceError);
    const imported = buildPaperPlan(input, []);
    expect(imported.analysis.concepts.at(-1)?.evidence).toBe('');
    expect(imported.graph!.nodes.has('paper:concept:unused')).toBe(false);
    expect(imported.warnings).toContain('Unrelated concepts were omitted from the study path.');
  });
  it.each(['cycle', 'missing', 'duplicate', 'duplicate-title', 'off-topic'])(
    'rejects %s model output',
    (problem) => {
      const input = structuredClone(paperAnalysis);
      if (problem === 'cycle') input.concepts[0].prerequisites = ['bijections'];
      if (problem === 'missing') input.theorem!.prerequisites = ['unknown'];
      if (problem === 'duplicate') input.concepts.push(input.concepts[0]);
      if (problem === 'duplicate-title') input.concepts.push({ ...input.concepts[0], id: 'another-map' });
      if (problem === 'off-topic') input.concepts[0].example = 'Pauli operators on qubits.';
      expect(() => buildPaperPlan(input)).toThrow();
    }
  );
  it('rejects cycles even in disconnected proposals and omits unrelated valid branches', () => {
    const input = structuredClone(paperAnalysis);
    input.concepts.push({ ...input.concepts[0], id: 'unused', title: 'Topology' });
    expect(buildPaperPlan(input).graph!.nodes.has('paper:concept:unused')).toBe(false);
    input.concepts[2].prerequisites = ['unused'];
    expect(() => buildPaperPlan(input)).toThrow(/cycle/);
  });
  it('returns no invented path when a theorem is missing', () => {
    const plan = buildPaperPlan({
      ...paperAnalysis,
      theorem: null,
      concepts: [],
      explanation: 'Upload a proof, not just the abstract.'
    });
    expect(plan.graph).toBeNull();
    expect(plan.metadataById.size).toBe(0);
  });
  it('rejects output outside size limits and external images in lessons', () => {
    expect(() => buildPaperPlan({ ...paperAnalysis, paperTitle: 'a'.repeat(301) })).toThrow();
    const input = structuredClone(paperAnalysis);
    input.concepts[0].explanation = '![image](https://example.com/collect)';
    expect(() => buildPaperPlan(input)).toThrow(/images/);
  });
  it('exports readable sources and dependencies without credentials', () => {
    const markdown = paperPlanMarkdown(buildPaperPlan(paperAnalysis, []));
    expect(markdown).toContain('Prerequisites: Maps');
    expect(markdown).toContain('Source: Theorem 1');
    expect(markdown).toContain('AI-generated');
  });
});

describe('Reusable curriculum and study estimates', () => {
  it('keeps the old dependency panel and topic labels for existing annotations', () => {
    const original = buildKnowledgeDAG([...LEGACY_LECTURE_MAP.values()], LEGACY_TOPICS);
    const current = buildKnowledgeDAG();
    expect(original.nodes.get('L45-krylov-subspaces-power-iteration')!.rawPrerequisites).toContain(
      'L20-pauli-sums-observables-hamiltonians'
    );
    expect(current.nodes.get('L45-krylov-subspaces-power-iteration')!.allPrerequisites).not.toContain(
      'L20-pauli-sums-observables-hamiltonians'
    );
    expect(original.nodes.get('L04-vector-spaces-finite-fields')!.topicTitle).toBe(
      'Mathematical Foundations'
    );
    expect(current.nodes.get('L04-vector-spaces-finite-fields')!.topicTitle).toBe('Linear algebra');
  });
  it('keeps foundational content general and preserves the prior annotated revision', () => {
    for (const lecture of ALL_LECTURES.filter(
      (l) => l.lectureNumber <= 9 || [24, 41, 45, 46, 48].includes(l.lectureNumber)
    )) {
      expect(JSON.stringify(lecture.content)).not.toMatch(/quantum|qubit|pauli|clifford|stabilizer/i);
      expect(lecture.question).not.toMatch(/quantum|qubit|pauli/i);
    }
    expect(LEGACY_LECTURE_MAP.get('L01-sets-maps-proofs')!.content.motivation).toContain('Quantum');
    expect(
      parseInk(
        JSON.stringify({
          version: 2,
          width: 960,
          height: 1800,
          strokes: [],
          textAnnotations: [],
          visualization: { ...CANONICAL_PAGE_GEOMETRY, version: 4 }
        })
      ).visualization?.version
    ).toBe(4);
  });
  it('assigns each lesson once and computes an acyclic prerequisite closure', () => {
    expect(new Set(TOPICS.flatMap((t) => t.lectureIds)).size).toBe(ALL_LECTURES.length);
    expect(TOPICS.some((t) => t.id === 'linear-algebra')).toBe(true);
    const nodes = new Map(ALL_LECTURES.map((l) => [l.id, l]));
    const order = dependencyOrder(nodes, [...nodes.keys()]);
    for (const lecture of ALL_LECTURES)
      for (const prerequisite of lecture.prerequisites)
        expect(order.indexOf(prerequisite)).toBeLessThan(order.indexOf(lecture.id));
  });
  it('varies study time with reading, mathematical work, and practice', () => {
    expect(new Set(ALL_LECTURES.map((l) => l.durationMinutes)).size).toBeGreaterThan(2);
    expect(estimateStudyMinutes('short', 1, 1, 5)).toBeLessThan(
      estimateStudyMinutes('derivation '.repeat(700), 3, 3, 30)
    );
    expect(formatStudyTime(95)).toBe('1h 35m');
  });
});
