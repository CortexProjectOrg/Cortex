import { CURRENT_LECTURE_EDITION } from '../../shared/ink';

export type LectureVisualKind = 'diagram' | 'practice';
export type LectureVisualSection = 'theory' | 'workedExample';
type Location = {
  section: LectureVisualSection;
  afterHeading?: string;
  legacyHeading?: string;
};

const theory = (afterHeading: string, legacyHeading?: string): Location => ({
  section: 'theory',
  afterHeading,
  legacyHeading
});
const example: Location = { section: 'workedExample' };

// Use the rendered heading IDs so a visual follows the whole explanation, including its equations.
const locations: Partial<Record<string, Partial<Record<LectureVisualKind, Location>>>> = {
  'L01-sets-maps-proofs': {
    practice: theory('inverses-and-composition', '2-properties-of-maps-injective-surjective-bijective')
  },
  'L02-groups-modular-arithmetic': {
    practice: theory('residue-classes', '2-residue-classes-and-modular-arithmetic')
  },
  'L03-finite-fields-gf2-gfp': {
    practice: theory('prime-fields', '3-prime-fields-mathbbf_p-for-qudit-systems')
  },
  'L04-vector-spaces-finite-fields': {
    practice: theory('linear-combinations-and-subspaces', '1-vector-spaces-over-finite-fields'),
    diagram: theory('independence-and-bases', '2-linear-independence-and-bases')
  },
  'L05-linear-maps-matrices': {
    practice: theory('rank-and-nullity', '2-kernel-image-and-the-rank-nullity-theorem')
  },
  'L06-bilinear-symplectic-forms': { diagram: theory('alternating-forms', '2-the-standard-symplectic-form') },
  'L07-symplectic-group-sp2n': {
    diagram: theory('symplectic-planes', '1-definition-of-the-symplectic-group')
  },
  'L08-eigenvalues-without-diagonalization': { diagram: example },
  'L09-complex-inner-products-hilbert': {
    practice: theory('orthogonality-and-projections', '3-orthonormal-bases-and-completeness')
  },
  'L10-one-qubit-states-measurement': { practice: example },
  'L11-unitary-operators-quantum-gates': { practice: theory('2-the-single-qubit-gate-alphabet') },
  'L12-multi-qubit-systems-entanglement': { practice: theory('2-separable-states-vs-entangled-states') },
  'L13-density-matrices-mixed-states': { practice: theory('2-pure-states-vs-mixed-states') },
  'L14-circuit-model-universal-sets': { diagram: theory('2-universal-quantum-gate-sets') },
  'L15-pauli-matrices-algebra': { diagram: theory('2-the-pauli-multiplication-rule') },
  'L16-n-qubit-pauli-strings': { diagram: theory('1-the-n-qubit-pauli-group-mathcalp_n') },
  'L17-binary-symplectic-encoding': { diagram: theory('1-the-binary-encoding-x-mid-z') },
  'L18-symplectic-product-commutation': { practice: theory('2-the-fundamental-commutation-identity') },
  'L19-acquired-phases-hostens-moduli': { diagram: theory('1-the-pauli-multiplication-phase-factor') },
  'L20-pauli-sums-observables-hamiltonians': { diagram: theory('3-energy-evaluation-via-linearity') },
  'L21-clifford-group-definition': { diagram: theory('1-the-normalizer-definition') },
  'L22-standard-generators-conjugation': { diagram: theory('3-two-qubit-cnot-conjugation-rules') },
  'L23-symplectic-clifford-isomorphism': {
    diagram: theory('2-standard-matrices-for-single-qubit-gates-n--1')
  },
  'L24-symplectic-transvections': { diagram: example },
  'L25-clifford-circuit-synthesis': { diagram: example },
  'L26-clifford-uniform-sampling': { diagram: example },
  'L27-stabilizer-states-generators': { diagram: example },
  'L28-aaronson-gottesman-tableaux': { diagram: theory('3-canonical-initial-state-0rangleotimes-n') },
  'L29-tableau-gate-updates': { diagram: theory('1-hadamard-update-rule-on-qubit-a') },
  'L30-stabilizer-measurement-algorithm': {
    diagram: theory('3-state-collapse-in-the-deterministic-case-case-2')
  },
  'L31-gottesman-knill-theorem': { diagram: theory('2-physical-and-computational-implications') },
  'L32-magic-states-pauli-based-computation': {
    diagram: theory('2-magic-states-and-the-t-gate-teleportation-gadget')
  },
  'L33-program-ir-routes': { diagram: theory('2-multi-engine-simulation-routing') },
  'L34-pauli-frame-batched-sampling': { diagram: theory('3-batched-multi-shot-simd-parallelism') },
  'L35-circuit-peephole-rewrites': { practice: theory('2-common-peephole-rewrite-rules') },
  'L36-ket-networks-path-sums': { diagram: theory('3-feynman-path-sums-for-single-amplitudes') },
  'L37-many-body-hamiltonians-models': { diagram: theory('1-canonical-quantum-spin-models') },
  'L38-symmetry-as-operator-commutation': {
    diagram: theory('2-simultaneous-eigenspaces-and-block-diagonalization')
  },
  'L39-clifford-symmetries-paper-tour': { diagram: theory('1-clifford-symmetries-of-quantum-hamiltonians') },
  'L40-colored-graphs-interaction-graphs': {
    diagram: theory('1-construction-of-the-colored-interaction-graph')
  },
  'L41-partition-refinement-backtracking': { practice: example },
  'L42-term-fixers-exact-kernel': { diagram: theory('1-definition-of-the-term-fixer-kernel') },
  'L43-commuting-paulis-sector-resolution': { diagram: theory('2-algorithmic-procedure') },
  'L44-block-diagonalization-pipeline': {
    diagram: theory('1-the-5-stage-block-diagonalization-architecture')
  },
  'L45-krylov-subspaces-power-iteration': { practice: example },
  'L46-lanczos-three-term-recurrence': { diagram: example },
  'L47-matrix-free-hamiltonian-products': { diagram: theory('1-the-pauli-basis-action') },
  'L48-convergence-precision-architecture': { diagram: example },
  'L49-quantum-observable-estimation-budget': { practice: example },
  'L50-commutation-graphs-clique-covers': { diagram: theory('2-the-minimum-clique-cover-problem') },
  'L51-rotated-cliques-diagonalization-circuits': { diagram: example },
  'L52-bayesian-adaptive-allocation': { practice: theory('1-the-neyman-optimal-allocation') },
  'L53-mcmc-covariance-integration': { diagram: theory('2-bayesian-posterior-integration-equation-7') },
  'L54-hardware-noise-systematic-shifts': { diagram: theory('1-readout-error-mitigation-matrix-inversion') },
  'L55-majorana-fermions-encodings': { diagram: theory('2-jordan-wigner-vs-bravyi-kitaev') },
  'L56-gaussian-states-matchgate-simulation': { diagram: theory('2-the-fermionic-covariance-matrix') },
  'L57-qec-stabilizer-codes-automorphisms': {
    diagram: theory('3-transversal-automorphisms-and-fault-tolerant-gates')
  },
  'L58-cuda-lanczos-gpu-kernels': { diagram: theory('3-coalesced-memory-access-and-shared-memory-tiling') },
  'L59-batched-cuda-covariance-offload': { diagram: theory('2-batched-cuda-architecture') },
  'L60-qudit-algebra-mixed-dimension-registers': {
    diagram: theory('1-the-qudit-hilbert-space-and-heisenberg-weyl-operators')
  },
  'L61-quantum-channels-kraus': { diagram: theory('measurement-versus-forgetting-an-outcome') },
  'L62-quantum-noise-channels': { practice: theory('what-purity-does-and-does-not-tell-you') },
  'L63-lindblad-quantum-dynamics': { practice: example },
  'L64-quantum-trajectories': {
    practice: theory('recovering-the-master-equation'),
    diagram: theory('exact-waiting-times-in-a-simple-model')
  },
  'L65-schmidt-quantum-entanglement': { practice: theory('reduced-states-and-entropy') },
  'L66-matrix-product-quantum-states': { practice: theory('why-a-bond-limits-entanglement') },
  'L67-tebd-quantum-time-evolution': { practice: theory('compress-with-a-measured-loss') },
  'L68-dmrg-quantum-ground-states': { practice: example },
  'L69-quantifiers-counterexamples': { diagram: theory('quantifier-order-is-a-dependency') },
  'L70-direct-contrapositive-contradiction': { diagram: example },
  'L71-induction-recursive-arguments': { diagram: example },
  'L72-invariants-termination': { practice: example },
  'L73-quantum-lc-resonator': { diagram: example },
  'L74-coherent-drives-rabi-oscillations': { practice: example },
  'L75-transmon-anharmonicity-leakage': { diagram: example },
  'L76-dispersive-readout': { diagram: example },
  'L77-three-qubit-repetition-code': { practice: example },
  'L78-knill-laflamme-conditions': { diagram: example },
  'L79-css-steane-code': { diagram: example },
  'L80-surface-code-repeated-syndromes': { diagram: example },
  'L81-relaxation-ramsey-echo': { diagram: example },
  'L82-randomized-benchmarking': { diagram: theory('undo-a-random-sequence') },
  'L83-coherent-stochastic-errors': { practice: example },
  'L84-noise-spectroscopy-filter-functions': { practice: example },
  'L85-floating-point-cancellation': { practice: example },
  'L86-conditioning-linear-solves': { diagram: example },
  'L87-least-squares-qr-svd': { diagram: example },
  'L88-dft-fast-fourier-transform': { diagram: example },
  'L89-conditional-probability-bayes': { diagram: example },
  'L90-monte-carlo-variance': { diagram: example },
  'L91-concentration-sample-complexity': { practice: example },
  'L92-markov-chains-mixing-mcmc': { diagram: example },
  'L93-hamiltonian-time-evolution': { diagram: example },
  'L94-spin-measurement-rotations': { diagram: example },
  'L95-quantum-thermal-states': { diagram: example },
  'L96-adiabatic-evolution-gaps': { practice: example },
  'L97-cost-models-asymptotics': { diagram: example },
  'L98-np-completeness-reductions': { diagram: example },
  'L99-randomized-complexity-amplification': { practice: example },
  'L100-space-complexity-reachability': { diagram: example },
  'L101-quantum-queries-phase-kickback': { diagram: example },
  'L102-grover-search-query-bounds': { practice: example },
  'L103-quantum-phase-estimation': { diagram: example },
  'L104-quantum-order-finding': { diagram: example },
  'L105-bqp-circuit-complexity': { diagram: example },
  'L106-qma-local-hamiltonian': { diagram: example },
  'L107-strong-weak-simulation': { diagram: example },
  'L108-hamiltonian-simulation-cost': { practice: example }
};

