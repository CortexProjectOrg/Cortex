import { describe, expect, it } from 'vitest';
import { buildPaperPlan, dependencyOrder, matchLecture, paperPlanMarkdown } from '../src/lib/paperPlan';
import { ALL_LECTURES, LEGACY_LECTURE_MAP, LEGACY_TOPICS, TOPICS } from '../src/lib/curriculum';
import { buildKnowledgeDAG } from '../src/lib/knowledgeGraph';
import { estimateStudyMinutes, formatStudyTime } from '../src/lib/studyTime';
import { parseInk } from '../shared/ink';
import { CANONICAL_PAGE_GEOMETRY } from '../src/lib/ink';
import { paperAnalysis } from './fixtures/paperAnalysis';

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
    expect(plan.order).toEqual(['maps', 'bijections', 'composition']);
    expect(plan.totalMinutes).toBe([...plan.nodes.values()].reduce((sum, node) => sum + node.minutes, 0));
  });
  it('uses local title search and expands the complete catalog closure', () => {
    const input = structuredClone(paperAnalysis);
    input.concepts = [{ ...input.concepts[0], id: 'linear', title: 'Linear maps', prerequisites: [] }];
    input.theorem!.prerequisites = ['linear'];
    const plan = buildPaperPlan(input);
    expect(plan.nodes.get('linear')!.lecture!.id).toBe('L05-linear-maps-matrices');
    expect(plan.order).toContain('catalog:L01-sets-maps-proofs');
    expect(plan.order.at(-1)).toBe('linear');
    expect([...plan.nodes.values()].some((node) => /pauli|quantum/i.test(node.title))).toBe(false);
  });
  it('merges a shared catalog lesson with its paper concept without counting it twice', () => {
    const input = structuredClone(paperAnalysis);
    input.concepts[1] = { ...input.concepts[1], title: 'Groups', id: 'groups', prerequisites: ['maps'] };
    input.theorem!.prerequisites = ['groups'];
    const plan = buildPaperPlan(input);
    expect(plan.order).toEqual(['maps', 'groups']);
    expect(plan.nodes.get('groups')!.prerequisites).toEqual(['maps']);
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
    expect(plan.nodes.get('phase-estimation')?.lecture?.id).toBe('L103-quantum-phase-estimation');
    expect(plan.order).toContain('catalog:L88-dft-fast-fourier-transform');
    expect(plan.order).toContain('catalog:L93-hamiltonian-time-evolution');
    expect(plan.order.at(-1)).toBe('phase-estimation');
  });
  it('does not schedule the same catalog lecture twice for separate atomic concepts', () => {
    const input = structuredClone(paperAnalysis);
    input.concepts[1].title = 'Functions';
    const plan = buildPaperPlan(input);
    expect(
      [...plan.nodes.values()].filter((node) => node.lecture?.id === 'L01-sets-maps-proofs')
    ).toHaveLength(1);
    expect(plan.order).toHaveLength(2);
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
    expect(buildPaperPlan(input).order).not.toContain('unused');
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
    expect(plan.order).toEqual([]);
    expect(plan.totalMinutes).toBe(0);
  });
  it('rejects output outside size limits and external images in lessons', () => {
    expect(() => buildPaperPlan({ ...paperAnalysis, paperTitle: 'a'.repeat(301) })).toThrow();
    const input = structuredClone(paperAnalysis);
    input.concepts[0].explanation = '![image](https://example.com/collect)';
    expect(() => buildPaperPlan(input)).toThrow(/images/);
  });
  it('exports readable sources and dependencies without credentials', () => {
    const markdown = paperPlanMarkdown(buildPaperPlan(paperAnalysis));
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
