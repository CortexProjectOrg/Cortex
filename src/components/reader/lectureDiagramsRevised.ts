import { diagram, view, type DiagramSpec } from './DiagramWidget';

export const REVISED_LECTURE_DIAGRAMS: Partial<Record<string, DiagramSpec>> = {
  'L13-density-matrices-mixed-states': diagram(
    'Trace out the second qubit',
    view(
      'Bell state',
      'The cross terms vanish in the partial trace because the second-wire basis vectors are orthogonal.',
      ['Joint coherence', '|00⟩⟨11| / 2', '|11⟩⟨00| / 2'],
      ['First-wire state', 'I / 2']
    ),
    view(
      'Classical mixture',
      'The remaining diagonal terms agree with the Bell state reduction.',
      ['Joint probabilities', '00: 1/2', '11: 1/2'],
      ['First-wire state', 'I / 2']
    )
  ),
  'L40-colored-graphs-interaction-graphs': diagram(
    'Anticommutation graph of the six terms',
    view(
      'Three-spin ring',
      'Each edge joins two Pauli terms with odd unlike-axis overlap. Colors identify the two coefficient classes.',
      ['Weight 2.0', 'X₁X₂', 'X₂X₃', 'X₃X₁'],
      ['Weight 0.5', 'Z₁', 'Z₂', 'Z₃'],
      ['Neighbors of X₁X₂', 'Z₁', 'Z₂'],
      ['Neighbors of X₂X₃', 'Z₂', 'Z₃'],
      ['Neighbors of X₃X₁', 'Z₃', 'Z₁']
    )
  ),
  'L44-block-diagonalization-pipeline': diagram(
    'Compare the two spin-flip sectors',
    view(
      'Positive sector',
      'The same assignment minimizes the three remaining bond terms in both sectors.',
      ['Conjugated sector bit', 'Z₁ = +1'],
      ['Minimizing assignment', 'z₂ = −1', 'z₃ = +1', 'z₄ = −1'],
      ['Minimum energy', '−2']
    ),
    view(
      'Negative sector',
      'The negative sector contains the global ground state.',
      ['Conjugated sector bit', 'Z₁ = −1'],
      ['Minimizing assignment', 'z₂ = −1', 'z₃ = +1', 'z₄ = −1'],
      ['Minimum energy', '−4']
    )
  ),
  'L52-bayesian-adaptive-allocation': diagram(
    'Compare allocations for two cliques',
    view(
      'Equal allocation',
      'The fixed-design variance adds the two weighted per-shot variances divided by their respective shot counts.',
      ['Shots', 'A: 500', 'B: 500'],
      ['Variance', '0.0020398']
    ),
    view(
      'Pilot-constrained allocation',
      'The remaining 500 shots go mostly to B, reducing the fixed-design variance by about 26%.',
      ['Shots', 'A: 310', 'B: 690'],
      ['Variance', '0.0015135']
    )
  ),
  'L59-batched-cuda-covariance-offload': diagram(
    'Reduce conditional covariance across draws',
    view(
      'Two posterior draws',
      'Integrate the three independent entries of the symmetric 2 × 2 covariance matrix.',
      ['Upper triangle', '(1,1)', '(1,2)', '(2,2)'],
      ['Bell-state shot covariance', '1', '1', '1'],
      ['Product-state shot covariance', '0', '0', '0'],
      ['Mean conditional covariance', '1/2', '1/2', '1/2'],
      ['Covariance of conditional means', '1/4', '1/4', '1/4']
    )
  ),
  'L80-surface-code-repeated-syndromes': diagram(
    'Pair detection events in space and time',
    view('Bulk data fault', 'Adjacent checks change in one round.', [
      'Endpoints',
      '(check j, round t)',
      '(check j+1, round t)'
    ]),
    view('Check readout fault', 'The same check changes when the readout flips and again when it recovers.', [
      'Endpoints',
      '(check j, round t)',
      '(check j, round t+1)'
    ]),
    view('Boundary fault', 'A compatible boundary supplies the unobserved endpoint.', [
      'Endpoints',
      '(check j, round t)',
      'Boundary'
    ])
  ),
  'L84-noise-spectroscopy-filter-functions': diagram(
    'Filter response of an even alternating pulse train',
    view(
      'Static offset',
      'Equal intervals of each sign cancel a constant offset.',
      ['Frequency', 'ω = 0'],
      ['Normalized response |Y| / T', '0']
    ),
    view(
      'First passband center',
      'Each term of the geometric sum adds in phase.',
      ['Frequency', 'ωτ = π'],
      ['Normalized response |Y| / T', '2/π']
    ),
    view(
      'First zero above the center for four intervals',
      'The four geometric-sum factors cancel at this frequency.',
      ['Frequency', 'ωτ = 3π/2'],
      ['Normalized response |Y| / T', '0']
    )
  ),
  'L89-conditional-probability-bayes': diagram(
    'Update the urn probability',
    view(
      'One red draw',
      'Multiply prior odds by the likelihood ratio and normalize.',
      ['Prior odds A : B', '1 : 4'],
      ['Likelihood ratio', '3 : 1'],
      ['Posterior odds A : B', '3 : 4'],
      ['Posterior probability of A', '3/7']
    ),
    view(
      'Two red draws',
      'The draws are independent when the urn is given and the ball is replaced.',
      ['Prior odds A : B', '1 : 4'],
      ['Likelihood ratio', '9 : 1'],
      ['Posterior probability of A', '9/13']
    )
  ),
  'L104-quantum-order-finding': diagram(
    'Verify the proposed modular order',
    view(
      'Candidate denominator 6',
      'Nine control qubits give 512 possible readouts. The sample 85/512 has convergent 1/6.',
      ['Control register', '9 qubits', '512 basis states'],
      ['Modular check', '2⁶ mod 21 = 1'],
      ['Factors', '3', '7']
    ),
    view(
      'Reduced denominator 3',
      'A numerator sharing a factor with the true order can hide part of that order.',
      ['Candidate', '2/6 = 1/3'],
      ['Modular check', '2³ mod 21 = 8'],
      ['Action', 'Take another phase sample']
    )
  )
};
