// @vitest-environment jsdom
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { LectureWidget, LECTURE_WIDGETS } from '../src/components/reader/LectureWidget';
import { LECTURE_DIAGRAMS } from '../src/components/reader/lectureDiagrams';
import { ALL_LECTURES } from '../src/lib/curriculum';
import { lectureVisualPlacements } from '../src/lib/lectureVisualPlacements';

afterEach(cleanup);
function open(id: string, summary: string | RegExp = /^Explore:/) {
  const view = render(<LectureWidget lectureId={id} />);
  fireEvent.click(screen.getByText(summary));
  return view;
}
function value(label: string) {
  return screen.getByText(label, { selector: 'dt' }).nextElementSibling?.textContent;
}

it('preserves a small result through rationalization after rounded subtraction loses it', () => {
  open('L85-floating-point-cancellation');
  expect(value('Rounded 1 + x')).toBe('1.000');
  expect(value('Direct result')).toBe('0');
  expect(value('Rationalized result')).toBe('5.000e-7');
  fireEvent.change(screen.getByRole('slider', { name: 'Small input exponent' }), { target: { value: '2' } });
  expect(value('Direct result')).toBe('5.000e-3');
});

it('uses the union bound to raise the independent-draw budget for simultaneous estimates', () => {
  open('L91-concentration-sample-complexity');
  expect(value('Sufficient draws per estimate')).toBe('738');
  fireEvent.change(screen.getByRole('slider', { name: 'Simultaneous estimates' }), {
    target: { value: '4' }
  });
  expect(value('Sufficient draws per estimate')).toBe('1016');
});

it('contrasts the avoided crossing with a path that closes its gap', () => {
  open('L96-adiabatic-evolution-gaps');
  expect(value('Energy gap / E')).toBe('1.414');
  fireEvent.change(screen.getByRole('combobox', { name: 'Hamiltonian path' }), { target: { value: '1' } });
  expect(value('Energy gap / E')).toBe('0.000');
});

it('evaluates the independence-based majority and one-sided amplification guarantees', () => {
  open('L99-randomized-complexity-amplification');
  expect(value('Certifies failure below 1%')).toBe('No');
  fireEvent.change(screen.getByRole('slider', { name: 'Independent runs' }), { target: { value: '83' } });
  expect(value('Certifies failure below 1%')).toBe('Yes');
  fireEvent.change(screen.getByRole('combobox', { name: 'Guarantee' }), { target: { value: '1' } });
  fireEvent.change(screen.getByRole('slider', { name: 'Independent runs' }), { target: { value: '7' } });
  expect(value('Failure probability bound')).toBe('0.781%');
});

it('shows the first Grover peak and the overshoot on a second call', () => {
  open('L102-grover-search-query-bounds');
  expect(value('Probability of any marked label')).toBe('100.00%');
  fireEvent.change(screen.getByRole('slider', { name: 'Oracle calls' }), { target: { value: '2' } });
  expect(value('Probability of any marked label')).toBe('25.00%');
});

it('budgets quadratic time dependence for a noncommuting product formula', () => {
  open('L108-hamiltonian-simulation-cost');
  expect(value('Sufficient steps')).toBe('100');
  fireEvent.change(screen.getByRole('slider', { name: 'Evolution time' }), { target: { value: '2' } });
  expect(value('Sufficient steps')).toBe('400');
  fireEvent.change(screen.getByRole('combobox', { name: 'Hamiltonian terms' }), { target: { value: '1' } });
  expect(value('Sufficient steps')).toBe('1');
});

it('assigns one or two visuals to every catalog lecture and renders them through the shared reader panel', () => {
  const { container, rerender } = render(<LectureWidget lectureId="unknown-lecture" />);
  const assigned = new Set([...Object.keys(LECTURE_WIDGETS), ...Object.keys(LECTURE_DIAGRAMS)]);
  expect(assigned).toEqual(new Set(ALL_LECTURES.map(({ id }) => id)));
  for (const { id } of ALL_LECTURES) {
    rerender(<LectureWidget lectureId={id} />);
    const panels = container.querySelectorAll('.lesson-widget');
    expect(panels.length, id).toBeGreaterThanOrEqual(1);
    expect(panels.length, id).toBeLessThanOrEqual(2);
    expect(
      lectureVisualPlacements(id).map(({ kind }) => kind),
      id
    ).toEqual([...(LECTURE_WIDGETS[id] ? ['practice'] : []), ...(LECTURE_DIAGRAMS[id] ? ['diagram'] : [])]);
    for (const panel of panels) {
      expect(panel.hasAttribute('open'), id).toBe(false);
      expect(panel.querySelector('summary')?.textContent, id).toMatch(/^(Explore|Diagram): \S/);
    }
  }
});

