// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  changeHistory,
  useAnnotationHistory,
  type AnnotationDocument,
  type AnnotationHistory
} from '../src/components/ink/useAnnotationHistory';
import { serializeInk, type InkStroke } from '../src/lib/ink';
const stroke = (id: string): InkStroke => ({ id, points: [[1, 2, 0.5]], size: 3, color: '#123456' });
const blank: AnnotationDocument = { strokes: [], textAnnotations: [] };
afterEach(cleanup);
describe('document annotation history', () => {
  it('undoes and redoes in order, including text, erasure and clear', () => {
    let state: AnnotationHistory = { present: blank, past: [], future: [] };
    const first = { ...blank, strokes: [stroke('a')] };
    const second = {
      strokes: [stroke('a'), stroke('b')],
      textAnnotations: [{ id: 'text', x: 1, y: 2, text: 'formula', color: '#123456', fontSize: 14 }]
    };
    state = changeHistory(state, first);
    state = changeHistory(state, second);
    state = changeHistory(state, blank);
    state = changeHistory(state, 'undo');
    expect(state.present).toEqual(second);
    state = changeHistory(state, 'undo');
    expect(state.present).toEqual(first);
    state = changeHistory(state, 'redo');
    expect(state.present).toEqual(second);
    state = changeHistory(state, 'redo');
    expect(state.present).toEqual(blank);
  });
  it('preserves redo when the parent echoes an acknowledged undo', () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ initialData }: { initialData?: string }) => useAnnotationHistory(initialData, onChange),
      { initialProps: { initialData: undefined } }
    );
    act(() => result.current.apply(() => ({ ...blank, strokes: [stroke('a')] })));
    act(() => result.current.apply('undo'));
    rerender({ initialData: onChange.mock.calls.at(-1)![0] });
    expect(result.current.canRedo).toBe(true);
    act(() => result.current.apply('redo'));
    expect(result.current.strokes[0].id).toBe('a');
  });
  it('clears data and history when a drawn note changes to blank', () => {
    const { result, rerender } = renderHook(({ data }: { data?: string }) => useAnnotationHistory(data), {
      initialProps: { data: serializeInk([stroke('a')]) as string | undefined }
    });
    rerender({ data: undefined });
    expect(result.current.strokes).toEqual([]);
    expect(result.current.canUndo).toBe(false);
  });
});
