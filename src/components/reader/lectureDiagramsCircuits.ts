import { diagram, view } from './DiagramWidget';

export const CIRCUIT_DIAGRAMS = {
  'L25-clifford-circuit-synthesis': diagram(
    'Track a SWAP through three CNOTs',
    view(
      'Input 01',
      'Each CNOT changes only its target, using the current control bit.',
      ['Bits after each gate', '01', '→', '01', '→', '11', '→', '10'],
      ['Gate order', '1 controls 2', '2 controls 1', '1 controls 2']
    ),
    view(
      'Input 10',
      'The same construction swaps this input in the opposite direction. Its action is linear on superpositions.',
      ['Bits after each gate', '10', '→', '11', '→', '01', '→', '01'],
      ['Gate order', '1 controls 2', '2 controls 1', '1 controls 2']
    )
  ),
  'L26-clifford-uniform-sampling': diagram(
    'Choose a symplectic basis pair',
    view(
      'First vector (1, 0)',
      'Choose the first vector uniformly from the three nonzero vectors in F₂². Then choose uniformly from its two compatible partners.',
      ['First vector', '(1, 0)'],
      ['Partners with pairing 1', '(0, 1)', '(1, 1)']
    ),
    view(
      'First vector (1, 1)',
      'The compatible partners change with the first vector. Each ordered symplectic basis pair has probability 1/6.',
      ['First vector', '(1, 1)'],
      ['Partners with pairing 1', '(1, 0)', '(0, 1)']
    )
  ),
  'L27-stabilizer-states-generators': diagram(
    'One sign changes the Bell state',
    view(
      'Positive XX generator',
      'ZZ restricts the state to equal bits. The +XX constraint requires equal amplitudes.',
      ['Generators with eigenvalue +1', '+ZZ', '+XX'],
      ['Unique state', '(|00⟩ + |11⟩)/√2']
    ),
    view(
      'Negative XX generator',
      'The equal-bit constraint remains. Now the amplitudes have opposite signs.',
      ['Generators with eigenvalue +1', '+ZZ', '−XX'],
      ['Unique state', '(|00⟩ − |11⟩)/√2']
    )
  ),
  'L28-aaronson-gottesman-tableaux': diagram(
    'Read a one-qubit tableau',
    view(
      'State |0⟩',
      'Each row records a sign and x and z bits. The destabilizer anticommutes with its paired stabilizer.',
      ['Row columns', 'Sign', 'x', 'z'],
      ['Destabilizer X', '+', '1', '0'],
      ['Stabilizer Z', '+', '0', '1']
    ),
    view(
      'State |1⟩',
      'Both states use the same x and z bits. The sign of the stabilizer distinguishes them.',
      ['Row columns', 'Sign', 'x', 'z'],
      ['Destabilizer X', '+', '1', '0'],
      ['Stabilizer −Z', '−', '0', '1']
    )
  ),
  'L29-tableau-gate-updates': diagram(
    'Update a tableau row with H',
    view(
      'X row',
      'Hadamard exchanges the x and z bits. Here the sign remains positive.',
      ['Operator', '+X', '→', '+Z'],
      ['Bits (x, z)', '(1, 0)', '→', '(0, 1)']
    ),
    view(
      'Y row',
      'The bits are both 1, so swapping them leaves that part of the row unchanged. The sign still flips.',
      ['Operator', '+Y', '→', '−Y'],
      ['Bits (x, z)', '(1, 1)', '→', '(1, 1)']
    )
  ),
  'L30-stabilizer-measurement-algorithm': diagram(
    'When is the outcome random?',
    view(
      'Measure Z on |0⟩',
      'Z is already a positive stabilizer, so only the +1 outcome occurs.',
      ['Initial stabilizer', '+Z'],
      ['Outcome and new stabilizer', '+1 → +Z (100%)']
    ),
    view(
      'Measure Z on |+⟩',
      'Z anticommutes with X. Each outcome occurs with probability 1/2 and replaces the old stabilizer.',
      ['Initial stabilizer', '+X'],
      ['Outcome and new stabilizer', '+1 → +Z (50%)', '−1 → −Z (50%)']
    )
  ),
  'L31-gottesman-knill-theorem': diagram(
    'Tableau size versus state vector size',
    view(
      '10 qubits',
      'A Clifford circuit on a stabilizer state can track 2n signed Pauli rows. This count excludes scratch space.',
      ['Tableau bits', '20 rows × 21 bits', '420 bits'],
      ['Dense state', '1,024 complex amplitudes']
    ),
    view(
      '30 qubits',
      'The tableau bit count grows quadratically with n. A dense state vector has 2ⁿ entries.',
      ['Tableau bits', '60 rows × 61 bits', '3,660 bits'],
      ['Dense state', '1,073,741,824 complex amplitudes']
    )
  ),
  'L32-magic-states-pauli-based-computation': diagram(
    'Correct a T injection outcome',
    view(
      'Ancilla outcome 0',
      'Start with T|+⟩ on the ancilla. After CNOT from data to ancilla, measure the ancilla in Z. Outcome 0 yields T|ψ⟩.',
      ['Data path', '|ψ⟩', '→', 'Injection', '→', 'T|ψ⟩'],
      ['Correction', 'Identity']
    ),
    view(
      'Ancilla outcome 1',
      'Up to global phase, outcome 1 gives T†|ψ⟩. S = T² supplies the missing phase.',
      ['Data path', '|ψ⟩', '→', 'Injection', '→', 'T†|ψ⟩', '→', 'Apply S', '→', 'T|ψ⟩']
    )
  ),
  'L33-program-ir-routes': diagram(
    'Choose a simulator for the circuit',
    view(
      'H, CNOT, and Z measurement',
      'A Clifford circuit from |0…0⟩ with Pauli measurements fits the stabilizer representation.',
      ['Operations', 'H', '→', 'CNOT', '→', 'Measure Z'],
      ['Suitable representation', 'Stabilizer tableau']
    ),
    view(
      'Insert T after H',
      'A T on |+⟩ can leave the stabilizer family. A small dense state vector can retain its complex amplitudes.',
      ['Operations', 'H', '→', 'T', '→', 'CNOT', '→', 'Measure Z'],
      ['Suitable representation', 'State vector for small systems']
    )
  ),
  'L34-pauli-frame-batched-sampling': diagram(
    'Apply a frame to four Z readouts',
    view(
      'X corrections',
      'X anticommutes with Z. Wherever an X is pending, flip that measurement bit with XOR.',
      ['Raw bits', '0', '1', '1', '0'],
      ['X mask', '1', '0', '1', '0'],
      ['Corrected bits', '1', '1', '0', '0']
    ),
    view(
      'Z corrections',
      'Z commutes with the Z measurement. Pending Z corrections leave these readout bits unchanged.',
      ['Raw bits', '0', '1', '1', '0'],
      ['Bit-flip mask', '0', '0', '0', '0'],
      ['Corrected bits', '0', '1', '1', '0']
    )
  ),
  'L36-ket-networks-path-sums': diagram(
    'Add paths before squaring',
    view(
      'Input 0, output 0 through HH',
      'Fix the middle bit to 0 or 1. The two path amplitudes add to 1.',
      ['Path contributions', 'Via 0: +½', 'Via 1: +½'],
      ['Sum amplitude', '1'],
      ['Probability', '1']
    ),
    view(
      'Input 0, output 1 through HH',
      'The same two slices now have opposite signs. Their amplitudes cancel before taking the squared magnitude.',
      ['Path contributions', 'Via 0: +½', 'Via 1: −½'],
      ['Sum amplitude', '0'],
      ['Probability', '0']
    )
  ),
  'L37-many-body-hamiltonians-models': diagram(
    'Read the energy of an Ising chain',
    view(
      'All spins aligned',
      'For H = −Z₁Z₂ − Z₂Z₃, every aligned bond contributes −1.',
      ['Spins', '↑', '↑', '↑'],
      ['Bond energies', '−1', '−1'],
      ['Total', '−2']
    ),
    view(
      'Flip the middle spin',
      'Both bonds now cross a domain wall. Each contributes +1.',
      ['Spins', '↑', '↓', '↑'],
      ['Bond energies', '+1', '+1'],
      ['Total', '+2']
    )
  ),
  'L38-symmetry-as-operator-commutation': diagram(
    'Does H keep the symmetry sectors separate?',
    view(
      'H = Z, symmetry Z',
      'H acts within each Z eigenspace. The two sectors form separate blocks.',
      ['Positive sector', '|0⟩', '→', '+|0⟩'],
      ['Negative sector', '|1⟩', '→', '−|1⟩']
    ),
    view(
      'H = X, candidate symmetry Z',
      'H sends each Z eigenvector to the other sector, so it fails the commutation condition.',
      ['Positive sector', '|0⟩', '→', '|1⟩'],
      ['Negative sector', '|1⟩', '→', '|0⟩']
    )
  ),
  'L39-clifford-symmetries-paper-tour': diagram(
    'Which coefficients allow a SWAP symmetry?',
    view(
      'Equal coefficients',
      'SWAP exchanges the Pauli terms. Equal coefficients make the whole Hamiltonian invariant.',
      ['Conjugate H', 'ZI + IZ', '→', 'IZ + ZI'],
      ['SWAP symmetry', 'Yes']
    ),
    view(
      'Unequal coefficients',
      'The supports still exchange, but swapping mismatched weights changes the Hamiltonian.',
      ['Conjugate H', '2ZI + IZ', '→', '2IZ + ZI'],
      ['SWAP symmetry', 'No']
    )
  ),
  'L40-colored-graphs-interaction-graphs': diagram(
    'One support, two interaction labels',
    view(
      'ZZ interaction',
      'The edge joins sites 1 and 2. Its local labels say what acts at each site.',
      ['Edge', 'Site 1 · Z', '↔', 'Site 2 · Z'],
      ['Term weight', 'J']
    ),
    view(
      'XX interaction on the same sites',
      'The endpoints are the same. Distinguishing the X and Z labels preserves information lost by an uncolored edge.',
      ['Edge', 'Site 1 · X', '↔', 'Site 2 · X'],
      ['Term weight', 'J']
    )
  ),
  'L42-term-fixers-exact-kernel': diagram(
    'Pass both commutation constraints',
    view(
      'Candidate XX',
      'A term fixer must commute with each term separately. XX passes both checks for H = XX + ZZ.',
      ['With XX', '0 local sign flips'],
      ['With ZZ', '2 local sign flips'],
      ['Term fixer?', 'Yes']
    ),
    view(
      'Candidate XI',
      'One local sign flip against ZZ is enough to fail the intersection of constraints.',
      ['With XX', '0 local sign flips'],
      ['With ZZ', '1 local sign flip'],
      ['Term fixer?', 'No']
    )
  ),
  'L43-commuting-paulis-sector-resolution': diagram(
    'Rotate the Bell stabilizers to Z',
    view(
      'Follow XX',
      'Conjugate first by CNOT, then by H on the control. The first measurement bit now determines the XX eigenvalue.',
      ['Operator after each gate', 'XX', '→', 'XI', '→', 'ZI']
    ),
    view(
      'Follow ZZ',
      'The same circuit maps ZZ to Z on the second qubit. The two output bits specify the joint sector.',
      ['Operator after each gate', 'ZZ', '→', 'IZ', '→', 'IZ']
    )
  ),
  'L44-block-diagonalization-pipeline': diagram(
    'Count symmetry blocks',
    view(
      'One independent Pauli symmetry',
      'On five qubits, one independent Pauli symmetry splits the 32-dimensional space into two equal sectors.',
      ['Reduction', '32 basis states', '→', '2 sectors × 16']
    ),
    view(
      'Two independent commuting Pauli symmetries',
      'Each added independent commuting Pauli symmetry supplies one more binary sector label.',
      ['Reduction', '32 basis states', '→', '4 sectors × 8'],
      ['Sector labels', '++', '+−', '−+', '−−']
    )
  ),
  'L46-lanczos-three-term-recurrence': diagram(
    'Follow the first two Lanczos steps',
    view(
      'Step 1',
      'For A = diag(2, 4), start with q₁ = (1, 1)/√2. Subtract the component along q₁, then normalize the residual.',
      ['Current vector', 'q₁ = (1, 1)/√2'],
      ['Coefficients', 'α₁ = 3', 'β₁ = 1'],
      ['Next direction', 'q₂ = (−1, 1)/√2']
    ),
    view(
      'Step 2',
      'Subtract the parts along q₁ and q₂. A zero residual means the two-vector space is invariant and the recurrence stops.',
      ['Current vector', 'q₂ = (−1, 1)/√2'],
      ['Coefficients', 'α₂ = 3', 'β₂ = 0'],
      ['Projected matrix rows', '[3, 1]', '[1, 3]']
    )
  )
};