it('switches examples and restores the original example when navigating or resetting', () => {
  const { rerender } = open('L60-qudit-algebra-mixed-dimension-registers');
  const select = screen.getByRole('combobox', { name: 'Example' });
  expect(value('Steps to return')).toBe('3');
  fireEvent.change(select, { target: { value: '1' } });
  expect(value('Steps to return')).toBe('2');
  fireEvent.click(screen.getByRole('button', { name: 'Reset example' }));
  expect(value('Steps to return')).toBe('3');
  fireEvent.change(select, { target: { value: '1' } });
  rerender(<LectureWidget lectureId="L61-quantum-channels-kraus" />);
  expect(screen.getByText('Explore: Keep or forget the measurement record').closest('details')?.open).toBe(
    false
  );
  rerender(<LectureWidget lectureId="L60-qudit-algebra-mixed-dimension-registers" />);
  expect(value('Steps to return')).toBe('3');
});

it('shows Euclidean division preserving the GCD and restarts the trace for a new pair', () => {
  open('L72-invariants-termination');
  expect(value('Division equation')).toBe('252 = 2 × 105 + 42');
  fireEvent.change(screen.getByRole('slider', { name: 'Division' }), { target: { value: '3' } });
  expect(value('Status')).toBe('GCD = 21');
  fireEvent.change(screen.getByRole('combobox', { name: 'Starting pair' }), { target: { value: '2' } });
  expect(value('Division equation')).toBe('35 = 2 × 12 + 11');
});

it('reduces the maximum excited population and moves the first Rabi peak at nonzero detuning', () => {
  open('L74-coherent-drives-rabi-oscillations');
  expect(value('Excited population')).toBe('100.0%');
  expect(value('First peak')).toBe('100.0 ns');
  fireEvent.change(screen.getByRole('slider', { name: 'Detuning Δ/2π' }), { target: { value: '5' } });
  expect(value('Maximum')).toBe('50.0%');
  expect(value('First peak')).toBe('70.7 ns');
});

it('shows the same syndrome for a correctable bit flip and a failing two-flip pattern', () => {
  open('L77-three-qubit-repetition-code');
  const flip = (n: number) => fireEvent.click(screen.getByRole('button', { name: `Flip qubit ${n}` }));
  flip(2);
  expect(value('Syndrome (ZZI, IZZ)')).toBe('11');
  expect(value('After recovery')).toBe('Recovered');
  flip(2);
  flip(1);
  flip(3);
  expect(value('Syndrome (ZZI, IZZ)')).toBe('11');
  expect(value('After recovery')).toBe('Logical X (111)');
});

it('cancels alternating coherent rotations without changing the stochastic comparison', () => {
  open('L83-coherent-stochastic-errors');
  expect(value('Coherent P(1)')).toBe('22.98%');
  expect(value('Stochastic P(1)')).toBe('0.50%');
  fireEvent.change(screen.getByRole('combobox', { name: 'Coherent rotation sign' }), {
    target: { value: '1' }
  });
  expect(value('Coherent P(1)')).toBe('0.00%');
  expect(value('Stochastic P(1)')).toBe('0.50%');
});

it('refocuses a static offset at half time and restores the full phase variance in Ramsey', () => {
  open('L84-noise-spectroscopy-filter-functions', 'Explore: Move the refocusing pulse');
  expect(value('Static-offset variance / Ramsey')).toBe('0.25');
  fireEvent.change(screen.getByRole('slider', { name: 'Pulse position' }), { target: { value: '50' } });
  expect(value('Static-offset variance / Ramsey')).toBe('0.00');
  fireEvent.change(screen.getByRole('combobox', { name: 'Sequence' }), { target: { value: '0' } });
  expect(value('Static-offset variance / Ramsey')).toBe('1.00');
});

