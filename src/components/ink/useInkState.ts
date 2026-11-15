import { useState, useEffect, useCallback } from 'react';
import {
  type InkStroke,
  type TextAnnotation,
  type InkVisualizationMeta,
  CANONICAL_PAGE_GEOMETRY,
  ERASER_THRESHOLD,
  deserializeInkPayload,
  serializeInk
} from '../../lib/ink';

export type ToolMode = 'browse' | 'pen' | 'highlighter' | 'text' | 'eraser';

interface UseInkStateOptions {
  initialData?: string;
  onChange?: (serialized: string) => void;
  canonicalWidth?: number;
  height?: number;
  visualization?: InkVisualizationMeta;
}

export function useInkState({
  initialData,
  onChange,
  canonicalWidth = CANONICAL_PAGE_GEOMETRY.canonicalWidth,
  height = 1800,
  visualization = CANONICAL_PAGE_GEOMETRY
}: UseInkStateOptions = {}) {
  const [strokes, setStrokes] = useState<InkStroke[]>(() => {
    return deserializeInkPayload(initialData).strokes;
  });

  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>(() => {
    return deserializeInkPayload(initialData).textAnnotations;
  });

  const [redoStack, setRedoStack] = useState<InkStroke[][]>([]);
  const [tool, setTool] = useState<ToolMode>('browse');
  const [penColor, setPenColor] = useState('#1e2822');
  const [highlighterColor, setHighlighterColor] = useState('#e0b200');
  const [penSize, setPenSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<InkStroke | null>(null);
  const [visible, setVisible] = useState(true);
  const [palmRejection, setPalmRejection] = useState(true);

  // Sync external changes
  useEffect(() => {
    const payload = deserializeInkPayload(initialData);
    setStrokes(payload.strokes);
    setTextAnnotations(payload.textAnnotations);
    setRedoStack([]);
  }, [initialData]);

  const notifyChange = useCallback(
    (newStrokes: InkStroke[], newTexts: TextAnnotation[]) => {
      if (onChange) {
        const serialized = serializeInk(
          newStrokes,
          canonicalWidth,
          height,
          visualization,
          newTexts
        );
        onChange(serialized);
      }
    },
    [onChange, canonicalWidth, height, visualization]
  );

  const addStroke = useCallback(
    (stroke: InkStroke) => {
      setStrokes(prev => {
        const next = [...prev, stroke];
        notifyChange(next, textAnnotations);
        return next;
      });
      setRedoStack([]);
    },
    [notifyChange, textAnnotations]
  );

  const eraseAt = useCallback(
    (x: number, y: number, threshold = ERASER_THRESHOLD) => {
      setStrokes(prev => {
        const next = prev.filter(stroke => {
          return !stroke.points.some(([sx, sy]) => Math.hypot(sx - x, sy - y) < threshold);
        });
        if (next.length !== prev.length) {
          notifyChange(next, textAnnotations);
        }
        return next;
      });
    },
    [notifyChange, textAnnotations]
  );

  const handleUndo = useCallback(() => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    setRedoStack(prev => [...prev, [last]]);
    const next = strokes.slice(0, -1);
    setStrokes(next);
    notifyChange(next, textAnnotations);
  }, [strokes, notifyChange, textAnnotations]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const [toRestore, ...rest] = redoStack;
    setRedoStack(rest);
    const next = [...strokes, ...toRestore];
    setStrokes(next);
    notifyChange(next, textAnnotations);
  }, [redoStack, strokes, notifyChange, textAnnotations]);

  const handleClear = useCallback(() => {
    if (strokes.length === 0 && textAnnotations.length === 0) return;
    if (window.confirm('Clear all ink strokes and text notes on this lecture?')) {
      setRedoStack(prev => [...prev, strokes]);
      setStrokes([]);
      setTextAnnotations([]);
      notifyChange([], []);
    }
  }, [strokes, textAnnotations, notifyChange]);

  const addTextAnnotation = useCallback(
    (text: string, x: number, y: number, color = penColor, fontSize = 14) => {
      if (!text.trim()) return;
      const newAnn: TextAnnotation = {
        id: crypto.randomUUID(),
        x,
        y,
        text: text.trim(),
        color,
        fontSize
      };
      setTextAnnotations(prev => {
        const next = [...prev, newAnn];
        notifyChange(strokes, next);
        return next;
      });
    },
    [penColor, notifyChange, strokes]
  );

  const updateTextAnnotation = useCallback(
    (id: string, patch: Partial<TextAnnotation>) => {
      setTextAnnotations(prev => {
        const next = prev.map(ann => (ann.id === id ? { ...ann, ...patch } : ann));
        notifyChange(strokes, next);
        return next;
      });
    },
    [notifyChange, strokes]
  );

  const deleteTextAnnotation = useCallback(
    (id: string) => {
      setTextAnnotations(prev => {
        const next = prev.filter(ann => ann.id !== id);
        notifyChange(strokes, next);
        return next;
      });
    },
    [notifyChange, strokes]
  );

  return {
    strokes,
    setStrokes,
    textAnnotations,
    setTextAnnotations,
    redoStack,
    tool,
    setTool,
    penColor,
    setPenColor,
    highlighterColor,
    setHighlighterColor,
    penSize,
    setPenSize,
    isDrawing,
    setIsDrawing,
    currentStroke,
    setCurrentStroke,
    visible,
    setVisible,
    palmRejection,
    setPalmRejection,
    addStroke,
    eraseAt,
    handleUndo,
    handleRedo,
    handleClear,
    addTextAnnotation,
    updateTextAnnotation,
    deleteTextAnnotation
  };
}
