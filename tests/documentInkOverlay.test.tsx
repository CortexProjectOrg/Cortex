// @vitest-environment jsdom
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentInkOverlay } from '../src/components/DocumentInkOverlay';

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

beforeEach(() => {
  window.scrollBy = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function mount() {
  return render(
    <DocumentInkOverlay>
      <article>
        <h1>Test Document</h1>
        <p>Document content to annotate and scroll.</p>
      </article>
    </DocumentInkOverlay>
  );
}

describe('DocumentInkOverlay scroll freezing and drawing controls', () => {
  it('keeps page scrolling unfrozen while in Read mode', () => {
    mount();
    expect(screen.queryByText('Scroll Frozen')).toBeNull();
    expect(screen.queryByLabelText('Scroll document down')).toBeNull();

    const wheelEvent = new Event('wheel', { bubbles: true, cancelable: true });
    window.dispatchEvent(wheelEvent);
    expect(wheelEvent.defaultPrevented).toBe(false);

    const touchEvent = new Event('touchmove', { bubbles: true, cancelable: true });
    window.dispatchEvent(touchEvent);
    expect(touchEvent.defaultPrevented).toBe(false);
  });

  it('freezes page scrolling in drawing mode and allows stepping with scroll controls', () => {
    mount();
    // Toggle into annotation mode
    fireEvent.click(screen.getByRole('button', { name: 'Annotate' }));

    // Defaults to browse tool in annotation mode
    expect(screen.queryByText('Scroll Frozen')).toBeNull();
    expect(screen.queryByLabelText('Scroll document down')).toBeNull();

    // Select Pen tool
    fireEvent.click(screen.getByTitle('Pen'));

    // "Scroll Frozen" indicator is displayed
    const frozenBadge = screen.getByText('Scroll Frozen');
    expect(frozenBadge).toBeTruthy();
    expect(frozenBadge.closest('span')?.getAttribute('title')).toBe(
      'Page scrolling is frozen so you can draw precisely. Use the arrows in the lower right to scroll.'
    );

    // Floating navigation controls appear
    const scrollUp = screen.getByLabelText('Scroll document up');
    const scrollDown = screen.getByLabelText('Scroll document down');
    expect(scrollUp).toBeTruthy();
    expect(scrollDown).toBeTruthy();

    // Wheel and touchmove events on the page are prevented
    const pageWheel = new Event('wheel', { bubbles: true, cancelable: true });
    window.dispatchEvent(pageWheel);
    expect(pageWheel.defaultPrevented).toBe(true);

    const pageTouch = new Event('touchmove', { bubbles: true, cancelable: true });
    window.dispatchEvent(pageTouch);
    expect(pageTouch.defaultPrevented).toBe(true);

    // Clicking scroll controls calls window.scrollBy
    fireEvent.click(scrollDown);
    expect(window.scrollBy).toHaveBeenCalledWith(
      expect.objectContaining({ top: expect.any(Number), behavior: 'smooth' })
    );

    fireEvent.click(scrollUp);
    expect(window.scrollBy).toHaveBeenCalledWith(
      expect.objectContaining({ top: expect.any(Number), behavior: 'smooth' })
    );

    // Switching back to Browse unfreezes scrolling
    fireEvent.click(screen.getByTitle('Browse'));
    expect(screen.queryByText('Scroll Frozen')).toBeNull();
    expect(screen.queryByLabelText('Scroll document down')).toBeNull();

    const unfrozenWheel = new Event('wheel', { bubbles: true, cancelable: true });
    window.dispatchEvent(unfrozenWheel);
    expect(unfrozenWheel.defaultPrevented).toBe(false);
  });

  it('does not freeze wheel events inside dialogs or scratchpad panels', () => {
    const { container } = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Annotate' }));
    fireEvent.click(screen.getByTitle('Pen'));

    // Create a mock dialog and scratchpad element inside the container
    const dialog = document.createElement('dialog');
    dialog.open = true;
    const dialogContent = document.createElement('div');
    dialog.appendChild(dialogContent);
    container.appendChild(dialog);

    const scratchpad = document.createElement('div');
    scratchpad.className = 'lecture-scratchpad-panel';
    const scratchpadContent = document.createElement('textarea');
    scratchpad.appendChild(scratchpadContent);
    container.appendChild(scratchpad);

    const dialogWheel = new Event('wheel', { bubbles: true, cancelable: true });
    dialogContent.dispatchEvent(dialogWheel);
    expect(dialogWheel.defaultPrevented).toBe(false);

    const scratchpadWheel = new Event('wheel', { bubbles: true, cancelable: true });
    scratchpadContent.dispatchEvent(scratchpadWheel);
    expect(scratchpadWheel.defaultPrevented).toBe(false);
  });
});
