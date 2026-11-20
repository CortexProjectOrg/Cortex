// @vitest-environment jsdom
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LectureWidget, LECTURE_WIDGETS } from '../src/components/reader/LectureWidget';
import { LectureReader } from '../src/components/LectureReader';
import { PrimaryLiteraturePanel } from '../src/components/reader/PrimaryLiteraturePanel';
import { emptyWorkspace, makeNote, type Workspace } from '../src/lib/model';
import { CANONICAL_PAGE_GEOMETRY, renderStrokeToPath, serializeInk } from '../src/lib/ink';
import { LECTURE_MAP } from '../src/lib/curriculum';

let workspace = emptyWorkspace();
const updateWorkspace = (apply: (state: Workspace) => Workspace) => {
  workspace = apply(workspace);
};
vi.mock('../src/lib/workspace', () => ({
  useWorkspace: () => ({ data: workspace, update: updateWorkspace })
}));
vi.mock('../src/lib/pdfViewerContext', () => ({ usePdfViewer: () => ({ openPaper: vi.fn() }) }));
beforeEach(() => {
  workspace = emptyWorkspace();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    }
  );
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

function openLecture(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/topics/:topicId/:lectureId" element={<LectureReader />} />
      </Routes>
    </MemoryRouter>
  );
}

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

it('renders the visual after the matching explanation and preserves its state across reader modes', () => {
  const { container } = openLecture('/topics/tensor-network-simulation/L65-schmidt-quantum-entanglement');
  const summary = screen.getByText('Explore: Schmidt weights and entanglement');
  const widget = summary.closest('details')!;
  expect(widget.open).toBe(false);
  expect(widget.closest('article')).toBeTruthy();
  expect(widget.hasAttribute('data-reading-only')).toBe(true);
  expect(widget.nextElementSibling?.id).toBe('truncation-and-a-precise-error-measure');
  fireEvent.click(summary);
  const slider = screen.getByRole('slider', { name: 'Entanglement angle θ' });
  fireEvent.change(slider, { target: { value: '45' } });
  fireEvent.click(screen.getByRole('button', { name: 'Annotate' }));
  expect(container.querySelector('.annotation-mode .reading-sheet')?.contains(widget)).toBe(true);
  expect(widget.open).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Read' }));
  expect(widget.open).toBe(true);
  expect((slider as HTMLInputElement).value).toBe('45');
});

it.each([2, 3, 4])(
  'keeps revision %i saved ink and its lecture text when using an inline visual',
  (version) => {
    const id = 'L01-sets-maps-proofs';
    const stroke = {
      id: 'stored-stroke',
      color: '#000000',
      size: 3,
      points: [
        [30, 440, 0.5],
        [90, 448, 0.5]
      ] as [number, number, number][]
    };
    const lectureInk = serializeInk([stroke], 960, 1600, { ...CANONICAL_PAGE_GEOMETRY, version });
    workspace.notes = [{ ...makeNote('Saved ink', undefined, id), lectureInk }];
    const { container } = openLecture(`/topics/math-foundations/${id}`);
    const summary = screen.getByText('Explore: Maps and inverses');
    expect(summary.closest('details')?.nextElementSibling?.id).toBe(
      version < 4 ? '3-proof-patterns-in-discrete-quantum-algebra' : 'proof-choices'
    );
    fireEvent.click(summary);
    fireEvent.change(screen.getByRole('combobox', { name: 'Codomain size' }), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Annotate' }));
    const savedPath = container.querySelector('.document-ink-overlay-svg path');
    expect(savedPath?.getAttribute('d')).toBe(renderStrokeToPath(stroke));
    expect(workspace.notes[0].lectureInk).toBe(lectureInk);
  }
);

it('allows native select keys and keeps the inline example when opening Notes', () => {
  openLecture('/topics/advanced-topics/L60-qudit-algebra-mixed-dimension-registers');
  const summary = screen.getByText('Explore: Shift by two around a qudit');
  fireEvent.click(summary);
  const select = screen.getByRole('combobox', { name: 'Example' });
  fireEvent.change(select, { target: { value: '1' } });
  expect(fireEvent.keyDown(select, { key: 'n' })).toBe(true);
  expect(screen.queryByRole('button', { name: /Hide Notes/ })).toBeNull();
  fireEvent.keyDown(document.body, { key: 'n' });
  expect(screen.getByRole('button', { name: /Hide Notes/ })).toBeTruthy();
  expect(summary.closest('details')?.open).toBe(true);
  expect((screen.getByRole('combobox', { name: 'Example' }) as HTMLSelectElement).value).toBe('1');
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
