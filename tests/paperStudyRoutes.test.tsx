// @vitest-environment jsdom
import { File as NodeFile } from 'node:buffer';
import { act, cleanup, configure, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useNavigate, type NavigateFunction } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import App from '../src/App';
import { LECTURE_MAP } from '../src/lib/curriculumCatalog';
import { analyzePaper } from '../src/lib/gemini';
import { buildPaperPlan, type PaperAnalysis } from '../src/lib/paperPlan';
import { formatStudyTime } from '../src/lib/studyTime';
import { useWorkspace, WorkspaceProvider } from '../src/lib/workspace';
import { paperAnalysis, sourcePaper } from './fixtures/paperAnalysis';

const auth = vi.hoisted(() => ({
  user: null as null | { uid: string; name: string; email: string },
  isLoading: false,
  token: null,
  invalidateSession: vi.fn()
}));
vi.mock('../src/lib/auth', () => ({ useAuth: () => auth }));
vi.mock('virtual:pwa-register', () => ({ registerSW: () => vi.fn() }));
vi.mock('idb', () => ({ openDB: async () => ({ get: async () => undefined, put: async () => {} }) }));
vi.mock('../src/lib/gemini', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/lib/gemini')>()),
  analyzePaper: vi.fn()
}));

let navigate: NavigateFunction;
let workspace: ReturnType<typeof useWorkspace>;
function Harness() {
  navigate = useNavigate();
  workspace = useWorkspace();
  return <App />;
}
function app(initialEntry: string) {
  return (
    <MemoryRouter initialEntries={[initialEntry]}>
      <WorkspaceProvider>
        <Harness />
      </WorkspaceProvider>
    </MemoryRouter>
  );
}
function importTree(analysis: PaperAnalysis) {
  const file = new NodeFile([JSON.stringify({ version: 1, analysis })], 'tree.json');
  fireEvent.change(screen.getByLabelText('Open saved tree'), { target: { files: [file] } });
}
const tree = () => within(screen.getByRole('navigation', { name: 'Theorem dependency tree' }));
const inspector = () => within(screen.getByRole('article', { name: 'Selected lesson' }));
const depth = () => (screen.getByLabelText('Depth') as HTMLSelectElement).value;
const clickLink = (name: string) => fireEvent.click(screen.getByRole('link', { name }));

