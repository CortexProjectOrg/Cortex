// @vitest-environment jsdom
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { LectureWidget } from '../src/components/reader/LectureWidget';

afterEach(cleanup);
function open(id: string) {
  const view = render(<LectureWidget lectureId={id} />);
  fireEvent.click(screen.getByText(/^Explore:/));
  return view;
}
function value(label: string) {
  return screen.getByText(label, { selector: 'dt' }).nextElementSibling?.textContent;
}

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
  open('L04-vector-spaces-finite-fields');
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
  open('L52-bayesian-adaptive-allocation');
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
