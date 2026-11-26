// @vitest-environment jsdom
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ConnectionsPage, LegacyTree, KnowledgeGraphView } from '../src/components/KnowledgeGraphView';
import { StudyBranchList } from '../src/components/graph/StudyBranchList';
import { PaperStudySessionProvider } from '../src/lib/paperStudySession';
import { emptyWorkspace } from '../src/lib/model';
import { visibleBranch } from '../src/lib/visibleBranch';
import { buildStudyGraph, type StudyNode } from '../src/lib/studyGraph';

const workspace = vi.hoisted(() => ({ update: vi.fn(), data: {} }));
vi.mock('../src/lib/workspace', () => ({ useWorkspace: () => workspace }));
beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  workspace.data = emptyWorkspace();
  workspace.update.mockReset();
  // jsdom has no native dialog implementation; retain the real Modal component.
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});
afterEach(cleanup);

const rootTitle = 'Sets, Maps, and Inverses';
const groupsTitle = 'Groups, Monoids, and Modular Arithmetic';
const rootId = 'L01-sets-maps-proofs';
function mount(path = '/graph') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <PaperStudySessionProvider>
        <Routes>
          <Route path="/graph" element={<KnowledgeGraphView />} />
          <Route path="/connections/lecture/:lectureId" element={<ConnectionsPage />} />
          <Route path="/tree" element={<LegacyTree />} />
          <Route path="/papers" element={<h1>Paper input</h1>} />
        </Routes>
      </PaperStudySessionProvider>
    </MemoryRouter>
  );
}
it('opens info and follows a neighbor without moving or selecting the canvas', () => {
  mount();
  const canvas = screen.getByRole('group', { name: 'Lecture connections' });
  const before = canvas.innerHTML;
  const opener = within(canvas).getByRole('button', { name: 'Info for ' + rootTitle });
  opener.focus();
  fireEvent.click(opener);
  const panel = screen.getByRole('complementary', { name: 'Lecture info' });
  expect(document.activeElement?.textContent).toBe('Lecture info');
  fireEvent.click(within(panel).getByRole('button', { name: 'Explore ' + groupsTitle }));
  expect(within(panel).getByRole('heading', { name: groupsTitle })).toBeTruthy();
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(document.activeElement).toBe(opener);
  expect(canvas.innerHTML).toBe(before);
});
it('expands just the requested direction and can collapse it again', () => {
  mount();
  const node = screen.getByRole('article', { name: groupsTitle });
  const next = within(node).getByRole('button', { name: /Next lectures for/ });
  const before = screen.getAllByRole('article').length;
  fireEvent.click(next);
  expect(next.getAttribute('aria-expanded')).toBe('true');
  expect(screen.getAllByRole('article').length).toBeGreaterThanOrEqual(before);
  fireEvent.click(next);
  expect(screen.getAllByRole('article')).toHaveLength(before);
});
it('migrates old focus links and lists every direct neighbor on demand', () => {
  mount('/tree?focus=' + rootId);
  const lane = within(screen.getByRole('region', { name: 'Next lectures' }));
  expect(lane.getAllByRole('button', { name: /^Explore / })).toHaveLength(4);
  fireEvent.click(lane.getByRole('button', { name: /Show all connections/ }));
  expect(lane.getAllByRole('button', { name: /^Explore / }).length).toBeGreaterThan(4);
  fireEvent.click(lane.getByRole('button', { name: 'Explore ' + groupsTitle }));
  expect(screen.getByRole('heading', { name: groupsTitle })).toBeTruthy();
  expect(screen.getByText('Compare a starting lecture')).toBeTruthy();
});
it('gives the paper parameter precedence over a focused lecture', () => {
  mount('/tree?focus=' + rootId + '&study=paper');
  expect(screen.getByRole('heading', { name: 'Paper input' })).toBeTruthy();
});
it('retains shared dependencies and bounds a wide frontier', () => {
  const mk = (id: string): StudyNode => ({ id, title: id, kind: 'catalog', minutes: 1 });
  const edge = (a: string, b: string) => ({
    prerequisiteId: a,
    dependentId: b,
    sources: ['catalog' as const]
  });
  const graph = buildStudyGraph(['A', 'B', 'C', 'D'].map(mk), [
    edge('B', 'A'),
    edge('C', 'A'),
    edge('D', 'B'),
    edge('D', 'C')
  ]);
  expect(
    visibleBranch(graph, 'A', { B: { prerequisites: false }, C: { prerequisites: true } }).seen.has('D')
  ).toBe(true);
  const wide = Array.from({ length: 150 }, (_, i) => mk(String(i)));
  const big = buildStudyGraph(
    wide,
    wide.slice(1).map((n) => edge(n.id, '0'))
  );
  const visible = visibleBranch(big, '0', {});
  expect(visible.seen.size).toBe(120);
  expect(visible.limited).toBe(true);
  expect(big.incoming.get('0')).toHaveLength(149);
});
describe('focused branch list', () => {
  const lesson = (id: string): StudyNode => ({ id, title: id, kind: 'catalog', minutes: 10 });
  const prerequisite = (prerequisiteId: string, dependentId: string) => ({
    prerequisiteId,
    dependentId,
    sources: ['catalog'] as const
  });

  it('uses the shortest visible occurrence to disclose a shared prerequisite', () => {
    const graph = buildStudyGraph(['R', 'A', 'X', 'Y'].map(lesson), [
      prerequisite('A', 'R'),
      prerequisite('X', 'R'),
      prerequisite('X', 'A'),
      prerequisite('Y', 'X')
    ]);
    render(
      <StudyBranchList
        graph={graph}
        root="R"
        direction="prerequisites"
        depth={2}
        selected={null}
        renderNode={(node) => <strong>{node.title}</strong>}
      />
    );
    expect(screen.getByText('Y')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'X · Shared' })).toBeTruthy();
  });

  it('makes the next set of wide-branch siblings reachable and focuses the first new occurrence', () => {
    const nodes = Array.from({ length: 1000 }, (_, index) => lesson(`n${index.toString().padStart(4, '0')}`));
    const graph = buildStudyGraph(
      nodes,
      nodes.slice(1).map(({ id }) => prerequisite(nodes[0].id, id))
    );
    render(
      <StudyBranchList
        graph={graph}
        root="n0000"
        direction="unlocks"
        depth={1}
        selected={null}
        renderNode={(node) => <strong>{node.title}</strong>}
      />
    );
    expect(screen.queryByText('n0021')).toBeNull();
    const showMore = screen.getByRole('button', { name: 'Show more for n0000' });
    showMore.focus();
    fireEvent.click(showMore);
    expect(document.activeElement?.textContent).toBe('n0021');
    expect(screen.getByText('n0001')).toBeTruthy();
  });
});
