import {
  Eraser,
  Eye,
  EyeOff,
  Highlighter,
  Lock,
  MousePointer,
  PanelRightClose,
  PanelRightOpen,
  Pen,
  Redo2,
  ShieldCheck,
  Trash2,
  Type,
  Undo2
} from 'lucide-react';
import { HIGHLIGHTER_COLORS, PEN_COLORS } from '../../lib/ink';
import type { ToolMode } from './useInkState';

interface AnnotationToolbarProps {
  tool: ToolMode;
  setTool: (tool: ToolMode) => void;
  penColor: string;
  setPenColor: (color: string) => void;
  highlighterColor: string;
  setHighlighterColor: (color: string) => void;
  penSize: number;
  setPenSize: (size: number) => void;
  palmRejection: boolean;
  setPalmRejection: (val: boolean) => void;
  visible: boolean;
  setVisible: (val: boolean) => void;
  canUndo: boolean;
  onUndo: () => void;
  canRedo: boolean;
  onRedo: () => void;
  hasContent: boolean;
  onClear: () => void;
  onToggleSideNotes?: () => void;
  sideNotesOpen?: boolean;
}

export function AnnotationToolbar({
  tool,
  setTool,
  penColor,
  setPenColor,
  highlighterColor,
  setHighlighterColor,
  penSize,
  setPenSize,
  palmRejection,
  setPalmRejection,
  visible,
  setVisible,
  canUndo,
  onUndo,
  canRedo,
  onRedo,
  hasContent,
  onClear,
  onToggleSideNotes,
  sideNotesOpen = false
}: AnnotationToolbarProps) {
  return (
    <div
      className="document-annotation-toolbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255, 254, 250, 0.96)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--line, #e2e4da)',
        borderRadius: '30px',
        padding: '6px 14px',
        maxWidth: '780px',
        boxShadow: '0 6px 28px rgba(0, 0, 0, 0.12)',
        gap: '8px',
        flexWrap: 'wrap'
      }}
    >
      {/* Tool Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        <button
          type="button"
          className={`icon-button small ${tool === 'browse' ? 'is-active' : ''}`}
          title="Browse"
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
          title="Pen"
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
          title="Highlighter"
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
          className={`icon-button small ${tool === 'text' ? 'is-active' : ''}`}
          title="Text note"
          onClick={() => setTool('text')}
          style={{
            borderRadius: '20px',
            background: tool === 'text' ? 'var(--soft)' : 'transparent',
            color: tool === 'text' ? 'var(--accent)' : 'inherit'
          }}
        >
          <Type size={15} />
        </button>

        <button
          type="button"
          className={`icon-button small ${tool === 'eraser' ? 'is-active' : ''}`}
          title="Erase stroke"
          onClick={() => setTool('eraser')}
          style={{
            borderRadius: '20px',
            background: tool === 'eraser' ? 'var(--soft)' : 'transparent',
            color: tool === 'eraser' ? 'var(--accent)' : 'inherit'
          }}
        >
          <Eraser size={15} />
        </button>

        {tool !== 'browse' && (
          <span
            style={{
              fontSize: '9px',
              color: 'var(--accent)',
              background: 'var(--soft)',
              padding: '2px 7px',
              borderRadius: '10px',
              fontWeight: 650,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              marginLeft: '4px'
            }}
            title="Page scrolling is frozen so you can draw precisely. Use the arrows in the lower right to scroll."
          >
            <Lock size={10} /> Scroll Frozen
          </span>
        )}

        <span
          style={{
            width: '1px',
            height: '18px',
            background: 'var(--line)',
            margin: '0 4px'
          }}
        />

        {/* Color Palettes */}
        {(tool === 'pen' || tool === 'text') &&
          PEN_COLORS.map((c) => (
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
          HIGHLIGHTER_COLORS.map((c) => (
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
            {[2, 3.5, 6].map((sz) => (
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
          disabled={!canUndo}
          onClick={onUndo}
        >
          <Undo2 size={14} />
        </button>

        <button
          type="button"
          className="icon-button small"
          title="Redo stroke"
          disabled={!canRedo}
          onClick={onRedo}
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

        {hasContent && (
          <button
            type="button"
            className="icon-button small"
            title="Clear all page annotations"
            onClick={onClear}
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
              <span>{sideNotesOpen ? 'Hide Scratchpad' : 'Open notes'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
