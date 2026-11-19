import { describe, expect, it } from 'vitest';
import {
  mapProperties,
  measurementShots,
  modularOrbit,
  PLANE_MAPS,
  realCircuit,
  transformVector,
  type RealGate
} from '../src/lib/lessonWidgets';

describe('lesson widget models', () => {
  it('distinguishes injectivity from surjectivity when the codomain changes', () => {
    expect(mapProperties([0, 1, 2], 3)).toEqual({ imageSize: 3, injective: true, surjective: true });
    expect(mapProperties([0, 1, 2], 4)).toEqual({ imageSize: 3, injective: true, surjective: false });
    expect(mapProperties([0, 0, 1], 2)).toEqual({ imageSize: 2, injective: false, surjective: true });
    expect(() => mapProperties([3], 3)).toThrow(RangeError);
  });
  it('generates cyclic subgroups by repeated modular addition', () => {
    expect(modularOrbit(6, 2)).toEqual([0, 2, 4, 0, 2, 4, 0]);
    expect(new Set(modularOrbit(6, 5)).size).toBe(6);
    expect(new Set(modularOrbit(7, 3)).size).toBe(7);
    expect(modularOrbit(6, -1)).toEqual([0, 5, 4, 3, 2, 1, 0]);
  });
  it('preserves linearity and shows the projection kernel', () => {
    for (const { matrix } of Object.values(PLANE_MAPS)) {
      const u = transformVector(matrix, [2, -1]);
      const v = transformVector(matrix, [-1, 2]);
      expect(transformVector(matrix, [1, 1])).toEqual([u[0] + v[0], u[1] + v[1]]);
    }
    expect(transformVector(PLANE_MAPS.rotate.matrix, [1, 0])).toEqual([0, 1]);
    expect(transformVector(PLANE_MAPS.project.matrix, [0, 2])).toEqual([0, 0]);
    expect(transformVector(PLANE_MAPS.shear.matrix, [1, 1])).toEqual([2, 1]);
  });
  it('retains relative phase and unit norm through gate sequences', () => {
    const hh = realCircuit(['H', 'H']);
    expect(hh[0]).toBeCloseTo(1);
    expect(hh[1]).toBeCloseTo(0);
    const hzh = realCircuit(['H', 'Z', 'H']);
    expect(hzh[0]).toBeCloseTo(0);
    expect(hzh[1]).toBeCloseTo(1);
    const minus = realCircuit(['H', 'Z']);
    expect(minus[0]).toBeGreaterThan(0);
    expect(minus[1]).toBeLessThan(0);
    for (const first of ['H', 'X', 'Z'] as RealGate[]) {
      for (const second of ['H', 'X', 'Z'] as RealGate[]) {
        const state = realCircuit([first, second, 'H']);
        expect(state[0] ** 2 + state[1] ** 2).toBeCloseTo(1);
      }
    }
  });
  it('extends a repeatable sampling run without replacing previous outcomes', () => {
    expect(measurementShots(0, 20)).toEqual(Array(20).fill(false));
    expect(measurementShots(1, 20)).toEqual(Array(20).fill(true));
    const first = measurementShots(0.5, 100);
    expect(measurementShots(0.5, 200).slice(0, 100)).toEqual(first);
    expect(first.some(Boolean)).toBe(true);
    expect(first.some((one) => !one)).toBe(true);
    expect(measurementShots(0.25, 100).every((one, i) => !one || first[i])).toBe(true);
    expect(() => measurementShots(1.1, 10)).toThrow(RangeError);
    expect(() => measurementShots(0.5, 2001)).toThrow(RangeError);
  });
});
