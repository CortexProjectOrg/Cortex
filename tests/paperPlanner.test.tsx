// @vitest-environment jsdom
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { File as NodeFile } from 'node:buffer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PaperPlanner } from '../src/components/PaperPlanner';
import { analyzePaper, PaperAnalysisError } from '../src/lib/gemini';
import { buildPaperPlan, MAX_PAPER_TREE_BYTES, type PaperAnalysis } from '../src/lib/paperPlan';
import { PaperStudySessionProvider } from '../src/lib/paperStudySession';
import { emptyWorkspace } from '../src/lib/model';
import type { Workspace } from '../src/lib/model';
import { paperAnalysis, sourcePaper } from './fixtures/paperAnalysis';

const workspace = vi.hoisted(() => ({ update: vi.fn(), data: {} }));
vi.mock('../src/lib/workspace', () => ({ useWorkspace: () => workspace }));
vi.mock('../src/lib/pdfViewerContext', () => ({ usePdfViewer: () => ({ openPaper: vi.fn() }) }));
vi.mock('../src/lib/gemini', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/lib/gemini')>()),
  analyzePaper: vi.fn()
}));
beforeEach(() => {
  workspace.data = emptyWorkspace();
  workspace.update.mockReset();
  vi.mocked(analyzePaper).mockReset().mockResolvedValue(buildPaperPlan(paperAnalysis));
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(cleanup);
function mount() {
  return render(
    <MemoryRouter>
      <PaperStudySessionProvider>
        <PaperPlanner />
      </PaperStudySessionProvider>
    </MemoryRouter>
  );
}
function fill() {
  fireEvent.change(screen.getByLabelText('Gemini API key'), { target: { value: 'example-user-key' } });
  fireEvent.change(screen.getByLabelText('Or paste the theorem and proof'), {
    target: { value: sourcePaper }
  });
}
function importTree(analysis: PaperAnalysis) {
  const file = new NodeFile([JSON.stringify({ version: 1, analysis })], 'tree.json', {
    type: 'application/json'
  });
  fireEvent.change(screen.getByLabelText('Open saved tree'), { target: { files: [file] } });
}
it('generates a tree and saves only the study note after an explicit action', async () => {
  mount();
  fill();
  fireEvent.click(screen.getByRole('button', { name: 'Generate tree' }));
  await screen.findByRole('heading', { name: 'Inverses of maps' });
  expect(screen.getByRole('navigation', { name: 'Theorem dependency tree' })).toBeTruthy();
  expect(workspace.update).not.toHaveBeenCalled();
  expect(localStorage.length + sessionStorage.length).toBe(0);
  expect(screen.getByLabelText('Gemini API key').closest('form')!.hidden).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Study order' }));
  expect(screen.getByRole('navigation', { name: 'Study order' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Add to notebook' }));
  const saved = (workspace.update.mock.calls[0][0] as (data: Workspace) => Workspace)(emptyWorkspace());
  expect(saved.notes[0].body).toContain('Every bijective map');
  expect(JSON.stringify(saved)).not.toContain('example-user-key');
  expect(screen.getByRole('link', { name: 'Open study note' })).toBeTruthy();
});
it('keeps the form editable after a provider failure so generation can be retried', async () => {
  vi.mocked(analyzePaper).mockRejectedValueOnce(new PaperAnalysisError('http', 429));
  mount();
  fill();
  fireEvent.click(screen.getByRole('button', { name: 'Generate tree' }));
  expect((await screen.findByRole('alert')).textContent).toContain('quota');
  fireEvent.click(screen.getByRole('button', { name: 'Generate tree' }));
  await screen.findByRole('heading', { name: 'Inverses of maps' });
  expect(screen.queryByRole('alert')).toBeNull();
});
it('keeps the active tree and source after an unexpected error and shows fixed copy', async () => {
  mount();
  fill();
  fireEvent.click(screen.getByRole('button', { name: 'Generate tree' }));
  await screen.findByRole('heading', { name: 'Inverses of maps' });
  fireEvent.click(screen.getByRole('button', { name: 'Change paper or theorem' }));
  vi.mocked(analyzePaper).mockRejectedValueOnce(new Error('PRIVATE TITLE'));
  fireEvent.click(screen.getByRole('button', { name: 'Generate tree' }));
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Could not generate the study plan. Try again.'
  );
  expect(screen.getByRole('heading', { name: 'Inverses of maps' })).toBeTruthy();
  expect((screen.getByLabelText('Or paste the theorem and proof') as HTMLTextAreaElement).value).toBe(
    sourcePaper
  );
  expect((screen.getByRole('button', { name: 'Generate tree' }) as HTMLButtonElement).disabled).toBe(false);
});
it('clears a cancelled request without an alert', async () => {
  vi.mocked(analyzePaper).mockImplementation(
    ({ signal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError')), {
          once: true
        });
      })
  );
  mount();
  fill();
  fireEvent.click(screen.getByRole('button', { name: 'Generate tree' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  await screen.findByRole('button', { name: 'Generate tree' });
  expect(screen.queryByRole('alert')).toBeNull();
});
it('cancels requests on navigation and never persists a key', async () => {
  let finish!: (value: ReturnType<typeof buildPaperPlan>) => void;
  vi.mocked(analyzePaper).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  const view = mount();
  fill();
  fireEvent.click(screen.getByRole('button', { name: 'Generate tree' }));
  const signal = vi.mocked(analyzePaper).mock.calls[0][0].signal;
  view.unmount();
  expect(signal.aborted).toBe(true);
  await act(async () => finish(buildPaperPlan(paperAnalysis)));
  expect(workspace.update).not.toHaveBeenCalled();
  expect(localStorage.length + sessionStorage.length).toBe(0);
});
it('clears the key and keeps generation disabled without sufficient source material', () => {
  mount();
  fill();
  fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
  expect((screen.getByLabelText('Gemini API key') as HTMLInputElement).value).toBe('');
  expect((screen.getByRole('button', { name: 'Generate tree' }) as HTMLButtonElement).disabled).toBe(true);
});
it('opens an exported tree without an API call', async () => {
  mount();
  const file = new File(['example'], 'tree.json', { type: 'application/json' });
  Object.defineProperty(file, 'text', {
    value: async () => JSON.stringify({ version: 1, analysis: paperAnalysis })
  });
  fireEvent.change(screen.getByLabelText('Open saved tree'), { target: { files: [file] } });
  await screen.findByRole('heading', { name: 'Inverses of maps' });
  expect(analyzePaper).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Change paper or theorem' }));
  await waitFor(() => expect(screen.getByLabelText('Gemini API key').closest('form')!.hidden).toBe(false));
});

it('requires confirmation for a named proposal and discards a proposal when an import supersedes it', async () => {
  mount();
  fill();
  fireEvent.change(screen.getByLabelText(/Theorem to study/), { target: { value: 'Invertibility' } });
  fireEvent.click(screen.getByRole('button', { name: 'Generate tree' }));
  const confirm = await screen.findByRole('button', { name: 'Use this theorem' });
  expect(screen.queryByRole('heading', { name: 'Inverses of maps' })).toBeNull();
  fireEvent.click(confirm);
  await screen.findByRole('heading', { name: 'Inverses of maps' });

  fireEvent.click(screen.getByRole('button', { name: 'Change paper or theorem' }));
  fireEvent.click(screen.getByRole('button', { name: 'Generate tree' }));
  await screen.findByRole('button', { name: 'Use this theorem' });
  importTree({ ...paperAnalysis, paperTitle: 'Imported theorem' });
  await screen.findByRole('heading', { name: 'Imported theorem' });
  fireEvent.click(screen.getByRole('button', { name: 'Change paper or theorem' }));
  expect(screen.queryByRole('button', { name: 'Use this theorem' })).toBeNull();
  expect(analyzePaper).toHaveBeenCalledTimes(2);
});

it('preserves paper knowledge after both no-theorem generation and no-theorem import', async () => {
  const noTheorem = { ...paperAnalysis, theorem: null, concepts: [], explanation: 'The proof is missing.' };
  mount();
  importTree(paperAnalysis);
  await screen.findByRole('heading', { name: 'Inverses of maps' });
  const tree = within(screen.getByRole('navigation', { name: 'Theorem dependency tree' }));
  fireEvent.click(tree.getByRole('button', { name: /^Bijections and inverse functions/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Known for this paper' }));
  fireEvent.click(screen.getByRole('button', { name: 'Change paper or theorem' }));
  fill();
  vi.mocked(analyzePaper).mockResolvedValueOnce(buildPaperPlan(noTheorem));
  fireEvent.click(screen.getByRole('button', { name: 'Generate tree' }));
  await screen.findByText(noTheorem.explanation);
  expect(screen.getByRole('button', { name: 'Known for this paper', pressed: true })).toBeTruthy();
  importTree({ ...noTheorem, explanation: 'The saved tree contains no theorem.' });
  await screen.findByText('The saved tree contains no theorem.');
  expect(screen.getByRole('button', { name: 'Known for this paper', pressed: true })).toBeTruthy();
});

it('round-trips a near-limit UTF-8 file in compact form and retains disconnected concepts', async () => {
  const analysis = structuredClone(paperAnalysis);
  const [example] = analysis.concepts;
  analysis.concepts = Array.from({ length: 24 }, (_, index) => ({
    ...example,
    id: index === 0 ? 'target' : `topic-${index}`,
    title: `Foundations ${index}`,
    explanation: '界'.repeat(5200),
    example: '界'.repeat(3000),
    exercise: '界'.repeat(1500),
    reason: '界'.repeat(1000),
    evidence: '界'.repeat(1500),
    source: '界'.repeat(300),
    objectives: Array(5).fill('界'.repeat(250))
  }));
  analysis.theorem!.prerequisites = ['target'];
  const envelope = { version: 1, analysis };
  const bytesNeeded = MAX_PAPER_TREE_BYTES - 20 - Buffer.byteLength(JSON.stringify(envelope));
  expect(bytesNeeded).toBeGreaterThan(0);
  let remaining = bytesNeeded;
  for (const concept of analysis.concepts) {
    const fill = Math.min(700, Math.floor(remaining / 3));
    concept.explanation += '界'.repeat(fill);
    remaining -= fill * 3;
  }
  analysis.paperTitle += 'x'.repeat(remaining);
  expect(Buffer.byteLength(JSON.stringify(envelope))).toBe(MAX_PAPER_TREE_BYTES - 20);
  expect(Buffer.byteLength(JSON.stringify(envelope, null, 2))).toBeGreaterThan(MAX_PAPER_TREE_BYTES);

  const objectUrl = vi.fn((_blob: Blob) => 'blob:paper-tree-test');
  class TestURL extends URL {
    static createObjectURL = objectUrl;
    static revokeObjectURL = vi.fn();
  }
  vi.stubGlobal('URL', TestURL);
  const download = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  try {
    mount();
    importTree(analysis);
    await screen.findByRole('heading', { name: analysis.paperTitle });
    fireEvent.click(screen.getByRole('button', { name: 'Export tree' }));
    const blob = objectUrl.mock.calls[0][0];
    expect(blob.size).toBe(MAX_PAPER_TREE_BYTES - 20);
    const reader = new FileReader();
    const exported = await new Promise<ArrayBuffer>((resolve) => {
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.readAsArrayBuffer(blob);
    });
    const downloadedFile = new NodeFile([Buffer.from(exported)], 'downloaded.json');
    expect(JSON.parse(await downloadedFile.text())).toEqual(envelope);
    fireEvent.change(screen.getByLabelText('Open saved tree'), { target: { files: [downloadedFile] } });
    await waitFor(() =>
      expect((screen.getByLabelText('Open saved tree') as HTMLInputElement).disabled).toBe(false)
    );
    expect(screen.queryByRole('alert')).toBeNull();
    const tree = within(screen.getByRole('navigation', { name: 'Theorem dependency tree' }));
    expect(tree.getByRole('button', { name: /^Foundations 0/, pressed: false })).toBeTruthy();
    expect(tree.queryByRole('button', { name: /^Foundations 1/, pressed: false })).toBeNull();
    expect(analyzePaper).not.toHaveBeenCalled();
  } finally {
    download.mockRestore();
    vi.unstubAllGlobals();
  }
});
