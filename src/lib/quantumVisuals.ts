function inRange(value: number, min: number, max: number) {
  if (!Number.isFinite(value) || value < min || value > max) throw new RangeError('Invalid visual parameter');
  return value;
}

/** Amplitude damping applied to |+><+|, with gamma in [0, 1]. */
export function dampedPlusState(gamma: number) {
  inRange(gamma, 0, 1);
  const x = Math.sqrt(1 - gamma);
  const z = gamma;
  return {
    x,
    z,
    ground: (1 + gamma) / 2,
    excited: (1 - gamma) / 2,
    coherence: x / 2,
    purity: (1 + x * x + z * z) / 2
  };
}

/** Schmidt probabilities for cos(theta)|00> + sin(theta)|11>. */
export function entangledPair(degrees: number) {
  const theta = (inRange(degrees, 0, 45) * Math.PI) / 180;
  const p11 = Math.sin(theta) ** 2;
  const p00 = 1 - p11;
  const entropy = -[p00, p11].reduce((sum, p) => sum + (p === 0 ? 0 : p * Math.log2(p)), 0);
  return { p00, p11, entropy };
}

/** Weights are squared Schmidt coefficients in descending order, summing to one. */
export function truncateSchmidt(weights: readonly number[], keep: number) {
  if (
    !weights.length ||
    !Number.isInteger(keep) ||
    keep < 1 ||
    keep > weights.length ||
    weights.some(
      (weight, i) => !Number.isFinite(weight) || weight < 0 || (i > 0 && weight > weights[i - 1])
    ) ||
    Math.abs(weights.reduce((sum, weight) => sum + weight, 0) - 1) > 1e-9
  ) {
    throw new RangeError('Invalid normalized Schmidt spectrum');
  }
  const retained = weights.slice(0, keep).reduce((sum, weight) => sum + weight, 0);
  return {
    discarded: Math.max(0, 1 - retained),
    fidelity: retained,
    normalized: weights.slice(0, keep).map((weight) => weight / retained)
  };
}

export function bondEntropyBound(chi: number, leftQubits: number, rightQubits: number) {
  if (
    ![chi, leftQubits, rightQubits].every(Number.isSafeInteger) ||
    chi < 1 ||
    leftQubits < 0 ||
    rightQubits < 0
  ) {
    throw new RangeError('Invalid bond dimensions');
  }
  return Math.min(Math.log2(chi), leftQubits, rightQubits);
}