beforeAll(async () => {
  configure({ asyncUtilTimeout: 5000 });
  await Promise.all([
    import('../src/components/LectureReader'),
    import('../src/components/KnowledgeGraphView'),
    import('../src/components/PaperPlanner')
  ]);
}, 15000);
afterAll(() => configure({ asyncUtilTimeout: 1000 }));
beforeEach(() => {
  auth.user = null;
  localStorage.clear();
  vi.mocked(analyzePaper).mockReset();
  vi.stubGlobal('scrollTo', vi.fn());
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    }
  );
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('keeps the active plan, completion and note across the real routes and resets on replacement', async () => {
  const input = structuredClone(paperAnalysis);
  input.concepts[0].title = 'Groups';
  vi.mocked(analyzePaper).mockResolvedValueOnce(buildPaperPlan(input));
  render(app('/papers'));
  await screen.findByRole('region', { name: 'Paper to tree' });
  const sidebar = within(screen.getByRole('navigation', { name: 'Main navigation' }));
  expect(sidebar.getByRole('link', { name: 'Knowledge map' }).getAttribute('aria-current')).toBe('page');
  expect(sidebar.queryByRole('link', { name: /paper/i })).toBeNull();
  fireEvent.change(screen.getByLabelText('Gemini API key'), { target: { value: 'test-key' } });
  fireEvent.change(screen.getByLabelText('Or paste the theorem and proof'), {
    target: { value: sourcePaper }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Generate tree' }));
  await screen.findByRole('heading', { name: 'Inverses of maps' });
  const groups = LECTURE_MAP.get('L02-groups-modular-arithmetic')!;
  const maps = LECTURE_MAP.get('L01-sets-maps-proofs')!;

  fireEvent.click(tree().getByRole('button', { name: /^Bijections and inverse functions/, pressed: false }));
  fireEvent.click(inspector().getByRole('button', { name: 'Known for this paper' }));
  fireEvent.change(screen.getByLabelText('Depth'), { target: { value: '4' } });
  fireEvent.click(
    tree().getByRole('button', { name: `${maps.title} Ready · ${formatStudyTime(maps.durationMinutes)}` })
  );
  fireEvent.change(screen.getByLabelText('Depth'), { target: { value: '1' } });
  expect(tree().getByText('Selected prerequisite')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Add to notebook' }));
  const saved = screen.getByRole('link', { name: 'Open study note' }).getAttribute('href');
  expect(workspace.data.notes).toHaveLength(1);

  clickLink('Curriculum');
  await screen.findByRole('region', { name: 'Selected lecture' });
  clickLink('Paper to tree');
  await screen.findByRole('navigation', { name: 'Theorem dependency tree' });
  expect(depth()).toBe('1');
  expect(inspector().getByRole('heading', { name: maps.title })).toBeTruthy();
  expect(tree().getByText('Selected prerequisite')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Open study note' }).getAttribute('href')).toBe(saved);
  fireEvent.click(inspector().getByRole('button', { name: 'Mark done' }));
  expect(workspace.data.completedLectures).toContain(maps.id);
  expect(screen.getByText(`1 remaining · ${formatStudyTime(groups.durationMinutes)}`)).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Depth'), { target: { value: '5' } });
  expect(
    tree().getByRole('button', { name: `${groups.title} Ready · ${formatStudyTime(groups.durationMinutes)}` })
  ).toBeTruthy();
  fireEvent.click(inspector().getByRole('link', { name: 'Read lesson' }));
  await screen.findByRole('heading', { name: maps.title, level: 1 }, { timeout: 5000 });
  await act(async () => {
    await navigate(-1);
  });
  await screen.findByRole('navigation', { name: 'Theorem dependency tree' });
  expect(depth()).toBe('5');
  expect(tree().getByRole('button', { name: `${maps.title} Done`, pressed: true })).toBeTruthy();
  expect(inspector().getByRole('button', { name: 'Mark done', pressed: true })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Open study note' }).getAttribute('href')).toBe(saved);
  expect(workspace.data.notes).toHaveLength(1);
  act(() => workspace.update((data) => ({ ...data, notes: [] })));
  await screen.findByRole('button', { name: 'Add to notebook' });

  importTree({ ...input, paperTitle: 'Replacement theorem' });
  await screen.findByRole('heading', { name: 'Replacement theorem' });
  expect(depth()).toBe('2');
  expect(inspector().getByRole('heading', { name: 'Theorem 1' })).toBeTruthy();
  expect(screen.getByText(/^2 remaining ·/)).toBeTruthy();
  await act(async () => {
    await navigate('/tree');
  });
  await screen.findByRole('heading', { name: 'Knowledge map' });
  expect(screen.queryByRole('heading', { name: 'Replacement theorem' })).toBeNull();
  expect(analyzePaper).toHaveBeenCalledTimes(1);
}, 12000);

it('recovers from a stale paper link and clears the session when the workspace account changes', async () => {
  const view = render(app('/tree?study=paper'));
  await screen.findByRole('button', { name: 'Generate tree' });
  importTree(paperAnalysis);
  await screen.findByRole('heading', { name: 'Inverses of maps' });
  auth.user = { uid: 'paper-account-B', name: 'Paper Account B', email: 'b@example.test' };
  view.rerender(app('/tree?study=paper'));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Generate tree' })).toBeTruthy());
  expect(screen.queryByRole('heading', { name: 'Inverses of maps' })).toBeNull();
  expect(analyzePaper).not.toHaveBeenCalled();
}, 12000);
