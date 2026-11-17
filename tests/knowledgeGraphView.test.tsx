// @vitest-environment jsdom
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { KnowledgeGraphView } from '../src/components/KnowledgeGraphView';
import { emptyWorkspace } from '../src/lib/model';

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

const rootTitle = 'Sets, Maps, and Mathematical Proof Patterns';
const groupsTitle = 'Groups, Monoids, and Modular Arithmetic';
const fieldsTitle = 'Finite Fields: GF(2) and GF(p)';

function mount(query = '') {
  return render(
    <MemoryRouter initialEntries={[`/tree${query}`]}>
      <KnowledgeGraphView />
    </MemoryRouter>
  );
}

describe('explicit graph card actions', () => {
  it.each(['Topics', 'Graph', 'Connections', 'Levels'])(
    '%s cards open details only through their Details button',
    (view) => {
      mount();
      fireEvent.click(screen.getByRole('button', { name: view }));
      const card = screen.getByRole('article', { name: rootTitle });
      fireEvent.click(within(card).getByText(rootTitle));
      fireEvent.click(card);
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(screen.getByRole('button', { name: view }).getAttribute('aria-pressed')).toBe('true');
      expect(workspace.update).not.toHaveBeenCalled();

      fireEvent.click(within(card).getByRole('button', { name: `Details for ${rootTitle}` }));
      expect(screen.getByRole('dialog', { name: 'Lecture details' })).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Close lecture details' }));
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(screen.getByRole('button', { name: view }).getAttribute('aria-pressed')).toBe('true');
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

  it('expands everything starting from a node using the node card Expand button', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Graph' }));
    const graph = screen.getByRole('group', { name: 'Lecture connections' });
    expect(within(graph).queryByRole('article', { name: fieldsTitle })).toBeNull();

    // Click Expand on rootTitle card
    const expandCardBtn = within(graph).getByRole('button', { name: `Expand ${rootTitle}` });
    fireEvent.click(expandCardBtn);

    // Graph expands, fieldsTitle is now visible
    expect(within(graph).getByRole('article', { name: fieldsTitle })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Collapse to 1-hop' })).toBeTruthy();
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
