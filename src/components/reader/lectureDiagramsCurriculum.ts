import { diagram, view } from './DiagramWidget';

export const CURRICULUM_DIAGRAMS = {
  'L69-quantifiers-counterexamples': diagram(
    'Change who chooses first',
    view(
      'x first',
      'The witness can depend on the first choice, so it can always be larger.',
      ['Choices', 'Choose x freely', '→', 'Choose y = x + 1'],
      ['Claim', 'True']
    ),
    view(
      'y first',
      'The proposed witness has to work for every x. Setting x equal to y defeats it.',
      ['Choices', 'Propose y', '→', 'Test x = y'],
      ['Claim', 'False']
    )
  ),
  'L70-direct-contrapositive-contradiction': diagram(
    'Follow the parity argument',
    view(
      'Contrapositive',
      'To prove that even squares have even roots, start with an odd integer.',
      ['Assume', 'n = 2k + 1'],
      ['Expand', 'n² = 4k² + 4k + 1'],
      ['Conclude', 'n² is odd']
    ),
    view(
      'Contradiction',
      'Both integers being even contradicts the choice of a reduced fraction.',
      ['Assume', '√2 = p/q in lowest terms'],
      ['Infer', 'p and q are even'],
      ['Contradiction', '2 divides gcd(p, q)']
    )
  ),
  'L71-induction-recursive-arguments': diagram(
    'Choose what the inductive step needs',
    view(
      'One preceding case',
      'Adding the next odd number uses only the formula for the previous partial sum.',
      ['Given', '1 + 3 + ⋯ + (2n − 1) = n²'],
      ['Add', '2n + 1'],
      ['Result', '(n + 1)²']
    ),
    view(
      'Any smaller case',
      'The factors of a composite n may be far below n − 1.',
      ['For example', '12 = 3 × 4'],
      ['Apply the hypothesis', '3', '4'],
      ['Result', '12 = 2 × 2 × 3']
    )
  ),
  'L73-quantum-lc-resonator': diagram(
    'Climb the 5 GHz oscillator ladder',
    view(
      'First photon',
      'Each level is labeled by its total energy in units of hf, including the vacuum offset.',
      ['Energy / hf', '½', '→', '3/2'],
      ['Absorbed energy', '1 hf']
    ),
    view(
      'Second photon',
      'The same energy increment takes the oscillator up another level.',
      ['Energy / hf', '3/2', '→', '5/2'],
      ['Absorbed energy', '1 hf']
    )
  ),
  'L75-transmon-anharmonicity-leakage': diagram(
    'Compare the first two spacings',
    view(
      'Harmonic oscillator',
      'An ideal harmonic resonator has identical adjacent transition frequencies.',
      ['0 → 1', '6.075 GHz'],
      ['1 → 2', '6.075 GHz']
    ),
    view(
      'Transmon',
      'The example transmon moves the second transition down by approximately 250 MHz.',
      ['0 → 1', '6.075 GHz'],
      ['1 → 2', '5.825 GHz']
    )
  ),
  'L76-dispersive-readout': diagram(
    'Read the conditional resonance',
    view(
      'Qubit in |0⟩',
      'At positive detuning in the example two-level model, the resonator shifts down.',
      ['Resonance offset', '−10 MHz'],
      ['Distance to the other resonance', '20 MHz']
    ),
    view(
      'Qubit in |1⟩',
      'The other qubit state shifts the resonator up by the same amount.',
      ['Resonance offset', '+10 MHz'],
      ['Distance to the other resonance', '20 MHz']
    )
  ),
  'L78-knill-laflamme-conditions': diagram(
    'Compare error actions on the code',
    view(
      'One bit flip',
      'The corrupted span is orthogonal to the original code space.',
      ['Codewords', '000', '111'],
      ['Apply X₁', '100', '011'],
      ['P X₁ P', '0']
    ),
    view(
      'One phase flip',
      'The signs on the two codewords differ, so the restricted operator is not scalar.',
      ['Codewords', '000', '111'],
      ['Apply Z₁', '+000', '−111'],
      ['P Z₁ P', 'Logical Z']
    )
  ),
  'L79-css-steane-code': diagram(
    'Decode qubit 6 in two check blocks',
    view(
      'Z₆',
      'The sixth column is 110. Only the X checks detect a Z effect.',
      ['X-check block', '110'],
      ['Z-check block', '000']
    ),
    view(
      'Y₆',
      'A Y error has both X and Z support at this location.',
      ['X-check block', '110'],
      ['Z-check block', '110']
    )
  ),
  'L80-surface-code-repeated-syndromes': diagram(
    'Mark changes between rounds',
    view(
      'Persistent sign change',
      'A persistent data fault can explain the first transition. The later minus signs are stable.',
      ['Readouts', '+', '−', '−', '−'],
      ['Detection events', '1', '0', '0']
    ),
    view(
      'Transient sign change',
      'A single faulty readout can explain two events at consecutive time boundaries.',
      ['Readouts', '+', '−', '+', '+'],
      ['Detection events', '1', '1', '0']
    )
  ),
  'L81-relaxation-ramsey-echo': diagram(
    'Compare three pulse sequences',
    view('T₁', 'Fit the excited population as a function of the idle.', [
      'Pulses',
      'π',
      '→',
      'Idle t',
      '→',
      'Read'
    ]),
    view('Ramsey', 'The second pulse converts accumulated phase to a measurable population.', [
      'Pulses',
      'π/2',
      '→',
      'Idle t',
      '→',
      'π/2',
      '→',
      'Read'
    ]),
    view('Hahn echo', 'A middle π pulse reverses phase accumulation from a constant detuning.', [
      'Pulses',
      'π/2',
      '→',
      'Idle t/2',
      '→',
      'π',
      '→',
      'Idle t/2',
      '→',
      'π/2',
      '→',
      'Read'
    ])
  ),
  'L82-randomized-benchmarking': diagram(
    'Undo each Clifford sequence',
    view(
      'Length 2',
      'Clifford composition closes, so the full inverse is also a Clifford.',
      ['Time order', 'C₁', '→', 'C₂', '→', '(C₂C₁)⁻¹'],
      ['Ideal effect', 'Identity']
    ),
    view(
      'Length 3',
      'Estimate survival over many sequences of this length with different draws of the gates.',
      ['Time order', 'C₁', '→', 'C₂', '→', 'C₃', '→', '(C₃C₂C₁)⁻¹'],
      ['Ideal effect', 'Identity']
    )
  )
};
