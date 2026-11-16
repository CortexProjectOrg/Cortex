import {
  Download,
  Edit3,
  Eraser,
  Eye,
  Highlighter,
  Maximize2,
  Minimize2,
  Pen,
  Redo2,
  Trash2,
  Undo2
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import type { InkStroke } from '../lib/ink';
import {
  ERASER_THRESHOLD,
  HIGHLIGHTER_COLORS,
  inkToSvgString,
  PEN_COLORS,
  renderStrokeToPath,
  parseInkData
} from '../lib/ink';
import { useAnnotationHistory } from './ink/useAnnotationHistory';

interface InkCanvasProps {
  initialData?: string;
  onChange?: (data: string) => void;
  readOnly?: boolean;
  className?: string;
  minHeight?: number;
}

const COLORS = PEN_COLORS;

export function InkCanvas({
  initialData,
  onChange,
  readOnly = false,
  className = '',
  minHeight = 360
}: InkCanvasProps) {
  const [activeTool, setActiveTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [activeColor, setActiveColor] = useState('#1e2822');
  const [activeSize, setActiveSize] = useState(3.5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<InkStroke | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState<'edit' | 'preview'>(readOnly ? 'preview' : 'edit');

  const containerRef = useRef<HTMLDivElement>(null);
  // The stored drawing has one coordinate system; resizing changes only its display size.
  const [dimensions] = useState(() => {
    const saved = parseInkData(initialData);
    return { width: saved?.width || 800, height: saved?.height || minHeight };
  });

  const { strokes, canUndo, canRedo, apply } = useAnnotationHistory(
    initialData,
    onChange,
    dimensions.width,
    dimensions.height
  );
  const activePointer = useRef<number | null>(null);
  const cancelPointer = () => {
    activePointer.current = null;
    setIsDrawing(false);
    setCurrentStroke(null);
  };
  // Pointer event handlers for Apple Pencil / Stylus
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (readOnly || mode === 'preview' || activePointer.current !== null || e.pointerType === 'touch') return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * dimensions.width) / rect.width;
    const y = ((e.clientY - rect.top) * dimensions.height) / rect.height;
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.5;

    activePointer.current = e.pointerId;
    svg.setPointerCapture(e.pointerId);
    setIsDrawing(true);

    if (activeTool === 'eraser') {
      // Stroke eraser: erase strokes that touch this point
      eraseAtPoint(x, y);
      return;
    }

    const stroke: InkStroke = {
      id: crypto.randomUUID(),
      points: [[x, y, pressure]],
      color: activeColor,
      size: activeTool === 'highlighter' ? 16 : activeSize,
      isHighlighter: activeTool === 'highlighter'
    };
    setCurrentStroke(stroke);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing || activePointer.current !== e.pointerId) return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * dimensions.width) / rect.width;
    const y = ((e.clientY - rect.top) * dimensions.height) / rect.height;
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.5;

    if (activeTool === 'eraser') {
      eraseAtPoint(x, y);
      return;
    }

    if (currentStroke) {
      setCurrentStroke((prev) =>
        prev
          ? {
              ...prev,
              points: [...prev.points, [x, y, pressure]]
            }
          : null
      );
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing || activePointer.current !== e.pointerId) return;
    activePointer.current = null;
    setIsDrawing(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (currentStroke) apply((doc) => ({ ...doc, strokes: [...doc.strokes, currentStroke] }));
    setCurrentStroke(null);
  };
  const eraseAtPoint = (x: number, y: number) =>
    apply((doc) => ({
      ...doc,
      strokes: doc.strokes.filter(
        (stroke) => !stroke.points.some(([sx, sy]) => Math.hypot(sx - x, sy - y) < ERASER_THRESHOLD)
      )
    }));
  const handleUndo = () => apply('undo');
  const handleRedo = () => apply('redo');
  const handleClear = () => {
    if (window.confirm('Clear this drawing?')) apply(() => ({ strokes: [], textAnnotations: [] }));
  };

  const downloadSvg = () => {
    const svgStr = inkToSvgString(strokes, dimensions.width, dimensions.height);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ink-notes-${new Date().toISOString().slice(0, 10)}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div
      ref={containerRef}
      className={`ink-canvas-wrapper ${isExpanded ? 'is-fullscreen' : ''} ${className}`}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line, #e2e4da)',
        borderRadius: '9px',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Ink Toolbar */}
      {!readOnly && (
        <div
          className="ink-tools"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            background: 'var(--sidebar, #f0f0e8)',
            borderBottom: '1px solid var(--line, #e2e4da)',
            gap: '8px',
            flexWrap: 'wrap'
          }}
        >
          {/* Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              className={`icon-button small ${activeTool === 'pen' ? 'is-active' : ''}`}
              title="Pen (Stylus / Mouse)"
              onClick={() => {
                setActiveTool('pen');
                setMode('edit');
              }}
              style={{
                background: activeTool === 'pen' ? 'var(--soft, #e9eee3)' : 'transparent',
                color: activeTool === 'pen' ? 'var(--accent, #3a5d49)' : 'inherit'
              }}
            >
              <Pen size={16} />
            </button>
            <button
              type="button"
              className={`icon-button small ${activeTool === 'highlighter' ? 'is-active' : ''}`}
              title="Highlighter"
              onClick={() => {
                setActiveTool('highlighter');
                setMode('edit');
              }}
              style={{
                background: activeTool === 'highlighter' ? 'var(--soft, #e9eee3)' : 'transparent',
                color: activeTool === 'highlighter' ? 'var(--accent, #3a5d49)' : 'inherit'
              }}
            >
              <Highlighter size={16} />
            </button>
            <button
              type="button"
              className={`icon-button small ${activeTool === 'eraser' ? 'is-active' : ''}`}
              title="Stroke Eraser"
              onClick={() => {
                setActiveTool('eraser');
                setMode('edit');
              }}
              style={{
                background: activeTool === 'eraser' ? 'var(--soft, #e9eee3)' : 'transparent',
                color: activeTool === 'eraser' ? 'var(--accent, #3a5d49)' : 'inherit'
              }}
            >
              <Eraser size={16} />
            </button>

            <span style={{ width: '1px', height: '18px', background: 'var(--line)', margin: '0 4px' }} />

            {/* Colors */}
            {activeTool === 'pen' &&
              COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setActiveColor(c.value)}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: c.value,
                    border: activeColor === c.value ? '2px solid #fff' : '1px solid #ccc',
                    boxShadow: activeColor === c.value ? '0 0 0 2px var(--accent)' : 'none',
                    margin: '0 2px'
                  }}
                />
              ))}

            {activeTool === 'highlighter' &&
              HIGHLIGHTER_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setActiveColor(c.value)}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: c.value,
                    border: activeColor === c.value ? '2px solid #fff' : '1px solid #ccc',
                    boxShadow: activeColor === c.value ? '0 0 0 2px var(--accent)' : 'none',
                    margin: '0 2px'
                  }}
                />
              ))}

            <span style={{ width: '1px', height: '18px', background: 'var(--line)', margin: '0 4px' }} />

            {/* Sizes */}
            {activeTool === 'pen' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {[2, 3.5, 6].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setActiveSize(sz)}
                    style={{
                      padding: '3px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      background: activeSize === sz ? 'var(--soft)' : 'transparent',
                      color: activeSize === sz ? 'var(--accent)' : 'var(--muted)',
                      border: '0'
                    }}
                  >
                    {sz === 2 ? 'Fine' : sz === 3.5 ? 'Medium' : 'Bold'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              className="icon-button small"
              title="Undo"
              disabled={!canUndo}
              onClick={handleUndo}
            >
              <Undo2 size={15} />
            </button>
            <button
              type="button"
              className="icon-button small"
              title="Redo"
              disabled={!canRedo}
              onClick={handleRedo}
            >
              <Redo2 size={15} />
            </button>
            <button
              type="button"
              className="icon-button small"
              title="Clear Canvas"
              disabled={strokes.length === 0}
              onClick={handleClear}
            >
              <Trash2 size={15} />
            </button>
            <button
              type="button"
              className="icon-button small"
              title="Export as SVG"
              disabled={strokes.length === 0}
              onClick={downloadSvg}
            >
              <Download size={15} />
            </button>
            <button
              type="button"
              className="icon-button small"
              title={mode === 'preview' ? 'Switch to Edit' : 'Switch to Clean Preview'}
              onClick={() => setMode(mode === 'preview' ? 'edit' : 'preview')}
            >
              {mode === 'preview' ? <Edit3 size={15} /> : <Eye size={15} />}
            </button>
            <button
              type="button"
              className="icon-button small"
              title={isExpanded ? 'Collapse' : 'Expand Canvas'}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          </div>
        </div>
      )}

      {/* SVG Canvas */}
      <svg
        className="ink-drawing-surface"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        width="100%"
        style={{
          display: 'block',
          touchAction: 'pan-y',
          cursor: readOnly || mode === 'preview' ? 'default' : activeTool === 'eraser' ? 'cell' : 'crosshair',
          background: 'radial-gradient(circle, #e2e4da 1px, transparent 1px) 0 0 / 24px 24px #fffefa'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={cancelPointer}
        onLostPointerCapture={cancelPointer}
      >
        {/* Rendered committed strokes */}
        {strokes.map((stroke) => {
          const d = renderStrokeToPath(stroke);
          const opacity = stroke.isHighlighter ? 0.35 : 1;
          return <path key={stroke.id} d={d} fill={stroke.color} opacity={opacity} />;
        })}

        {/* Live stroke currently being drawn */}
        {currentStroke && (
          <path
            d={renderStrokeToPath(currentStroke)}
            fill={currentStroke.color}
            opacity={currentStroke.isHighlighter ? 0.35 : 1}
          />
        )}
      </svg>

      {/* Empty State / Hint */}
      {strokes.length === 0 && !isDrawing && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            textAlign: 'center',
            color: '#a0a597',
            fontSize: '12px'
          }}
        >
          <Pen size={22} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.6 }} />
          <span>Draw with a pen or mouse</span>
        </div>
      )}
    </div>
  );
}
