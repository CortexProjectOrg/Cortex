// @vitest-environment jsdom
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { ReactNode } from 'react';
import { LectureWidget, LECTURE_WIDGETS } from '../src/components/reader/LectureWidget';
import { LectureReader } from '../src/components/LectureReader';
import { PrimaryLiteraturePanel } from '../src/components/reader/PrimaryLiteraturePanel';
import { emptyWorkspace } from '../src/lib/model';
import { LECTURE_MAP } from '../src/lib/curriculum';

vi.mock('../src/lib/workspace', () => ({
  useWorkspace: () => ({ data: emptyWorkspace(), update: vi.fn() })
}));
vi.mock('../src/lib/pdfViewerContext', () => ({ usePdfViewer: () => ({ openPaper: vi.fn() }) }));
vi.mock('../src/components/DocumentInkOverlay', () => ({
  DocumentInkOverlay: ({ children, contentVersion }: { children: ReactNode; contentVersion: number }) => (
    <div data-testid="annotation-sheet" data-version={contentVersion}>
      {children}
    </div>
  )
}));
beforeEach(() => {
  vi.stubGlobal('scrollTo', vi.fn());
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('updates damping probabilities and purity without a network request', () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch');
  render(<LectureWidget lectureId="L62-quantum-noise-channels" />);
  fireEvent.click(screen.getByText('Explore: Amplitude damping'));
  fireEvent.change(screen.getByRole('slider', { name: 'Damping strength γ' }), { target: { value: '1' } });
  expect(screen.getByText('100.0%')).toBeTruthy();
  expect(screen.getByText('0.0%')).toBeTruthy();
  expect(screen.getByText('1.000')).toBeTruthy();
  expect(fetchSpy).not.toHaveBeenCalled();
  fetchSpy.mockRestore();
});

it('updates the entropy from a product state to a Bell state', () => {
  render(<LectureWidget lectureId="L65-schmidt-quantum-entanglement" />);
  fireEvent.click(screen.getByText('Explore: Schmidt weights and entanglement'));
  const slider = screen.getByRole('slider', { name: 'Entanglement angle θ' });
  fireEvent.change(slider, { target: { value: '0' } });
  expect(screen.getByText('0.000 bits')).toBeTruthy();
  fireEvent.change(slider, { target: { value: '45' } });
  expect(screen.getByText('1.000 bits')).toBeTruthy();
});

it('labels bond dimension as an entropy bound rather than an actual state entropy', () => {
  render(<LectureWidget lectureId="L66-matrix-product-quantum-states" />);
  fireEvent.click(screen.getByText('Explore: Bond dimension'));
  fireEvent.change(screen.getByRole('combobox', { name: 'Bond dimension χ' }), { target: { value: '8' } });
  expect(screen.getByText('Entropy upper bound')).toBeTruthy();
  expect(screen.getByText('3 bits')).toBeTruthy();
});

it('updates the retained and discarded parts of the Schmidt spectrum', () => {
  render(<LectureWidget lectureId="L67-tebd-quantum-time-evolution" />);
  fireEvent.click(screen.getByText('Explore: Schmidt truncation'));
  expect(screen.getByText('10.0%')).toBeTruthy();
  fireEvent.change(screen.getByRole('slider', { name: 'Retained Schmidt terms χ' }), {
    target: { value: '3' }
  });
  expect(screen.getByText('2.0%')).toBeTruthy();
  expect(screen.getByText('98.0%')).toBeTruthy();
});

it('connects each visual to a real lecture and leaves other lessons unchanged', () => {
  Object.keys(LECTURE_WIDGETS).forEach((id) => expect(LECTURE_MAP.has(id), id).toBe(true));
  const { container } = render(<LectureWidget lectureId="unknown-lecture" />);
  expect(container.childElementCount).toBe(0);
});

it('keeps interactive controls outside the existing annotation sheet and content revision', () => {
  render(
    <MemoryRouter initialEntries={['/topics/tensor-network-simulation/L65-schmidt-quantum-entanglement']}>
      <Routes>
        <Route path="/topics/:topicId/:lectureId" element={<LectureReader />} />
      </Routes>
    </MemoryRouter>
  );
  expect(screen.getByText('Explore: Schmidt weights and entanglement').closest('details')?.open).toBe(false);
  fireEvent.click(screen.getByText('Explore: Schmidt weights and entanglement'));
  const slider = screen.getByRole('slider', { name: 'Entanglement angle θ' });
  const sheet = screen.getByTestId('annotation-sheet');
  expect(sheet.contains(slider)).toBe(false);
  expect(sheet.getAttribute('data-version')).toBe('4');
  const theory = sheet.textContent;
  fireEvent.change(slider, { target: { value: '45' } });
  expect(sheet.textContent).toBe(theory);
});

it('opens textbook PDFs and DOI references with accurate source labels', () => {
  const onOpenPaper = vi.fn();
  render(
    <PrimaryLiteraturePanel
      paperReferences={[
        ...LECTURE_MAP.get('L62-quantum-noise-channels')!.paperReferences,
        ...LECTURE_MAP.get('L63-lindblad-quantum-dynamics')!.paperReferences
      ]}
      onOpenPaper={onOpenPaper}
    />
  );
  expect(screen.getByRole('link', { name: 'Open source' }).getAttribute('href')).toBe(
    'https://www.preskill.caltech.edu/ph219/chap3_15.pdf'
  );
  expect(screen.queryByRole('link', { name: 'Open on arXiv' })).toBeNull();
  expect(screen.getByRole('link', { name: 'Read Paper' }).getAttribute('href')).toBe(
    'https://doi.org/10.1007/BF01608499'
  );
  fireEvent.click(screen.getByRole('button', { name: 'View Paper PDF' }));
  expect(onOpenPaper).toHaveBeenCalledWith(
    expect.objectContaining({ pdfUrl: 'https://www.preskill.caltech.edu/ph219/chap3_15.pdf' })
  );
});
