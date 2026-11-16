import { useCallback, useState } from 'react';
import {
  type InkStroke,
  type InkVisualizationMeta,
  type TextAnnotation,
  CANONICAL_PAGE_GEOMETRY,
  ERASER_THRESHOLD
} from '../../lib/ink';
import { useAnnotationHistory } from './useAnnotationHistory';
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
  canonicalWidth = 960,
  height = 1800,
  visualization = CANONICAL_PAGE_GEOMETRY
}: UseInkStateOptions = {}) {
  const history = useAnnotationHistory(initialData, onChange, canonicalWidth, height, visualization);
  const { apply } = history;
  const [tool, setTool] = useState<ToolMode>('browse');
  const [penColor, setPenColor] = useState('#1e2822');
  const [highlighterColor, setHighlighterColor] = useState('#e0b200');
  const [penSize, setPenSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<InkStroke | null>(null);
  const [visible, setVisible] = useState(true);
  const [palmRejection, setPalmRejection] = useState(true);
  const addStroke = useCallback(
    (stroke: InkStroke) => apply((doc) => ({ ...doc, strokes: [...doc.strokes, stroke] })),
    [apply]
  );
  const eraseAt = useCallback(
    (x: number, y: number, threshold = ERASER_THRESHOLD) =>
      apply((doc) => ({
        ...doc,
        strokes: doc.strokes.filter(
          (stroke) => !stroke.points.some(([sx, sy]) => Math.hypot(sx - x, sy - y) < threshold)
        )
      })),
    [apply]
  );
  const addTextAnnotation = useCallback(
    (text: string, x: number, y: number, color = penColor, fontSize = 14) => {
      if (text.trim())
        apply((doc) => ({
          ...doc,
          textAnnotations: [
            ...doc.textAnnotations,
            { id: crypto.randomUUID(), x, y, text: text.trim(), color, fontSize }
          ]
        }));
    },
    [apply, penColor]
  );
  const updateTextAnnotation = useCallback(
    (id: string, patch: Partial<TextAnnotation>) =>
      apply((doc) => ({
        ...doc,
        textAnnotations: doc.textAnnotations.map((ann) => (ann.id === id ? { ...ann, ...patch } : ann))
      })),
    [apply]
  );
  const deleteTextAnnotation = useCallback(
    (id: string) =>
      apply((doc) => ({ ...doc, textAnnotations: doc.textAnnotations.filter((ann) => ann.id !== id) })),
    [apply]
  );
  return {
    ...history,
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
    addTextAnnotation,
    updateTextAnnotation,
    deleteTextAnnotation,
    handleUndo: () => apply('undo'),
    handleRedo: () => apply('redo'),
    handleClear: () => {
      if (window.confirm('Clear this drawing?')) apply(() => ({ strokes: [], textAnnotations: [] }));
    }
  };
}
