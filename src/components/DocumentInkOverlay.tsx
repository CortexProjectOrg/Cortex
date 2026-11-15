import React, { useRef, useState, useEffect } from 'react';
import {
  type InkStroke,
  renderStrokeToPath,
  CANONICAL_PAGE_GEOMETRY
} from '../lib/ink';
import { useInkState } from './ink/useInkState';
import { AnnotationToolbar } from './ink/AnnotationToolbar';
import { TextAnnotationLayer } from './ink/TextAnnotationLayer';
import { CanvasScrollControls } from './ink/CanvasScrollControls';

interface DocumentInkOverlayProps {
  initialData?: string;
  onChange?: (data: string) => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  onToggleSideNotes?: () => void;
  sideNotesOpen?: boolean;
  sideNotesWidth?: number;
  children?: React.ReactNode;
}

export function DocumentInkOverlay({
  initialData,
  onChange,
  containerRef,
  onToggleSideNotes,
  sideNotesOpen = false,
  sideNotesWidth = 450,
  children
}: DocumentInkOverlayProps) {
  const internalSheetRef = useRef<HTMLDivElement>(null);
  const activeSheetRef = containerRef || internalSheetRef;

  const [dimensions, setDimensions] = useState({
    width: CANONICAL_PAGE_GEOMETRY.canonicalWidth,
    height: 1800
  });

  const {
    strokes,
    textAnnotations,
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
  } = useInkState({
    initialData,
    onChange,
    canonicalWidth: CANONICAL_PAGE_GEOMETRY.canonicalWidth,
    height: dimensions.height,
    visualization: CANONICAL_PAGE_GEOMETRY
  });

  // Track sheet height while preserving invariant canonical 960px width
  useEffect(() => {
    const el = activeSheetRef.current;
    if (!el) return;

    const updateDimensions = () => {
      if (activeSheetRef.current) {
        setDimensions({
          width: CANONICAL_PAGE_GEOMETRY.canonicalWidth,
          height: Math.max(activeSheetRef.current.scrollHeight, activeSheetRef.current.offsetHeight, 1200)
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
  }, [activeSheetRef]);

  // FREEZE PAGE SCROLLING IN DRAWING MODE:
  // When in Pen / Highlighter / Text / Eraser mode, prevent touchpad two-finger scroll and touchmove gestures
  // so the page stays completely stable and precise while drawing.
  useEffect(() => {
    if (tool === 'browse') return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [tool]);

  const handleScrollStep = (direction: 'up' | 'down') => {
    const step = Math.round(window.innerHeight * 0.65);
    window.scrollBy({
      top: direction === 'up' ? -step : step,
      behavior: 'smooth'
    });
  };

  // Stylus, Pen & Touch pointer handlers mapped to canonical 960px coordinate space
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (tool === 'browse' || tool === 'text' || !visible) return;

    if (palmRejection && e.pointerType === 'touch' && (e.nativeEvent as any).pointerType === 'touch') {
      return;
    }

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scaleX = rect.width ? CANONICAL_PAGE_GEOMETRY.canonicalWidth / rect.width : 1;
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
    const scaleX = rect.width ? CANONICAL_PAGE_GEOMETRY.canonicalWidth / rect.width : 1;
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
      addStroke(currentStroke);
    }
    setCurrentStroke(null);
  };

  const renderSvgOverlay = () => {
    if (!visible) return null;
    return (
      <svg
        className="document-ink-overlay-svg"
        viewBox={`0 0 ${CANONICAL_PAGE_GEOMETRY.canonicalWidth} ${dimensions.height}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 10,
          pointerEvents: tool === 'browse' || tool === 'text' ? 'none' : 'auto',
          touchAction: tool === 'browse' || tool === 'text' ? 'auto' : 'none',
          cursor:
            tool === 'browse' || tool === 'text'
              ? 'default'
              : tool === 'eraser'
                ? 'cell'
                : 'crosshair'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
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
    );
  };

  if (children) {
    return (
      <div className="document-ink-container">
        {/* Sticky HUD decoupled from reading sheet */}
        <div className="document-annotation-hud">
          <AnnotationToolbar
            tool={tool}
            setTool={setTool}
            penColor={penColor}
            setPenColor={setPenColor}
            highlighterColor={highlighterColor}
            setHighlighterColor={setHighlighterColor}
            penSize={penSize}
            setPenSize={setPenSize}
            palmRejection={palmRejection}
            setPalmRejection={setPalmRejection}
            visible={visible}
            setVisible={setVisible}
            canUndo={strokes.length > 0}
            onUndo={handleUndo}
            canRedo={redoStack.length > 0}
            onRedo={handleRedo}
            hasContent={strokes.length > 0 || textAnnotations.length > 0}
            onClear={handleClear}
            onToggleSideNotes={onToggleSideNotes}
            sideNotesOpen={sideNotesOpen}
          />
        </div>

        {/* Canonical Academic Reading Sheet container: preserves 960px geometry and margin notes */}
        <div className="reading-sheet-scroll-container">
          <div className="reading-sheet" ref={activeSheetRef}>
            {children}

            {/* Typed Text Annotations Layer (Page & Margin Notes) */}
            {visible && (
              <TextAnnotationLayer
                annotations={textAnnotations}
                tool={tool}
                onAddAnnotation={addTextAnnotation}
                onUpdateAnnotation={updateTextAnnotation}
                onDeleteAnnotation={deleteTextAnnotation}
                activeColor={penColor}
                sheetWidth={CANONICAL_PAGE_GEOMETRY.canonicalWidth}
              />
            )}

            {/* Vector Ink Strokes SVG Layer */}
            {renderSvgOverlay()}
          </div>
        </div>

        {tool !== 'browse' && (
          <CanvasScrollControls
            sideNotesOpen={sideNotesOpen}
            sideNotesWidth={sideNotesWidth}
            onScrollStep={handleScrollStep}
          />
        )}
      </div>
    );
  }

  // Standalone fallback
  return (
    <>
      <div className="document-annotation-hud">
        <AnnotationToolbar
          tool={tool}
          setTool={setTool}
          penColor={penColor}
          setPenColor={setPenColor}
          highlighterColor={highlighterColor}
          setHighlighterColor={setHighlighterColor}
          penSize={penSize}
          setPenSize={setPenSize}
          palmRejection={palmRejection}
          setPalmRejection={setPalmRejection}
          visible={visible}
          setVisible={setVisible}
          canUndo={strokes.length > 0}
          onUndo={handleUndo}
          canRedo={redoStack.length > 0}
          onRedo={handleRedo}
          hasContent={strokes.length > 0 || textAnnotations.length > 0}
          onClear={handleClear}
          onToggleSideNotes={onToggleSideNotes}
          sideNotesOpen={sideNotesOpen}
        />
      </div>
      {renderSvgOverlay()}
      {tool !== 'browse' && (
        <CanvasScrollControls
          sideNotesOpen={sideNotesOpen}
          sideNotesWidth={sideNotesWidth}
          onScrollStep={handleScrollStep}
        />
      )}
    </>
  );
}
