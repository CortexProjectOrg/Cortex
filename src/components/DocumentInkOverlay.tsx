import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Pen,
  Highlighter,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Eye,
  EyeOff,
  MousePointer,
  PanelRightOpen,
  PanelRightClose,
  ShieldCheck
} from 'lucide-react';
import {
  type InkStroke,
  deserializeInk,
  serializeInk,
  renderStrokeToPath
} from '../lib/ink';

interface DocumentInkOverlayProps {
  initialData?: string;
  onChange?: (data: string) => void;
  containerRef: React.RefObject<HTMLElement | null>;
  onToggleSideNotes?: () => void;
  sideNotesOpen?: boolean;
}

type ToolMode = 'browse' | 'pen' | 'highlighter' | 'eraser';

const PEN_COLORS = [
  { label: 'Black Ink', value: '#1e2822' },
  { label: 'Blueprint Blue', value: '#1a5f8a' },
  { label: 'Crimson Red', value: '#a32a2a' },
  { label: 'Forest Green', value: '#2e6b3f' }
];

const HIGHLIGHTER_COLORS = [
  { label: 'Amber Yellow', value: '#e0b200' },
  { label: 'Sage Green', value: '#48a860' },
  { label: 'Cyan', value: '#0ea5e9' }
];

export function DocumentInkOverlay({
  initialData,
  onChange,
  containerRef,
  onToggleSideNotes,
  sideNotesOpen = false
}: DocumentInkOverlayProps) {
  const [strokes, setStrokes] = useState<InkStroke[]>(() => deserializeInk(initialData));
  const [redoStack, setRedoStack] = useState<InkStroke[][]>([]);
  const [tool, setTool] = useState<ToolMode>(() =>
    typeof window !== 'undefined' && window.innerWidth <= 768 ? 'browse' : 'pen'
  );
  const [penColor, setPenColor] = useState('#1e2822');
  const [highlighterColor, setHighlighterColor] = useState('#e0b200');
  const [penSize, setPenSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<InkStroke | null>(null);
  const [visible, setVisible] = useState(true);
  const [palmRejection, setPalmRejection] = useState(true);

  const [dimensions, setDimensions] = useState({ width: 850, height: 1600 });

  // Dynamically track the document container's width & full scroll height
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth || 850,
          height: Math.max(containerRef.current.scrollHeight, containerRef.current.offsetHeight, 1000)
        });
      }
    };

    updateDimensions();

    const observer = new ResizeObserver(updateDimensions);
    observer.observe(el);

    window.addEventListener('resize', updateDimensions);
    const timer = setTimeout(updateDimensions, 400);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(timer);
    };
  }, [containerRef]);

  // Sync external data changes
  useEffect(() => {
    setStrokes(deserializeInk(initialData));
    setRedoStack([]);
  }, [initialData]);

  const notifyChange = useCallback(
    (newStrokes: InkStroke[]) => {
      if (onChange) {
        const serialized = serializeInk(newStrokes, dimensions.width, dimensions.height);
        onChange(serialized);
      }
    },
    [onChange, dimensions]
  );

  // Stylus, Pen & Touch pointer handlers
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (tool === 'browse' || !visible) return;

    // Palm rejection: if palm rejection is on and user touches with a finger while on a touch/stylus screen,
    // let touch scroll the page natively!
    if (palmRejection && e.pointerType === 'touch') {
      return;
    }

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scaleX = rect.width ? dimensions.width / rect.width : 1;
    const scaleY = rect.height ? dimensions.height / rect.height : 1;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.5;

    svg.setPointerCapture(e.pointerId);
    setIsDrawing(true);

    if (tool === 'eraser') {
      eraseAt(x, y);
      return;
    }

    const isHigh = tool === 'highlighter';
    const stroke: InkStroke = {
      id: crypto.randomUUID(),
      points: [[x, y, pressure]],
      color: isHigh ? highlighterColor : penColor,
      size: isHigh ? 18 : penSize,
      isHighlighter: isHigh
    };

    setCurrentStroke(stroke);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing) return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scaleX = rect.width ? dimensions.width / rect.width : 1;
    const scaleY = rect.height ? dimensions.height / rect.height : 1;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.5;

    if (tool === 'eraser') {
      eraseAt(x, y);
      return;
    }

    if (currentStroke) {
      setCurrentStroke(prev =>
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
    if (!isDrawing) return;
    setIsDrawing(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (currentStroke && currentStroke.points.length > 1) {
      setStrokes(prev => {
        const next = [...prev, currentStroke];
        notifyChange(next);
        return next;
      });
      setRedoStack([]);
    }
    setCurrentStroke(null);
  };

  const eraseAt = (x: number, y: number) => {
    const threshold = 24;
    setStrokes(prev => {
      const next = prev.filter(stroke => {
        return !stroke.points.some(([sx, sy]) => Math.hypot(sx - x, sy - y) < threshold);
      });
      if (next.length !== prev.length) {
        notifyChange(next);
      }
      return next;
    });
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    setRedoStack(prev => [...prev, [last]]);
    const next = strokes.slice(0, -1);
    setStrokes(next);
    notifyChange(next);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const [toRestore, ...rest] = redoStack;
    setRedoStack(rest);
    const next = [...strokes, ...toRestore];
    setStrokes(next);
    notifyChange(next);
  };

  const handleClear = () => {
    if (strokes.length === 0) return;
    if (window.confirm('Clear all ink annotations on this lecture?')) {
      setRedoStack(prev => [...prev, strokes]);
      setStrokes([]);
      notifyChange([]);
    }
  };

  return (
    <>
      {/* FLOATING ANNOTATION TOOLBAR */}
      <div
        className="document-annotation-toolbar"
        style={{
          position: 'sticky',
          top: '16px',
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 254, 250, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--line, #e2e4da)',
          borderRadius: '30px',
          padding: '6px 14px',
          margin: '0 auto 20px',
          maxWidth: '720px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          gap: '8px',
          flexWrap: 'wrap'
        }}
      >
        {/* Tool Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <button
            type="button"
            className={`icon-button small ${tool === 'browse' ? 'is-active' : ''}`}
            title="Browse / Select Text Mode"
            onClick={() => setTool('browse')}
            style={{
              borderRadius: '20px',
              background: tool === 'browse' ? 'var(--soft)' : 'transparent',
              color: tool === 'browse' ? 'var(--accent)' : 'inherit'
            }}
          >
            <MousePointer size={15} />
          </button>

          <button
            type="button"
            className={`icon-button small ${tool === 'pen' ? 'is-active' : ''}`}
            title="Pen (Write & Draw directly over lecture text & formulas)"
            onClick={() => setTool('pen')}
            style={{
              borderRadius: '20px',
              background: tool === 'pen' ? 'var(--soft)' : 'transparent',
              color: tool === 'pen' ? 'var(--accent)' : 'inherit'
            }}
          >
            <Pen size={15} />
          </button>

          <button
            type="button"
            className={`icon-button small ${tool === 'highlighter' ? 'is-active' : ''}`}
            title="Highlighter (Highlight text & equations underneath)"
            onClick={() => setTool('highlighter')}
            style={{
              borderRadius: '20px',
              background: tool === 'highlighter' ? 'var(--soft)' : 'transparent',
              color: tool === 'highlighter' ? 'var(--accent)' : 'inherit'
            }}
          >
            <Highlighter size={15} />
          </button>

          <button
            type="button"
            className={`icon-button small ${tool === 'eraser' ? 'is-active' : ''}`}
            title="Stroke Eraser"
            onClick={() => setTool('eraser')}
            style={{
              borderRadius: '20px',
              background: tool === 'eraser' ? 'var(--soft)' : 'transparent',
              color: tool === 'eraser' ? 'var(--accent)' : 'inherit'
            }}
          >
            <Eraser size={15} />
          </button>

          <span
            style={{
              width: '1px',
              height: '18px',
              background: 'var(--line)',
              margin: '0 4px'
            }}
          />

          {/* Color Palettes */}
          {tool === 'pen' &&
            PEN_COLORS.map(c => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                onClick={() => setPenColor(c.value)}
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: c.value,
                  border: penColor === c.value ? '2px solid #fff' : '1px solid #ccc',
                  boxShadow: penColor === c.value ? '0 0 0 2px var(--accent)' : 'none',
                  margin: '0 2px',
                  cursor: 'pointer'
                }}
              />
            ))}

          {tool === 'highlighter' &&
            HIGHLIGHTER_COLORS.map(c => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                onClick={() => setHighlighterColor(c.value)}
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: c.value,
                  border: highlighterColor === c.value ? '2px solid #fff' : '1px solid #ccc',
                  boxShadow: highlighterColor === c.value ? '0 0 0 2px var(--accent)' : 'none',
                  margin: '0 2px',
                  cursor: 'pointer'
                }}
              />
            ))}

          {tool === 'pen' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '4px' }}>
              {[2, 3.5, 6].map(sz => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setPenSize(sz)}
                  style={{
                    padding: '2px 5px',
                    borderRadius: '4px',
                    fontSize: '9px',
                    background: penSize === sz ? 'var(--soft)' : 'transparent',
                    color: penSize === sz ? 'var(--accent)' : 'var(--muted)',
                    border: '0',
                    cursor: 'pointer'
                  }}
                >
                  {sz === 2 ? 'Fine' : sz === 3.5 ? 'Mid' : 'Thick'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Palm Rejection Toggle */}
          <button
            type="button"
            className={`button small ${palmRejection ? 'soft' : 'secondary'}`}
            style={{
              padding: '2px 8px',
              minHeight: '26px',
              fontSize: '10px',
              borderRadius: '14px',
              gap: '4px'
            }}
            title={
              palmRejection
                ? 'Palm Rejection ON: Stylus/pen draws, finger touch scrolls'
                : 'Palm Rejection OFF: Finger touch also draws'
            }
            onClick={() => setPalmRejection(!palmRejection)}
          >
            <ShieldCheck size={12} style={{ color: palmRejection ? 'var(--accent)' : 'var(--muted)' }} />
            <span>{palmRejection ? 'Stylus Only' : 'Touch Draw'}</span>
          </button>

          <button
            type="button"
            className="icon-button small"
            title="Undo stroke"
            disabled={strokes.length === 0}
            onClick={handleUndo}
          >
            <Undo2 size={14} />
          </button>

          <button
            type="button"
            className="icon-button small"
            title="Redo stroke"
            disabled={redoStack.length === 0}
            onClick={handleRedo}
          >
            <Redo2 size={14} />
          </button>

          <button
            type="button"
            className="icon-button small"
            title={visible ? 'Hide annotations' : 'Show annotations'}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>

          {strokes.length > 0 && (
            <button
              type="button"
              className="icon-button small"
              title="Clear all page annotations"
              onClick={handleClear}
            >
              <Trash2 size={14} />
            </button>
          )}

          {onToggleSideNotes && (
            <>
              <span
                style={{
                  width: '1px',
                  height: '18px',
                  background: 'var(--line)',
                  margin: '0 4px'
                }}
              />
              <button
                type="button"
                className="button small secondary"
                onClick={onToggleSideNotes}
                style={{
                  padding: '4px 10px',
                  minHeight: '28px',
                  fontSize: '11px',
                  borderRadius: '16px'
                }}
              >
                {sideNotesOpen ? <PanelRightClose size={13} /> : <PanelRightOpen size={13} />}
                <span>{sideNotesOpen ? 'Hide Scratchpad' : 'Open Scratchpad'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* OVERLAY SVG DRAWING SURFACE LAYERED DIRECTLY OVER THE LECTURE ARTICLE */}
      {visible && (
        <svg
          className="document-ink-overlay-svg"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 10,
            pointerEvents: tool === 'browse' ? 'none' : 'auto',
            touchAction: palmRejection ? 'pan-y' : (tool === 'browse' ? 'auto' : 'none'),
            cursor:
              tool === 'browse'
                ? 'default'
                : tool === 'eraser'
                  ? 'cell'
                  : 'crosshair'
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Render committed ink strokes directly on top of the text */}
          {strokes.map(stroke => {
            const d = renderStrokeToPath(stroke);
            const isHigh = stroke.isHighlighter;
            return (
              <path
                key={stroke.id}
                d={d}
                fill={stroke.color}
                opacity={isHigh ? 0.38 : 0.95}
                style={{
                  mixBlendMode: isHigh ? 'multiply' : 'normal'
                }}
              />
            );
          })}

          {/* Render active live stroke */}
          {currentStroke && (
            <path
              d={renderStrokeToPath(currentStroke)}
              fill={currentStroke.color}
              opacity={currentStroke.isHighlighter ? 0.38 : 0.95}
              style={{
                mixBlendMode: currentStroke.isHighlighter ? 'multiply' : 'normal'
              }}
            />
          )}
        </svg>
      )}
    </>
  );
}
