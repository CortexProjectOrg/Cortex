import { describe, expect, it } from 'vitest';
import katex from 'katex';
import { dampedPlusState, entangledPair, truncateSchmidt, bondEntropyBound } from '../src/lib/quantumVisuals';
import { QUANTUM_SIMULATION_LECTURES } from '../src/lib/quantumSimulationLessons';
import { LECTURE_MAP, MASTERY_PACKS } from '../src/lib/curriculum';

describe('quantum visual calculations', () => {
  it('preserves trace and positivity during amplitude damping', () => {
    for (const gamma of [0, 0.1, 0.5, 0.75, 1]) {
      const state = dampedPlusState(gamma);
      expect(state.ground + state.excited).toBeCloseTo(1);
      expect(state.ground * state.excited - state.coherence ** 2).toBeGreaterThanOrEqual(-1e-12);
      expect(state.purity).toBeCloseTo(state.ground ** 2 + state.excited ** 2 + 2 * state.coherence ** 2);
      expect(state.x ** 2 + state.z ** 2).toBeLessThanOrEqual(1 + 1e-12);
    }
    expect(dampedPlusState(0).purity).toBe(1);
    expect(dampedPlusState(0.5).purity).toBeCloseTo(0.875);
    expect(dampedPlusState(0.75).purity).toBeCloseTo(29 / 32);
    expect(dampedPlusState(1)).toMatchObject({ ground: 1, excited: 0, coherence: 0, purity: 1 });
  });

  it('shows zero entanglement for a product and one bit for a Bell state', () => {
    expect(entangledPair(0)).toMatchObject({ p00: 1, p11: 0 });
    expect(entangledPair(0).entropy).toBeCloseTo(0);
    expect(entangledPair(45).p00).toBeCloseTo(0.5);
    expect(entangledPair(45).entropy).toBeCloseTo(1);
    const values = [0, 10, 20, 30, 45].map((theta) => entangledPair(theta));
    values.forEach((value, i) => {
      expect(value.p00 + value.p11).toBeCloseTo(1);
      if (i) expect(value.entropy).toBeGreaterThan(values[i - 1].entropy);
    });
  });

  it('separates discarded weight from the normalized-state fidelity', () => {
    const weights = [0.7, 0.2, 0.08, 0.02];
    const result = truncateSchmidt(weights, 2);
    expect(result.discarded).toBeCloseTo(0.1);
    expect(result.fidelity).toBeCloseTo(0.9);
    expect(result.normalized[0]).toBeCloseTo(7 / 9);
    expect(result.normalized[1]).toBeCloseTo(2 / 9);
    // Reconstruct the squared overlap of the original and normalized truncated state.
    const overlap = result.normalized.reduce((sum, weight, i) => sum + Math.sqrt(weight * weights[i]), 0);
    expect(overlap ** 2).toBeCloseTo(result.fidelity);
    expect(truncateSchmidt(weights, 4).discarded).toBeCloseTo(0);
    expect(weights).toEqual([0.7, 0.2, 0.08, 0.02]);
  });

  it('bounds bond entropy by both the virtual bond and the smaller physical subsystem', () => {
    expect(bondEntropyBound(1, 3, 3)).toBe(0);
    expect(bondEntropyBound(4, 3, 3)).toBe(2);
    expect(bondEntropyBound(16, 3, 3)).toBe(3);
    expect(bondEntropyBound(8, 1, 5)).toBe(1);
  });

  it('rejects nonphysical visual parameters instead of displaying invalid probabilities', () => {
    for (const value of [-1, 2, NaN, Infinity]) expect(() => dampedPlusState(value)).toThrow(RangeError);
    expect(() => entangledPair(90)).toThrow(RangeError);
    expect(() => truncateSchmidt([0.8, 0.8], 1)).toThrow(RangeError);
    expect(() => truncateSchmidt([0.2, 0.8], 1)).toThrow(RangeError);
    expect(() => truncateSchmidt([0.7, 0.3], 0)).toThrow(RangeError);
    expect(() => bondEntropyBound(0, 3, 3)).toThrow(RangeError);
  });
});

describe('quantum curriculum expansion', () => {
  it('adds eight complete lessons to the final two packs with resolvable prerequisites', () => {
    const lessons = Object.values(QUANTUM_SIMULATION_LECTURES);
    expect(lessons.map((lesson) => lesson.lectureNumber)).toEqual([61, 62, 63, 64, 65, 66, 67, 68]);
    expect(MASTERY_PACKS.slice(-2).flatMap((pack) => pack.lectureIds)).toEqual(
      lessons.map((lesson) => lesson.id)
    );
    for (const lesson of lessons) {
      expect(LECTURE_MAP.has(lesson.id)).toBe(true);
      lesson.prerequisites.forEach((id) => expect(LECTURE_MAP.has(id), id).toBe(true));
      expect(lesson.subtitle).toBe('');
      lesson.theoreticalCitations.forEach((citation) => expect(citation.doiOrUrl).toMatch(/^https:\/\//));
    }
    expect(new Set(lessons.map((lesson) => lesson.durationMinutes)).size).toBeGreaterThan(3);
  });

  it('renders every new formula without a KaTeX error', () => {
    for (const lesson of Object.values(QUANTUM_SIMULATION_LECTURES)) {
      const expressions = lesson.theoreticalCitations.map((citation) => citation.expression);
      for (const text of [lesson.content.theory, lesson.content.workedExample, lesson.content.exercise]) {
        for (const match of text.matchAll(/\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$/g))
          expressions.push(match[1] ?? match[2]);
      }
      for (const expression of expressions) {
        expect(
          () => katex.renderToString(expression, { throwOnError: true }),
          `${lesson.id}: ${expression}`
        ).not.toThrow();
      }
    }
  });
});
