const errata: Partial<Record<number, [lastEdition: number, correction: string]>> = {
  1: [
    4,
    'A bijection is an isomorphism only when it preserves the relevant structure. Tag index sets before taking a disjoint union for tensor-product bases.'
  ],
  2: [3, 'A modular u8 addition must widen before adding or use overflow-safe modular arithmetic.'],
  3: [
    3,
    'Field choice gives the algebraic operations. Memory allocation depends on the representation and implementation.'
  ],
  4: [
    3,
    'An unsigned isotropic label space does not determine stabilizer signs. The stated dimension identity requires a nondegenerate pairing.'
  ],
  5: [3, 'A packed result stored in a single u64 can represent at most 64 output rows.'],
  6: [
    3,
    'Only a nonidentity Pauli label has an anticommuting partner. Scalar multiples of I commute with every operator.'
  ],
  7: [
    3,
    'Y equals iXZ. In the quotient by scalar phases, Y and XZ have the same label. The phase gate is diag(1, i).'
  ],
  8: [3, 'Tracelessness applies to Paulis with a nonidentity label. The scalar −I has nonzero trace.'],
  9: [
    3,
    'A Hilbert space must be complete in the norm induced by its inner product. The displayed rank-one projection uses a unit vector.'
  ],
  10: [4, 'Bloch azimuth is arbitrary at either pole.'],
  11: [
    4,
    'Unitary evolution is reversible. Universality beyond Cliffords needs a non-Clifford resource, of which T is one example.'
  ],
  12: [
    4,
    'Distant measurement outcomes may be correlated without allowing signaling. For the CNOT code, validate distinct, in-range wire indices and a statevector of the expected length.'
  ],
  13: [
    4,
    'A subsystem can be pure. Purity testing assumes a valid density operator and needs a numerical tolerance in floating-point arithmetic.'
  ],
  23: [
    4,
    'The projective Clifford action on binary labels forgets signs. The CNOT matrix and the signed-action example are available in the corrected edition.'
  ],
  24: [
    3,
    'An X-axis transvection gives the unsigned X-axis quarter-turn. The unsigned S gate is the Z-axis transvection.'
  ],
  32: [
    4,
    'For the displayed injection gadget, the outcome-1 correction is S. The corrected derivation gives both ancilla branches.'
  ],
  41: [
    3,
    'The old walkthrough omits its pruning setup and mask. Use the annotated search steps in the corrected edition.'
  ],
  45: [
    3,
    'Power iteration targets largest eigenvalue magnitude. A stable Rayleigh estimate alone can miss a large residual.'
  ],
  46: [
    3,
    'When beta is zero, stop before normalizing the next vector. The corrected edition also renders the tridiagonal projection.'
  ],
  48: [
    3,
    'Deleting nearby Ritz values can remove a valid eigenvalue along with a ghost. Inspect residuals and orthogonality before classifying duplicates.'
  ],
  53: [
    4,
    'Separate conditional shot covariance, covariance of conditional means, and chain error. Keep repeated states after Metropolis–Hastings rejections.'
  ],
  54: [
    4,
    'Use the number operator (I−Z)/2 and assess assignment-matrix conditioning. Zero-noise extrapolation has residual model and statistical error.'
  ],
  57: [
    4,
    'A transversal action is one kind of code automorphism. With all-X and all-Z logical Paulis, transversal S on this Steane convention induces logical S†.'
  ],
  60: [
    4,
    'The qutrit projective Clifford group has order 216. Its order-24 symplectic quotient follows after removing the order-9 projective Pauli subgroup. Widen before adding modular labels.'
  ]
};

export function retainedLectureCorrection(lectureNumber: number, edition: number) {
  const entry = errata[lectureNumber];
  return entry && edition <= entry[0] ? entry[1] : undefined;
}
