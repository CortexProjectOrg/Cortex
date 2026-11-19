import { diagram, view } from './DiagramWidget';

export const SIMULATION_DIAGRAMS = {
  'L47-matrix-free-hamiltonian-products': diagram(
    'Send an amplitude to its destination',
    view(
      'Apply XZ to |00⟩',
      'For the term X on the first site and Z on the second, the X mask flips the first bit.',
      ['Visit a basis index', '00', '→', '10'],
      ['Phase from the second bit', '+1'],
      ['Contribution', '+a₀₀ to output 10']
    ),
    view(
      'Apply XZ to |01⟩',
      'The destination still comes from the X mask. Z supplies a sign from the original second bit.',
      ['Visit a basis index', '01', '→', '11'],
      ['Phase from the second bit', '−1'],
      ['Contribution', '−a₀₁ to output 11']
    )
  ),
  'L48-convergence-precision-architecture': diagram(
    'Remove overlap with an old basis vector',
    view(
      'Before reorthogonalization',
      'The new vector contains a component in the old direction q₁ = (1, 0).',
      ['New vector', '(0.8, 0.6)'],
      ['Inner product with q₁', '0.8']
    ),
    view(
      'After reorthogonalization',
      'Subtract the overlap times q₁ and normalize the remainder. The corrected vector is perpendicular to q₁.',
      ['Vector', '(0.8, 0.6)', '→', '(0, 0.6)', '→', '(0, 1)'],
      ['Inner product with q₁', '0']
    )
  ),
  'L50-commutation-graphs-clique-covers': diagram(
    'Cover three terms with commuting groups',
    view(
      'Group XX with ZZ',
      'XX commutes with both other terms. ZZ and XI anticommute, so they must go in different groups.',
      ['Commuting edges', 'XX ↔ ZZ', 'XX ↔ XI'],
      ['Group 1', 'XX', 'ZZ'],
      ['Group 2', 'XI']
    ),
    view(
      'Group XX with XI',
      'A cover can choose different edges. This choice also uses two groups.',
      ['Commuting edges', 'XX ↔ ZZ', 'XX ↔ XI'],
      ['Group 1', 'XX', 'XI'],
      ['Group 2', 'ZZ']
    )
  ),
  'L51-rotated-cliques-diagonalization-circuits': diagram(
    'Read two observables from one bit pair',
    view(
      'Bell state Φ⁺',
      'Apply CNOT from qubit 1 to 2, then H on qubit 1. The output bits encode the eigenvalues of XX and ZZ, respectively.',
      ['Measurement circuit', 'Φ⁺', '→', 'CNOT', '→', 'H on 1', '→', '00'],
      ['Eigenvalues', 'XX = +1', 'ZZ = +1']
    ),
    view(
      'Bell state Φ⁻',
      'The relative phase flips the first readout bit. Both components still have equal bits in the original basis.',
      ['Measurement circuit', 'Φ⁻', '→', 'CNOT', '→', 'H on 1', '→', '10'],
      ['Eigenvalues', 'XX = −1', 'ZZ = +1']
    )
  ),
  'L53-mcmc-covariance-integration': diagram(
    'Covariance changes the uncertainty of a sum',
    view(
      'Draws move together',
      'Treat these two draws as an equally weighted toy posterior. Both terms have variance 1, and their covariance adds to the variance of the sum.',
      ['Draws (A, B)', '(−1, −1)', '(+1, +1)'],
      ['A + B', '−2', '+2'],
      ['Cov(A, B) and Var(A + B)', '+1', '4']
    ),
    view(
      'Draws move in opposite directions',
      'Each individual variance stays 1. The negative covariance cancels both contributions to the variance of the sum.',
      ['Draws (A, B)', '(−1, +1)', '(+1, −1)'],
      ['A + B', '0', '0'],
      ['Cov(A, B) and Var(A + B)', '−1', '0']
    )
  ),
  'L54-hardware-noise-systematic-shifts': diagram(
    'Calibrate a noisy readout',
    view(
      'No assignment error',
      'An ideal detector reports the probability of measuring 1 directly.',
      ['True p(1)', '0.75'],
      ['Reported p(1)', '0.75']
    ),
    view(
      '10% symmetric bit flips',
      'The model gives reported p = 0.10 + 0.80 × true p. Use the inverse when the flip rate comes from calibration.',
      ['True probability to reported', '0.75', '→', '0.70'],
      ['Corrected estimate', '(0.70 − 0.10) / 0.80 = 0.75']
    )
  ),
  'L55-majorana-fermions-encodings': diagram(
    'Grow a Jordan–Wigner parity string',
    view(
      'X-type Majorana on site 1',
      'The first site has no earlier occupations, so the encoding begins with X.',
      ['Sites 1–3', 'X', 'I', 'I']
    ),
    view(
      'X-type Majorana on site 3',
      'The Z factors on earlier sites supply the fermion parity sign. The X factor is at the selected site.',
      ['Sites 1–3', 'Z', 'Z', 'X']
    )
  ),
  'L56-gaussian-states-matchgate-simulation': diagram(
    'Rotate a Majorana covariance pattern',
    view(
      'Before a plane rotation',
      'Four Majorana coordinates describe two fermionic modes. The lower triangle of the covariance matrix has the opposite signs.',
      ['Nonzero entries', 'Γ₁₂ = +1', 'Γ₃₄ = +1']
    ),
    view(
      'After a quarter turn in the 1–3 plane',
      'Replace γ₁ with γ₃ and γ₃ with −γ₁. The same two correlations move to different pairs through Γ ↦ RΓRᵀ.',
      ['New coordinates', 'γ′₁ = γ₃', 'γ′₃ = −γ₁'],
      ['Nonzero entries', 'Γ′₁₄ = +1', 'Γ′₂₃ = +1']
    )
  ),
  'L57-qec-stabilizer-codes-automorphisms': diagram(
    'Swap the ends of a repetition code',
    view(
      'Flip qubit 1',
      'The three-qubit bit-flip code has checks ZZI and IZZ. A flip on qubit 1 only changes the sign of the first check.',
      ['Syndrome for (ZZI, IZZ)', '−1', '+1']
    ),
    view(
      'Reflect the qubits',
      'Exchanging sites 1 and 3 swaps the two checks and moves the error to qubit 3. The code space stays fixed.',
      ['Error moves', 'XII', '→', 'IIX'],
      ['Syndrome for (ZZI, IZZ)', '+1', '−1']
    )
  ),
  'L58-cuda-lanczos-gpu-kernels': diagram(
    'Count bytes in a state-vector pass',
    view(
      '20 qubits',
      'A complex64 amplitude uses 8 bytes. Count one input read and one output write per amplitude for this simplified pass.',
      ['Vector', '2²⁰ entries', '8 MiB'],
      ['Minimum traffic for the pass', '8 MiB read', '8 MiB written', '16 MiB total']
    ),
    view(
      '22 qubits',
      'Two extra qubits quadruple the entries and the byte count for the same access pattern.',
      ['Vector', '2²² entries', '32 MiB'],
      ['Minimum traffic for the pass', '32 MiB read', '32 MiB written', '64 MiB total']
    )
  ),
  'L59-batched-cuda-covariance-offload': diagram(
    'Combine partial covariance sums',
    view(
      'Positive mean product',
      'Once samples are centered, sum their pairwise products in batches and divide the total by the draw count for the empirical posterior mean.',
      ['Centered products by batch', '[2, 1]', '[−1, 2]'],
      ['Partial sums to mean', '3 and 1', '→', '4 total', '→', '1 per draw']
    ),
    view(
      'Products cancel',
      'Each batch produces a partial sum. Contributions can cancel across batches.',
      ['Centered products by batch', '[−3, −1]', '[1, 3]'],
      ['Partial sums to mean', '−4 and 4', '→', '0 total', '→', '0 per draw']
    )
  ),
  'L60-qudit-algebra-mixed-dimension-registers': diagram(
    'Shift by two around a qudit',
    view(
      'Dimension 3',
      'Applying X² adds 2 modulo 3. All three basis labels appear in the orbit of 0.',
      ['Orbit of |0⟩', '0', '→', '2', '→', '1', '→', '0'],
      ['Steps to return', '3']
    ),
    view(
      'Dimension 4',
      'The same shift now visits only the even labels from 0. The shift still permutes the whole basis.',
      ['Orbit of |0⟩', '0', '→', '2', '→', '0'],
      ['Steps to return', '2']
    )
  ),
  'L61-quantum-channels-kraus': diagram(
    'Keep or forget the measurement record',
    view(
      'Keep outcome 0',
      'Measuring |+⟩ in the Z basis gives outcome 0 half the time. The normalized conditional output is pure.',
      ['Conditional branch', '|+⟩', '→', 'Outcome 0 · p = ½', '→', '|0⟩'],
      ['Purity', '1']
    ),
    view(
      'Forget the outcome',
      'Average the two output density matrices with equal weights. This removes the off-diagonal entries.',
      ['Averaged state', '½|0⟩⟨0| + ½|1⟩⟨1|', '→', 'I/2'],
      ['Purity', '½']
    )
  ),
  'L64-quantum-trajectories': diagram(
    'Average four decay trajectories',
    view(
      'Observe at t = 0.5',
      'Compare the observation time with each example jump time. A trajectory stays excited until it jumps.',
      ['Jump times', '0.2', '0.6', '1.2', '1.8'],
      ['States at t = 0.5', '|0⟩', '|1⟩', '|1⟩', '|1⟩'],
      ['Estimated excited population', '3/4']
    ),
    view(
      'Observe at t = 1.5',
      'Two more trajectories have jumped. The mean excited population falls even though every individual trajectory is in a pure state.',
      ['Jump times', '0.2', '0.6', '1.2', '1.8'],
      ['States at t = 1.5', '|0⟩', '|0⟩', '|0⟩', '|1⟩'],
      ['Estimated excited population', '1/4']
    )
  )
};
