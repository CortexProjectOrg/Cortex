import { diagram, view } from './DiagramWidget';

export const FOUNDATION_DIAGRAMS = {
  'L04-vector-spaces-finite-fields': diagram(
    'Span over two fields',
    view(
      'Over F₂',
      'Every point is a pair of residues. One independent vector gives two combinations.',
      ['0 · (1, 1)', '(0, 0)'],
      ['1 · (1, 1)', '(1, 1)']
    ),
    view(
      'Over F₃',
      'The same basis vector gives three combinations because its coefficient has three choices.',
      ['0 · (1, 1)', '(0, 0)'],
      ['1 · (1, 1)', '(1, 1)'],
      ['2 · (1, 1)', '(2, 2)']
    )
  ),
  'L06-bilinear-symplectic-forms': diagram(
    'Signed area and orientation',
    view(
      'Counterclockwise order',
      'In the real plane, B(u, v) = uₓvᵧ − uᵧvₓ measures signed area.',
      ['Ordered vectors', 'u = (2, 0)', 'v = (0, 1)'],
      ['Signed area', '+2']
    ),
    view(
      'Swap the vectors',
      'The area keeps its magnitude. Reversing the order reverses the sign.',
      ['Ordered vectors', 'u = (0, 1)', 'v = (2, 0)'],
      ['Signed area', '−2']
    ),
    view(
      'Parallel vectors',
      'A pair on one line spans no area. In particular, B(u, u) = 0.',
      ['Ordered vectors', 'u = (2, 0)', 'v = (1, 0)'],
      ['Signed area', '0']
    )
  ),
  'L07-symplectic-group-sp2n': diagram(
    'Does the map preserve the pairing?',
    view(
      'Shear over F₅',
      'In dimension two, a determinant of 1 preserves the standard alternating form.',
      ['Image of the basis', 'e₁ ↦ (1, 0)', 'e₂ ↦ (2, 1)'],
      ['Basis pairing', '1', '→', '1']
    ),
    view(
      'Stretch over F₅',
      'The stretch is invertible, but it multiplies the pairing by 2.',
      ['Image of the basis', 'e₁ ↦ (2, 0)', 'e₂ ↦ (0, 1)'],
      ['Basis pairing', '1', '→', '2']
    )
  ),
  'L08-eigenvalues-without-diagonalization': diagram(
    'Same eigenvalues, different eigenspaces',
    view(
      'Identity',
      'Every vector is fixed. The eigenspace for 1 fills the plane.',
      ['Matrix rows', '[1, 0]', '[0, 1]'],
      ['Invariants', 'Trace 2', 'Determinant 1', 'Eigenvalues 1, 1'],
      ['Eigenspace dimension', '2']
    ),
    view(
      'Shear',
      'The shear fixes only vectors on the x-axis. One eigenvector direction is insufficient for diagonalization.',
      ['Matrix rows', '[1, 1]', '[0, 1]'],
      ['Invariants', 'Trace 2', 'Determinant 1', 'Eigenvalues 1, 1'],
      ['Eigenspace dimension', '1']
    )
  ),
  'L14-circuit-model-universal-sets': diagram(
    'Relative phase from T gates',
    view(
      'One T gate',
      'The relative phase between |0⟩ and |1⟩ changes by π/4.',
      ['Circuit', '|+⟩', '→', 'T'],
      ['Output amplitudes', 'a₀ = 1/√2', 'a₁ = eⁱπ/⁴/√2']
    ),
    view(
      'Two T gates',
      'Phases add. Two T gates give the Clifford phase gate S.',
      ['Circuit', '|+⟩', '→', 'T', '→', 'T'],
      ['Output amplitudes', 'a₀ = 1/√2', 'a₁ = i/√2']
    )
  ),
  'L15-pauli-matrices-algebra': diagram(
    'Pauli products depend on order',
    view(
      'X times Y',
      'The order X, Y, Z gives a positive i factor in XY = iZ.',
      ['Product', 'X · Y', '→', 'iZ'],
      ['Diagonal entries', '+i', '−i']
    ),
    view(
      'Y times X',
      'Swapping X and Y negates the product.',
      ['Product', 'Y · X', '→', '−iZ'],
      ['Diagonal entries', '−i', '+i']
    )
  ),
  'L16-n-qubit-pauli-strings': diagram(
    'Two sites, two local actions',
    view(
      'Act on |00⟩',
      'X flips the first bit. Z leaves the second bit in place and acts by +1 on |0⟩.',
      ['Site 1 · X', '|0⟩', '→', '|1⟩'],
      ['Site 2 · Z', '|0⟩', '→', '|0⟩'],
      ['XZ |00⟩', '|10⟩']
    ),
    view(
      'Act on |01⟩',
      'The same string contributes a minus sign when the second bit is 1.',
      ['Site 1 · X', '|0⟩', '→', '|1⟩'],
      ['Site 2 · Z', '|1⟩', '→', '−|1⟩'],
      ['XZ |01⟩', '−|11⟩']
    )
  ),
  'L17-binary-symplectic-encoding': diagram(
    'Encode a Pauli string',
    view(
      'String XZ',
      'The x and z bits mark which sites have each factor in the binary representation.',
      ['Pauli string', 'X', 'Z'],
      ['x bits', '1', '0'],
      ['z bits', '0', '1']
    ),
    view(
      'String YI',
      'Y has both bits set. The bit string represents the operator up to phase.',
      ['Pauli string', 'Y', 'I'],
      ['x bits', '1', '0'],
      ['z bits', '1', '0']
    )
  ),
  'L19-acquired-phases-hostens-moduli': diagram(
    'Track the phase site by site',
    view(
      'XX · YY',
      'Both sites contribute i. The full product carries i² = −1.',
      ['Site 1', 'XY', '→', 'iZ'],
      ['Site 2', 'XY', '→', 'iZ'],
      ['Product', '−ZZ']
    ),
    view(
      'XY · YX',
      'The two local phases are i and −i. Their product is +1.',
      ['Site 1', 'XY', '→', 'iZ'],
      ['Site 2', 'YX', '→', '−iZ'],
      ['Product', '+ZZ']
    )
  ),
  'L20-pauli-sums-observables-hamiltonians': diagram(
    'Read energy from a Pauli sum',
    view(
      'State |0⟩',
      'For H = 0.5I + 1.5Z, the identity shifts both energies by 0.5.',
      ['Term contributions', '0.5 from I', '+1.5 from Z'],
      ['Energy', '2']
    ),
    view(
      'State |1⟩',
      'The eigenvalue of Z changes sign, while the identity contribution stays put.',
      ['Term contributions', '0.5 from I', '−1.5 from Z'],
      ['Energy', '−1']
    )
  ),
  'L21-clifford-group-definition': diagram(
    'Conjugate X by a gate',
    view(
      'Hadamard',
      'Hadamard permutes Pauli operators under conjugation. In particular, it exchanges X and Z.',
      ['Conjugation', 'X', '→', 'HXH† = Z']
    ),
    view('T gate', 'The output is a sum of two Paulis. This single example rules out T as a Clifford gate.', [
      'Conjugation',
      'X',
      '→',
      'TXT† = (X + Y)/√2'
    ])
  ),
  'L22-standard-generators-conjugation': diagram(
    'Follow the generator through the gate',
    view(
      'S on one qubit',
      'S rotates X into Y and leaves Z fixed.',
      ['Conjugate X', 'X', '→', 'Y'],
      ['Conjugate Z', 'Z', '→', 'Z']
    ),
    view(
      'CNOT',
      'Under conjugation, X on the control spreads to the target. Z on the target spreads to the control.',
      ['Control X', 'XI', '→', 'XX'],
      ['Target Z', 'IZ', '→', 'ZZ']
    )
  ),
  'L23-symplectic-clifford-isomorphism': diagram(
    'Same binary map, different sign',
    view(
      'H',
      'The binary map swaps the x and z coordinates.',
      ['X under conjugation', 'X', '→', '+Z'],
      ['Z under conjugation', 'Z', '→', '+X'],
      ['Binary action', '(x, z) ↦ (z, x)']
    ),
    view(
      'ZH',
      'The added Z flips one conjugation sign. The binary map alone cannot record that sign.',
      ['X under conjugation', 'X', '→', '+Z'],
      ['Z under conjugation', 'Z', '→', '−X'],
      ['Binary action', '(x, z) ↦ (z, x)']
    )
  ),
  'L24-symplectic-transvections': diagram(
    'A shear and its inverse',
    view(
      'Forward transvection',
      'Over F₅, the transvection adds twice the second coordinate to the first.',
      ['T₂(x, y) = (x + 2y, y)', '(1, 2)', '→', '(0, 2)'],
      ['Fixed direction', 'All (x, 0)']
    ),
    view(
      'Inverse transvection',
      'Adding 3y undoes adding 2y because 2 + 3 = 0 in F₅.',
      ['T₃(x, y) = (x + 3y, y)', '(0, 2)', '→', '(1, 2)'],
      ['Fixed direction', 'All (x, 0)']
    )
  )
};