it('shows that 3 has an inverse modulo 5 and becomes a zero divisor modulo 6', () => {
  open('L03-finite-fields-gf2-gfp');
  expect(value('Inverse of 3')).toBe('2');
  fireEvent.change(screen.getByRole('combobox', { name: 'Modulus' }), { target: { value: '6' } });
  expect(value('Inverse of 3')).toBe('None');
  expect(value('Distinct products')).toBe('2 of 6');
});

it('recalculates Pauli commutation when a second local minus sign is removed', () => {
  open('L18-symplectic-product-commutation');
  expect(value('Result')).toBe('Commute (+1)');
  fireEvent.change(screen.getByRole('combobox', { name: 'Right string, site 2' }), {
    target: { value: 'I' }
  });
  expect(value('Result')).toBe('Anticommute (−1)');
  fireEvent.change(screen.getByRole('combobox', { name: 'Left string, site 1' }), { target: { value: 'Y' } });
  fireEvent.change(screen.getByRole('combobox', { name: 'Right string, site 1' }), {
    target: { value: 'Y' }
  });
  expect(value('Result')).toBe('Commute (+1)');
});

it('shows the invalid Euler result while retaining the exact positive population', () => {
  open('L63-lindblad-quantum-dynamics');
  fireEvent.change(screen.getByRole('slider', { name: 'Time step Δt' }), { target: { value: '0.6' } });
  expect(value('Euler population')).toBe('-0.200');
  expect(value('Exact population')).toBe('0.301');
  expect(value('Euler state')).toBe('Negative population');
});

it('finds the lower shot-budget error and the singlet energy at the planned examples', () => {
  const { rerender } = open('L49-quantum-observable-estimation-budget');
  expect(value('Standard error of A + B')).toBe('0.2887');
  fireEvent.change(screen.getByRole('slider', { name: 'Shots for estimate A' }), { target: { value: '40' } });
  expect(value('Standard error of A + B')).toBe('0.2739');
  rerender(<LectureWidget lectureId="L68-dmrg-quantum-ground-states" />);
  fireEvent.click(screen.getByText(/^Explore:/));
  expect(value('Trial energy')).toBe('-1.000');
  fireEvent.change(screen.getByRole('slider', { name: 'Mixing angle θ' }), { target: { value: '45' } });
  expect(value('Trial energy')).toBe('-3.000');
  expect(value('Schmidt rank')).toBe('2');
});

it('updates map arrows and classifications when adding an unused target', () => {
  open('L01-sets-maps-proofs');
  fireEvent.change(screen.getByRole('combobox', { name: 'Output of b' }), { target: { value: '1' } });
  fireEvent.change(screen.getByRole('combobox', { name: 'Output of c' }), { target: { value: '2' } });
  expect(value('Injective')).toBe('Yes');
  expect(value('Surjective')).toBe('Yes');
  fireEvent.change(screen.getByRole('combobox', { name: 'Codomain size' }), { target: { value: '4' } });
  expect(value('Injective')).toBe('Yes');
  expect(value('Surjective')).toBe('No');
  expect(screen.getByRole('img').getAttribute('aria-label')).toContain('a to 1, b to 2, c to 3');
});

it('changes the modular orbit and safely resets steps when changing clock size', () => {
  open('L02-groups-modular-arithmetic');
  expect(value('Reachable positions')).toBe('3 of 6');
  fireEvent.change(screen.getByRole('slider', { name: 'Add each step' }), { target: { value: '5' } });
  fireEvent.change(screen.getByRole('slider', { name: 'Steps taken' }), { target: { value: '6' } });
  expect(value('Reachable positions')).toBe('6 of 6');
  expect(value('Current position')).toBe('0');
  fireEvent.change(screen.getByRole('combobox', { name: 'Clock size' }), { target: { value: '5' } });
  expect((screen.getByRole('slider', { name: 'Steps taken' }) as HTMLInputElement).value).toBe('0');
});

