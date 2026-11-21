// @vitest-environment jsdom
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { KnowledgeGraphView } from '../src/components/KnowledgeGraphView';
import { StudyBranchList } from '../src/components/graph/StudyBranchList';
import { emptyWorkspace, type Workspace } from '../src/lib/model';
import { PaperStudySessionProvider } from '../src/lib/paperStudySession';
import { buildStudyGraph, type StudyNode } from '../src/lib/studyGraph';

const workspace = vi.hoisted(() => ({ update: vi.fn(), data: {} }));
vi.mock('../src/lib/workspace', () => ({ useWorkspace: () => workspace }));
beforeEach(() => {
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
const fieldsTitle = 'Finite Fields: GF(2) and GF(p)';

function mount(query = '') {
  return render(
    <MemoryRouter initialEntries={[`/tree${query}`]}>
      <PaperStudySessionProvider>
        <KnowledgeGraphView />
      </PaperStudySessionProvider>
    </MemoryRouter>
  );
}

describe('explicit graph card actions', () => {
  it('shows a declared shortcut and keeps the full study order when the start is unrelated', () => {
    mount();
    fireEvent.click(screen.getByText('Study route'));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search starting lessons' }), {
      target: { value: 'maps' }
    });
    const from = screen.getByRole('combobox', { name: 'From' });
    expect(within(from).getByRole('option', { name: rootTitle })).toBeTruthy();
    fireEvent.change(from, { target: { value: 'L01-sets-maps-proofs' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'To' }), {
      target: { value: 'L03-finite-fields-gf2-gfp' }
    });
    const route = screen.getByRole('list', { name: 'Shortest prerequisite route' });
    expect(
      within(route)
        .getAllByRole('link')
        .map((link) => link.textContent)
    ).toEqual([rootTitle, fieldsTitle]);
    const studyOrder = screen.getByRole('region', { name: 'Study order' });
    expect(within(studyOrder).getByRole('link', { name: groupsTitle })).toBeTruthy();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search starting lessons' }), {
      target: { value: 'bqp' }
    });
    fireEvent.change(from, { target: { value: 'L105-bqp-circuit-complexity' } });
    expect(screen.getByText('No connecting route')).toBeTruthy();
    expect(within(studyOrder).getByRole('link', { name: groupsTitle })).toBeTruthy();
  });

  it('opens prerequisites on the card and keeps them visible when browsing filters change', () => {
    mount('?focus=L03-finite-fields-gf2-gfp');
    const card = screen.getByRole('article', { name: fieldsTitle });
    fireEvent.click(within(card).getByRole('button', { name: 'Prerequisites' }));
    const focus = screen.getByRole('region', { name: 'Focused lesson connections' });
    expect(within(focus).getByRole('article', { name: rootTitle })).toBeTruthy();
    expect(within(focus).getByRole('article', { name: groupsTitle })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.change(screen.getByRole('textbox', { name: 'Search knowledge map' }), {
      target: { value: 'cannot match 99999' }
    });
    expect(within(focus).getByRole('article', { name: groupsTitle })).toBeTruthy();
  });

  it('moves focus to the search box when completion removes the Details opener', () => {
    const view = mount();
    fireEvent.click(screen.getByRole('button', { name: /^Ready \(/ }));
    const card = screen.getByRole('article', { name: rootTitle });
    const opener = within(card).getByRole('button', { name: `Details for ${rootTitle}` });
    opener.focus();
    fireEvent.click(opener);
    fireEvent.click(screen.getByRole('button', { name: 'Mark done' }));
    const update = workspace.update.mock.calls[0][0] as (data: Workspace) => Workspace;
    workspace.data = update(workspace.data as Workspace);
    view.rerender(
      <MemoryRouter>
        <PaperStudySessionProvider>
          <KnowledgeGraphView />
        </PaperStudySessionProvider>
      </MemoryRouter>
    );
    expect(opener.isConnected).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Close lecture details' }));
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Search knowledge map' }));
  });

  it.each(['Topics', 'Graph', 'Connections', 'Levels'])(
    '%s cards open details only through their Details button',
    (view) => {
      mount();
      const viewButton = screen.getByRole('button', { name: view });
      fireEvent.click(viewButton);
      const card = screen.getByRole('article', { name: rootTitle });
      fireEvent.click(within(card).getByText(rootTitle));
      fireEvent.click(card);
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(viewButton.getAttribute('aria-pressed')).toBe('true');
      expect(workspace.update).not.toHaveBeenCalled();

      fireEvent.click(within(card).getByRole('button', { name: `Details for ${rootTitle}` }));
      expect(screen.getByRole('dialog', { name: 'Lecture details' })).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Close lecture details' }));
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(viewButton.getAttribute('aria-pressed')).toBe('true');
      expect(
        within(card)
          .getByRole('link', { name: `Read ${rootTitle}` })
          .getAttribute('href')
      ).toBe('/topics/math-foundations/L01-sets-maps-proofs');
    }
  );

  it('explores successive neighborhoods without a modal or losing focus when details close', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: `Explore ${rootTitle}` }));
    const graph = screen.getByRole('group', { name: 'Lecture connections' });
    expect(within(graph).queryByRole('article', { name: fieldsTitle })).toBeNull();
    fireEvent.click(within(graph).getByRole('button', { name: `Explore ${groupsTitle}` }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(within(graph).getByRole('article', { name: fieldsTitle })).toBeTruthy();
    const selected = within(graph).getByRole('article', { name: groupsTitle });
    expect(selected.getAttribute('data-selected')).toBe('true');
    fireEvent.click(within(graph).getByRole('button', { name: `Details for ${rootTitle}` }));
    fireEvent.click(screen.getByRole('button', { name: 'Close lecture details' }));
    expect(selected.getAttribute('data-selected')).toBe('true');
    expect(within(graph).getByRole('article', { name: fieldsTitle })).toBeTruthy();
  });

  it('keeps connection exploration in the Connections view', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Connections' }));
    fireEvent.click(
      within(screen.getByRole('region', { name: 'Next lectures' })).getByRole('button', {
        name: `Explore ${groupsTitle}`
      })
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(
      within(screen.getByRole('region', { name: 'Next lectures' })).getByRole('article', {
        name: fieldsTitle
      })
    ).toBeTruthy();
    expect(
      within(screen.getByRole('region', { name: 'Selected lecture' }))
        .getByRole('article', { name: groupsTitle })
        .getAttribute('data-selected')
    ).toBe('true');
    expect(screen.getByRole('button', { name: 'Connections' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('focuses a linked lecture without automatically opening its details', () => {
    mount('?focus=L03-finite-fields-gf2-gfp');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('article', { name: fieldsTitle }).getAttribute('data-selected')).toBe('true');
  });

  it('does not start canvas panning when a card action receives a pointer press', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Graph' }));
    const graph = screen.getByRole('group', { name: 'Lecture connections' });
    const action = within(graph).getByRole('button', { name: `Explore ${groupsTitle}` });
    const camera = graph.querySelector('g[transform]')!;
    const before = camera.getAttribute('transform');
    fireEvent.pointerDown(action, { pointerId: 1, button: 0, clientX: 20, clientY: 30 });
    fireEvent.pointerMove(graph, { pointerId: 1, clientX: 100, clientY: 130 });
    expect(camera.getAttribute('transform')).toBe(before);
    expect(graph.style.cursor).toBe('grab');
    fireEvent.pointerDown(graph, { pointerId: 1, button: 0, clientX: 20, clientY: 30 });
    expect(graph.style.cursor).toBe('grabbing');
    fireEvent.pointerMove(graph, { pointerId: 1, clientX: 100, clientY: 130 });
    expect(camera.getAttribute('transform')).not.toBe(before);
    fireEvent.pointerCancel(graph, { pointerId: 1 });
    expect(graph.style.cursor).toBe('grab');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('expands everything starting from a node using the toolbar Expand all control', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Graph' }));
    const graph = screen.getByRole('group', { name: 'Lecture connections' });
    // In 1-hop, fieldsTitle (L03) is not visible from rootTitle (L01)
    expect(within(graph).queryByRole('article', { name: fieldsTitle })).toBeNull();

    // Click Expand all
    const expandAllBtn = screen.getByRole('button', { name: 'Expand all' });
    fireEvent.click(expandAllBtn);

    // Now distant nodes like fieldsTitle are visible in the graph
    expect(within(graph).getByRole('article', { name: fieldsTitle })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Collapse to 1-hop' })).toBeTruthy();

    // Collapse back to 1-hop
    fireEvent.click(screen.getByRole('button', { name: 'Collapse to 1-hop' }));
    expect(within(graph).queryByRole('article', { name: fieldsTitle })).toBeNull();
    expect(screen.getByRole('button', { name: 'Expand all' })).toBeTruthy();
  });

  it('expands nodes progressively using the node card Expand button', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Graph' }));
    const graph = screen.getByRole('group', { name: 'Lecture connections' });
    expect(within(graph).queryByRole('article', { name: fieldsTitle })).toBeNull();

    // Click Expand on groupsTitle card (which has hidden unlocks including fieldsTitle)
    const expandCardBtn = within(graph).getByRole('button', { name: `Expand ${groupsTitle}` });
    fireEvent.click(expandCardBtn);

    // Graph expands, fieldsTitle is now visible alongside rootTitle and groupsTitle!
    expect(within(graph).getByRole('article', { name: rootTitle })).toBeTruthy();
    expect(within(graph).getByRole('article', { name: groupsTitle })).toBeTruthy();
    expect(within(graph).getByRole('article', { name: fieldsTitle })).toBeTruthy();
  });

  it('expands unlocks using the SVG bottom pill and retains existing nodes up to expansion', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Graph' }));
    const graph = screen.getByRole('group', { name: 'Lecture connections' });
    expect(within(graph).queryByRole('article', { name: fieldsTitle })).toBeNull();

    // Click the bottom unlock pill on groupsTitle
    const unlockPill = within(graph).getByRole('button', {
      name: `Expand unlocks for ${groupsTitle}`
    });
    fireEvent.click(unlockPill);

    // Both rootTitle, groupsTitle, and the newly expanded fieldsTitle are visible
    expect(within(graph).getByRole('article', { name: rootTitle })).toBeTruthy();
    expect(within(graph).getByRole('article', { name: groupsTitle })).toBeTruthy();
    expect(within(graph).getByRole('article', { name: fieldsTitle })).toBeTruthy();
  });

  it('expands full dependency tree starting from an intermediate node', () => {
    mount('?focus=L03-finite-fields-gf2-gfp');
    fireEvent.click(screen.getByRole('button', { name: 'Graph' }));
    const graph = screen.getByRole('group', { name: 'Lecture connections' });

    // Click Expand tree
    const expandTreeBtn = screen.getByRole('button', { name: 'Expand tree' });
    fireEvent.click(expandTreeBtn);

    // Both ancestors (rootTitle) and descendants of fieldsTitle are visible
    expect(within(graph).getByRole('article', { name: rootTitle })).toBeTruthy();
    expect(within(graph).getByRole('article', { name: fieldsTitle })).toBeTruthy();
  });
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
