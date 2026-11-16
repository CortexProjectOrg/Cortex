import { ArrowRight, Edit3, Eye } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Note } from '../../lib/model';
import { InkCanvas } from '../InkCanvas';
import { MarkdownView } from '../MarkdownView';
import { SaveStatus } from '../ui/SaveStatus';
import { useMediaQuery } from '../ui/useMediaQuery';
import { useDrawerFocus } from '../ui/useDrawerFocus';

interface LectureScratchpadPanelProps {
  notesOpen: boolean;
  onClose: () => void;
  notesWidth: number;
  isResizingNotes: boolean;
  onResizeStart: (e: React.PointerEvent<HTMLDivElement>) => void;
  activeNote: Note;
  onUpdateActiveNote: (patch: Partial<Note>) => void;
}

export function LectureScratchpadPanel({
  notesOpen,
  onClose,
  notesWidth,
  isResizingNotes,
  onResizeStart,
  activeNote,
  onUpdateActiveNote
}: LectureScratchpadPanelProps) {
  const [previewNotes, setPreviewNotes] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const overlay = useMediaQuery('(max-width: 1200px)');
  useDrawerFocus(ref, notesOpen && overlay, onClose);

  if (!notesOpen) return null;

  return (
    <>
      <div className="sidebar-scrim notes-scrim" onClick={onClose} aria-hidden="true" />
      <aside
        ref={ref}
        className={`reading-notes ${isResizingNotes ? 'is-resizing' : ''}`}
        style={{ width: `${notesWidth}px`, maxWidth: '92vw', position: 'relative' }}
      >
        {/* Draggable resize handle along left edge */}
        <div
          className={`notes-resize-handle ${isResizingNotes ? 'is-resizing' : ''}`}
          onPointerDown={onResizeStart}
          title="Drag left/right to resize notes panel"
          aria-label="Resize notes panel"
        />
        <div className="notes-panel-heading">
          <h3>Notes</h3>
          <button
            type="button"
            className="icon-button"
            aria-label="Hide notes panel"
            title="Hide notes (Shortcut: N)"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            flex: 1,
            overflowY: 'auto'
          }}
        >
          {/* Tablet Stylus Canvas */}
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 655,
                letterSpacing: '0.8px',
                color: 'var(--muted)',
                marginBottom: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>Drawing</span>
              <span style={{ fontSize: '10px', color: 'var(--muted)' }}></span>
            </div>
            <InkCanvas
              key={activeNote.id}
              initialData={activeNote.inkData}
              onChange={(inkData) => onUpdateActiveNote({ inkData })}
              minHeight={290}
            />
          </div>

          {/* Typed Notes & Derivations */}
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 655,
                letterSpacing: '0.8px',
                color: 'var(--muted)',
                marginBottom: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>Notes</span>
              <button
                type="button"
                onClick={() => setPreviewNotes(!previewNotes)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}
                title="Toggle Math & Markdown Preview"
              >
                {previewNotes ? <Edit3 size={11} /> : <Eye size={11} />}
                <span>{previewNotes ? 'Edit' : 'Preview'}</span>
              </button>
            </div>

            {previewNotes ? (
              <div
                style={{
                  width: '100%',
                  minHeight: '115px',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--line)',
                  background: 'var(--surface)',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  overflowX: 'auto'
                }}
              >
                <MarkdownView
                  source={activeNote.body || '_No typed notes yet. Type LaTeX math using $...$._'}
                />
              </div>
            ) : (
              <textarea
                className="note-body"
                value={activeNote.body}
                onChange={(e) => onUpdateActiveNote({ body: e.target.value })}
                placeholder="Write a note…"
                aria-label="Lecture notes"
                rows={5}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--line)',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  lineHeight: '1.6'
                }}
              />
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 'auto',
              paddingTop: '10px',
              borderTop: '1px solid var(--line)'
            }}
          >
            <Link
              to={activeNote.id.startsWith('auto-') ? '/notes' : `/notes/${activeNote.id}`}
              className="text-link"
              style={{ fontSize: '11px' }}
            >
              Notebook <ArrowRight size={12} />
            </Link>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
              <SaveStatus />
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