const revisionFiveLocations: typeof locations = {
  'L11-unitary-operators-quantum-gates': { practice: example },
  'L12-multi-qubit-systems-entanglement': { practice: theory('build-a-bell-state') },
  'L13-density-matrices-mixed-states': { practice: example },
  'L23-symplectic-clifford-isomorphism': { diagram: example },
  'L32-magic-states-pauli-based-computation': { diagram: theory('prepare-and-measure-the-ancilla') },
  'L53-mcmc-covariance-integration': { diagram: example },
  'L54-hardware-noise-systematic-shifts': { diagram: example },
  'L57-qec-stabilizer-codes-automorphisms': { diagram: example },
  'L60-qudit-algebra-mixed-dimension-registers': { diagram: example }
};

export function lectureVisualPlacements(lectureId: string, legacy = false, revision = legacy ? 1 : 5) {
  const lecture =
    (revision >= CURRENT_LECTURE_EDITION ? revisedLocations[lectureId] : undefined) ??
    (revision >= 5 ? revisionFiveLocations[lectureId] : undefined) ??
    locations[lectureId];
  return (['practice', 'diagram'] as const).flatMap((kind) => {
    const location = lecture?.[kind];
    return location
      ? [
          {
            kind,
            section: location.section,
            afterHeading: (legacy ? location.legacyHeading : undefined) ?? location.afterHeading
          }
        ]
      : [];
  });
}
const revisedLocations: typeof locations = {
  'L13-density-matrices-mixed-states': { diagram: example },
  'L44-block-diagonalization-pipeline': { diagram: example },
  'L52-bayesian-adaptive-allocation': { diagram: example },
  'L84-noise-spectroscopy-filter-functions': { diagram: example, practice: example }
};