it('reaches the vector target by reversing one basis vector', () => {
  open('L04-vector-spaces-finite-fields', 'Explore: Build a vector');
  fireEvent.change(screen.getByRole('slider', { name: 'Coefficient a' }), { target: { value: '-1' } });
  fireEvent.change(screen.getByRole('slider', { name: 'Coefficient b' }), { target: { value: '2' } });
  expect(value('a u + b v')).toBe('(1, 2)');
  expect(value('Target')).toBe('Reached');
});

it('visualizes a nonzero vector in the projection kernel', () => {
  open('L05-linear-maps-matrices');
  fireEvent.change(screen.getByRole('combobox', { name: 'Transformation' }), {
    target: { value: 'project' }
  });
  fireEvent.change(screen.getByRole('slider', { name: 'Input x' }), { target: { value: '0' } });
  expect(value('Output vector')).toBe('(0, 0)');
  expect(value('Kernel dimension')).toBe('1');
  expect(value('Area scale |det T|')).toBe('0');
});

it('builds a phase-sensitive circuit, undoes a gate, and resets both practice and feedback', () => {
  open('L11-unitary-operators-quantum-gates');
  for (const gate of ['H', 'Z', 'H']) fireEvent.click(screen.getByRole('button', { name: `Apply ${gate}` }));
  expect(value('Measure 1')).toBe('100.0%');
  fireEvent.click(screen.getByRole('button', { name: 'Undo gate' }));
  expect(value('Measure 1')).toBe('50.0%');
  fireEvent.click(screen.getByRole('button', { name: '|0⟩', exact: true }));
  expect(screen.getByText('Try again.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '|1⟩', exact: true }));
  expect(screen.getByText('Yes.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Reset exploration' }));
  expect(value('Measure 0')).toBe('100.0%');
  expect(screen.queryByText('Yes.')).toBeNull();
  expect((screen.getByRole('button', { name: 'Undo gate' }) as HTMLButtonElement).disabled).toBe(true);
});

it('bounds circuit length and allows editing after the cap is reached', () => {
  open('L10-one-qubit-states-measurement');
  const button = screen.getByRole('button', { name: 'Apply H' }) as HTMLButtonElement;
  for (let i = 0; i < 8; i++) fireEvent.click(button);
  expect(button.disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Undo gate' }));
  expect(button.disabled).toBe(false);
});

it('accumulates measurement shots, reports uncertainty, and clears samples when probability changes', () => {
  open('L64-quantum-trajectories', 'Explore: Measurement and sampling');
  expect(value('Observed frequency of 1')).toBe('—');
  fireEvent.click(screen.getByRole('button', { name: 'Take 100 shots' }));
  expect(value('Total shots')).toBe('100');
  expect(value('Expected standard error')).toBe('5.0 pp');
  for (let i = 0; i < 3; i++) fireEvent.click(screen.getByRole('button', { name: 'Take 100 shots' }));
  expect(value('Total shots')).toBe('400');
  expect(value('Expected standard error')).toBe('2.5 pp');
  fireEvent.change(screen.getByRole('slider', { name: 'Probability of 1 (%)' }), {
    target: { value: '100' }
  });
  expect(value('Total shots')).toBe('0');
  fireEvent.click(screen.getByRole('button', { name: 'Take 10 shots' }));
  expect(value('Observed frequency of 1')).toBe('100.0%');
});

it('resets state on lecture navigation and keeps the exploration optional', () => {
  const view = open('L10-one-qubit-states-measurement');
  fireEvent.click(screen.getByRole('button', { name: 'Apply X' }));
  view.rerender(<LectureWidget lectureId="L11-unitary-operators-quantum-gates" />);
  expect(screen.getByText(/^Explore:/).closest('details')?.open).toBe(false);
  fireEvent.click(screen.getByText(/^Explore:/));
  expect(value('Measure 0')).toBe('100.0%');
  const check = screen.getByRole('group', { name: 'Starting at |0⟩, what does H → Z → H produce?' });
  expect(
    within(check)
      .getAllByRole('button')
      .every((button) => button.getAttribute('aria-pressed') === 'false')
  ).toBe(true);
});
