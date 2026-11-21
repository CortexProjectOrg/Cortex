import { diagram, view } from './DiagramWidget';

export const COMPUTING_DIAGRAMS = {
  'L86-conditioning-linear-solves': diagram(
    'Compare residual and solution error',
    view(
      'Well-conditioned system',
      'For the identity matrix, the two error norms agree.',
      ['Matrix diagonal', '1', '1'],
      ['Solution error norm', '1'],
      ['Residual norm', '1']
    ),
    view(
      'Ill-conditioned system',
      'The second coordinate can be wrong by one while its equation nearly holds.',
      ['Matrix diagonal', '1', '10⁻⁶'],
      ['Solution error norm', '1'],
      ['Residual norm', '10⁻⁶']
    )
  ),
  'L87-least-squares-qr-svd': diagram(
    'Check the residual against the model',
    view(
      'Intercept column',
      'The residual is perpendicular to the constant direction.',
      ['Residual', '(1/3, −2/3, 1/3)'],
      ['Dot with (1, 1, 1)', '1/3 − 2/3 + 1/3 = 0']
    ),
    view(
      'Slope column',
      'The residual is also perpendicular to the slope direction, so it is orthogonal to the full model space.',
      ['Residual', '(1/3, −2/3, 1/3)'],
      ['Dot with (−1, 0, 1)', '−1/3 + 1/3 = 0']
    )
  ),
  'L88-dft-fast-fourier-transform': diagram(
    'Split and merge four samples',
    view(
      'Input (1, 0, −1, 0)',
      'Only the even-indexed samples contribute, so the equal coefficients at k = 1 and 3 are real.',
      ['Even samples and DFT', '(1, −1)', '→', '(0, 2)'],
      ['Odd samples and DFT', '(0, 0)', '→', '(0, 0)'],
      ['Full DFT', '(0, 2, 0, 2)']
    ),
    view(
      'Shift input by one index',
      'Now the odd transform carries the signal. Its root-of-unity factors give opposite imaginary signs.',
      ['Even samples and DFT', '(0, 0)', '→', '(0, 0)'],
      ['Odd samples and DFT', '(1, −1)', '→', '(0, 2)'],
      ['Full DFT', '(0, −2i, 0, 2i)']
    )
  ),
  'L89-conditional-probability-bayes': diagram(
    'Update the urn probability',
    view(
      'One red draw',
      'The weights are joint probabilities before normalization.',
      ['Prior odds A : B', '1 : 4'],
      ['Likelihood ratio', '3 : 1'],
      ['Posterior probability of A', '3/7']
    ),
    view(
      'Two red draws with replacement',
      'Given the urn, the draws are independent, so the likelihood ratio is squared.',
      ['Prior odds A : B', '1 : 4'],
      ['Likelihood ratio', '9 : 1'],
      ['Posterior probability of A', '9/13']
    )
  ),
  'L90-monte-carlo-variance': diagram(
    'Compare shared and independent draws',
    view(
      'Independent bits',
      'The covariance is zero, so the variances add for either sum or difference.',
      ['Variance of X + Y', '1/2'],
      ['Variance of X − Y', '1/2']
    ),
    view(
      'Same bit twice',
      'The covariance adds to the sum variance and cancels the difference variance.',
      ['Variance of X + Y', '1'],
      ['Variance of X − Y', '0']
    )
  ),
  'L92-markov-chains-mixing-mcmc': diagram(
    'Track distance to stationarity',
    view(
      'Start in state 0',
      'All the initial weight is on state 0. At equilibrium, state 1 has a third of the weight.',
      ['P(state 1)', '0'],
      ['Total variation distance', '1/3']
    ),
    view(
      'After one update',
      'Move from 0 to 1 only if the switch is proposed and accepted.',
      ['P(state 1)', '0.10'],
      ['Total variation distance', '0.7/3']
    ),
    view(
      'After ten updates',
      'The marginal law is within 0.01 of equilibrium. Conditional transitions still use the same matrix.',
      ['P(state 1)', '≈ 0.324'],
      ['Total variation distance', '≈ 0.0094']
    )
  ),
  'L93-hamiltonian-time-evolution': diagram(
    'Read the phase in a second basis',
    view(
      'At the start',
      'The positive relative sign is visible in the X basis.',
      ['State', '( |0⟩ + |1⟩ ) / √2'],
      ['P(Z = +1)', '50%'],
      ['P(X = +1)', '100%']
    ),
    view(
      'After half a period',
      'The energy gap has changed the relative phase by π.',
      ['State up to phase', '( |0⟩ − |1⟩ ) / √2'],
      ['P(Z = +1)', '50%'],
      ['P(X = +1)', '0%']
    )
  ),
  'L94-spin-measurement-rotations': diagram(
    'Tilt a spin analyzer',
    view(
      'Measure along z',
      'The prepared plus-z state is an eigenstate of this analyzer.',
      ['Angle from z', '0°'],
      ['Positive outcome', '100%']
    ),
    view(
      'Measure along x',
      'The analyzer axis is perpendicular to the prepared spin direction.',
      ['Angle from z', '90°'],
      ['Positive outcome', '50%']
    ),
    view(
      'Measure sixty degrees from z',
      'The dot product with the prepared axis is 1/2.',
      ['Angle from z', '60°'],
      ['Positive outcome', '75%']
    )
  ),
  'L95-quantum-thermal-states': diagram(
    'Count the levels at fixed temperature',
    view(
      'One excited state',
      'At βΔ = log 3 each excited state has one third of the ground-state weight.',
      ['Weights at 0 and Δ', '1', '1/3'],
      ['P(energy Δ)', '1/4']
    ),
    view(
      'Three degenerate excited states',
      'All three excited states contribute to the same measured energy.',
      ['Weights at 0 and Δ', '1', '3 × 1/3'],
      ['P(energy Δ)', '1/2']
    )
  ),
  'L97-cost-models-asymptotics': diagram(
    'Count bits before counting iterations',
    view(
      'Ten-bit input',
      'Halving removes one bit at each step, while decrementing visits every smaller nonnegative integer.',
      ['Input', '1023'],
      ['Decrement steps', '1023'],
      ['Halving steps', '10']
    ),
    view(
      'Twenty-bit input',
      'Doubling the input length almost squares the larger loop count in this example.',
      ['Input', '1,048,575'],
      ['Decrement steps', '1,048,575'],
      ['Halving steps', '20']
    )
  ),
  'L98-np-completeness-reductions': diagram(
    'Force the output of an AND gate',
    view(
      'Both inputs true',
      'The forward implication forces z to be true.',
      ['Input (x, y)', '(1, 1)'],
      ['Active constraint', '¬x ∨ ¬y ∨ z'],
      ['Forced wire', 'z = 1']
    ),
    view(
      'Second input false',
      'The reverse implication excludes z = 1.',
      ['Input (x, y)', '(1, 0)'],
      ['Active constraint', 'y ∨ ¬z'],
      ['Forced wire', 'z = 0']
    )
  ),
  'L100-space-complexity-reachability': diagram(
    'Expand one recursive level',
    view(
      'Split the path at 2',
      'To certify four edges, check the two shorter paths in sequence.',
      ['Length bound 4', 'R₂(0, 4)'],
      ['Subcalls at bound 2', 'R₁(0, 2)', '→', 'R₁(2, 4)']
    ),
    view(
      'Check the first half',
      'Midpoint 1 reduces this half to two adjacency tests.',
      ['Length bound 2', 'R₁(0, 2)'],
      ['Subcalls at bound 1', 'R₀(0, 1)', '→', 'R₀(1, 2)']
    )
  ),
  'L101-quantum-queries-phase-kickback': diagram(
    'Choose a phase-sensitive oracle target',
    view(
      'Target |−⟩',
      'The X eigenvalue is −1. A true predicate negates the corresponding input amplitude.',
      ['If f(x) = 0', 'Phase +1'],
      ['If f(x) = 1', 'Phase −1']
    ),
    view(
      'Target |+⟩',
      'The X eigenvalue is +1, so the target supplies no phase contrast.',
      ['If f(x) = 0', 'Phase +1'],
      ['If f(x) = 1', 'Phase +1']
    )
  ),
  'L103-quantum-phase-estimation': diagram(
    'Decode an exact grid phase',
    view(
      'Phase 3/8',
      'Eight grid points resolve the phase exactly because 8 × 3/8 is an integer.',
      ['Phase', '3/8'],
      ['Index', '3'],
      ['Output bits', '011']
    ),
    view(
      'Phase 7/8',
      'The same three-qubit grid includes the phase one step below a full turn.',
      ['Phase', '7/8'],
      ['Index', '7'],
      ['Output bits', '111']
    )
  ),
  'L104-quantum-order-finding': diagram(
    'Verify the proposed order',
    view(
      'Phase 1/6',
      'Check the denominator and its proper divisors. The even order gives two nontrivial GCDs.',
      ['Candidate order', '6'],
      ['2 to that power modulo 21', '1'],
      ['Factors', '3', '7']
    ),
    view(
      'Phase 2/6',
      'The fraction reduces, and its denominator fails the modular check.',
      ['Candidate order', '3'],
      ['2 to that power modulo 21', '8'],
      ['Action', 'Use another phase sample']
    )
  ),
  'L105-bqp-circuit-complexity': diagram(
    'Account for the search input length',
    view(
      'Twelve address bits',
      'In the one-mark oracle model, compare the scale of the classical and quantum query counts.',
      ['Search space', '2¹²'],
      ['Classical scale', '2¹²'],
      ['Grover scale', '2⁶']
    ),
    view(
      'Twenty-four address bits',
      'Both counts grow exponentially with input length, with different exponents.',
      ['Search space', '2²⁴'],
      ['Classical scale', '2²⁴'],
      ['Grover scale', '2¹²']
    )
  ),
  'L106-qma-local-hamiltonian': diagram(
    'Test two witnesses one term at a time',
    view(
      'Witness |00⟩',
      'Both terms have eigenvalue zero, so either local test accepts.',
      ['Energy from H₁ and H₂', '0', '0'],
      ['Acceptance', '100%']
    ),
    view(
      'Bell witness',
      'Only the population in |11⟩ contributes to H₁. Both components have even parity.',
      ['Energy from H₁ and H₂', '1/2', '0'],
      ['Acceptance', '75%']
    )
  ),
  'L107-strong-weak-simulation': diagram(
    'Ask two questions of the same circuit',
    view(
      'Generate a sample',
      'Drawing one random input and evaluating the formula exactly samples its output distribution.',
      ['Input and operation', 'Uniform x', '→', 'Evaluate f(x)'],
      ['Output', 'One bit']
    ),
    view(
      'Return an exact probability',
      'An exact probability with denominator 2ⁿ determines the full number of satisfying assignments.',
      ['Output', 'Count(f) / 2ⁿ'],
      ['Recover the count', 'Multiply by 2ⁿ']
    )
  )
};
