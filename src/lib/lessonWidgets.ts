export type Vec2 = readonly [number, number];
export type Matrix2 = readonly [Vec2, Vec2];
export type RealGate = 'H' | 'X' | 'Z';

export function mapProperties(outputs: readonly number[], codomainSize: number) {
  if (
    !Number.isInteger(codomainSize) ||
    codomainSize < 1 ||
    outputs.some((v) => !Number.isInteger(v) || v < 0 || v >= codomainSize)
  )
    throw new RangeError('Invalid finite map');
  const imageSize = new Set(outputs).size;
  return { imageSize, injective: imageSize === outputs.length, surjective: imageSize === codomainSize };
}

export function modularOrbit(modulus: number, step: number): number[] {
  if (!Number.isInteger(modulus) || modulus < 2 || modulus > 12 || !Number.isInteger(step))
    throw new RangeError('Invalid modular clock');
  return Array.from({ length: modulus + 1 }, (_, k) => (((k * step) % modulus) + modulus) % modulus);
}

export function transformVector(matrix: Matrix2, vector: Vec2): Vec2 {
  return [
    matrix[0][0] * vector[0] + matrix[0][1] * vector[1],
    matrix[1][0] * vector[0] + matrix[1][1] * vector[1]
  ];
}

export const PLANE_MAPS: Record<string, { label: string; matrix: Matrix2; formula: string }> = {
  rotate: {
    label: 'Quarter turn',
    matrix: [
      [0, -1],
      [1, 0]
    ],
    formula: 'T(x, y) = (−y, x)'
  },
  shear: {
    label: 'Shear',
    matrix: [
      [1, 1],
      [0, 1]
    ],
    formula: 'T(x, y) = (x + y, y)'
  },
  stretch: {
    label: 'Stretch x',
    matrix: [
      [2, 0],
      [0, 1]
    ],
    formula: 'T(x, y) = (2x, y)'
  },
  project: {
    label: 'Project onto x',
    matrix: [
      [1, 0],
      [0, 0]
    ],
    formula: 'T(x, y) = (x, 0)'
  }
};

/** Real amplitudes suffice for circuits built from H, X, and Z, starting at |0>. */
export function realCircuit(gates: readonly RealGate[]): Vec2 {
  return gates.reduce<Vec2>(
    ([a, b], gate) => {
      if (gate === 'H') return [(a + b) / Math.SQRT2, (a - b) / Math.SQRT2];
      if (gate === 'X') return [b, a];
      return [a, -b];
    },
    [1, 0]
  );
}

/** Reproducible Bernoulli demonstration; prefixes remain the same as more shots are requested. */
export function measurementShots(probability: number, count: number): boolean[] {
  if (
    !Number.isFinite(probability) ||
    probability < 0 ||
    probability > 1 ||
    !Number.isInteger(count) ||
    count < 0 ||
    count > 2000
  )
    throw new RangeError('Invalid measurement sample');
  let seed = 0x19a1;
  return Array.from({ length: count }, () => {
    seed += 0x6d2b79f5;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296 < probability;
  });
}
