import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  CANONICAL_PAGE_GEOMETRY,
  deserializeInkPayload,
  serializeInk,
  type InkStroke,
  type InkVisualizationMeta,
  type TextAnnotation
} from '../../lib/ink';

export type AnnotationDocument = { strokes: InkStroke[]; textAnnotations: TextAnnotation[] };
export type AnnotationHistory = {
  present: AnnotationDocument;
  past: AnnotationDocument[];
  future: AnnotationDocument[];
};
export function changeHistory(
  history: AnnotationHistory,
  action: 'undo' | 'redo' | AnnotationDocument
): AnnotationHistory {
  if (action === 'undo') {
    if (!history.past.length) return history;
    return {
      present: history.past.at(-1)!,
      past: history.past.slice(0, -1),
      future: [...history.future, history.present]
    };
  }
  if (action === 'redo') {
    if (!history.future.length) return history;
    return {
      present: history.future.at(-1)!,
      past: [...history.past, history.present],
      future: history.future.slice(0, -1)
    };
  }
  if (JSON.stringify(action) === JSON.stringify(history.present)) return history;
  return { present: action, past: [...history.past.slice(-49), history.present], future: [] };
}
export function useAnnotationHistory(
  initialData?: string,
  onChange?: (data: string) => void,
  width = 960,
  height = 1600,
  visualization: InkVisualizationMeta = CANONICAL_PAGE_GEOMETRY
) {
  const [history, setHistory] = useState<AnnotationHistory>(() => ({
    present: deserializeInkPayload(initialData),
    past: [],
    future: []
  }));
  const current = useRef(history);
  const emitted = useRef(initialData);
  useLayoutEffect(() => {
    if (initialData === emitted.current) return;
    emitted.current = initialData;
    current.current = { present: deserializeInkPayload(initialData), past: [], future: [] };
    setHistory(current.current);
  }, [initialData]);
  const apply = useCallback(
    (action: 'undo' | 'redo' | ((document: AnnotationDocument) => AnnotationDocument)) => {
      const next = changeHistory(
        current.current,
        typeof action === 'function' ? action(current.current.present) : action
      );
      if (next === current.current) return;
      current.current = next;
      setHistory(next);
      emitted.current = serializeInk(
        next.present.strokes,
        width,
        height,
        visualization,
        next.present.textAnnotations
      );
      onChange?.(emitted.current);
    },
    [onChange, width, height, visualization]
  );
  return { ...history.present, canUndo: history.past.length > 0, canRedo: history.future.length > 0, apply };
}
