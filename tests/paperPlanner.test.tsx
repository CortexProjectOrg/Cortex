// @vitest-environment jsdom
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PaperPlanner } from '../src/components/PaperPlanner';
import { analyzePaper } from '../src/lib/gemini';
import { buildPaperPlan } from '../src/lib/paperPlan';
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
      <PaperPlanner />
    </MemoryRouter>
  );
}
function fill() {
  fireEvent.change(screen.getByLabelText('Gemini API key'), { target: { value: 'example-user-key' } });
  fireEvent.change(screen.getByLabelText('Or paste the theorem and proof'), {
    target: { value: sourcePaper }
  });
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
  vi.mocked(analyzePaper).mockRejectedValueOnce(new Error('Gemini quota reached.'));
  mount();
  fill();
  fireEvent.click(screen.getByRole('button', { name: 'Generate tree' }));
  expect((await screen.findByRole('alert')).textContent).toContain('quota');
  fireEvent.click(screen.getByRole('button', { name: 'Generate tree' }));
  await screen.findByRole('heading', { name: 'Inverses of maps' });
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
