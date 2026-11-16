import { Check, Edit3, MessageSquareQuote, Trash2, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import type { TextAnnotation } from '../../lib/ink';

interface TextAnnotationLayerProps {
  annotations: TextAnnotation[];
  tool: string;
  onAddAnnotation: (text: string, x: number, y: number, color?: string, fontSize?: number) => void;
  onUpdateAnnotation: (id: string, patch: Partial<TextAnnotation>) => void;
  onDeleteAnnotation: (id: string) => void;
  activeColor: string;
  sheetWidth: number;
}

interface NewDraftState {
  x: number;
  y: number;
  text: string;
}

export function TextAnnotationLayer({
  annotations,
  tool,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  activeColor,
  sheetWidth
}: TextAnnotationLayerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [newDraft, setNewDraft] = useState<NewDraftState | null>(null);
  const draftInputRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (newDraft && draftInputRef.current) {
      draftInputRef.current.focus();
    }
  }, [newDraft]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tool !== 'text') return;
    if (editingId) return;

    // Check if clicked directly on container (not an existing note)
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = rect.width ? sheetWidth / rect.width : 1;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleX);

    // Keep draft within reasonable sheet bounds
    const clampedX = Math.max(20, Math.min(x, sheetWidth - 220));
    setNewDraft({ x: clampedX, y, text: '' });
  };

  const handleSaveDraft = () => {
    if (!newDraft) return;
    if (newDraft.text.trim()) {
      onAddAnnotation(newDraft.text, newDraft.x, newDraft.y, activeColor, 14);
    }
    setNewDraft(null);
  };

  const handleCancelDraft = () => {
    setNewDraft(null);
  };

  const startEdit = (ann: TextAnnotation) => {
    setEditingId(ann.id);
    setEditText(ann.text);
  };

  const handleSaveEdit = (id: string) => {
    if (editText.trim()) {
      onUpdateAnnotation(id, { text: editText.trim() });
    }
    setEditingId(null);
    setEditText('');
  };

  return (
    <div
      className="text-annotation-layer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: tool === 'text' ? 'auto' : 'none',
        zIndex: 15
      }}
      onClick={handleContainerClick}
    >
      {/* Existing saved text annotations */}
      {annotations.map((ann) => {
        const isEditing = editingId === ann.id;
        const isMargin = ann.x >= 660;

        if (isEditing) {
          return (
            <div
              key={ann.id}
              className="text-annotation-editor active-edit"
              style={{
                position: 'absolute',
                left: `${ann.x}px`,
                top: `${ann.y}px`,
                width: isMargin ? '210px' : '280px',
                background: 'var(--surface)',
                border: '1.5px solid var(--accent, #3a5d49)',
                borderRadius: '8px',
                padding: '8px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.16)',
                pointerEvents: 'auto',
                zIndex: 25
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <textarea
                ref={editInputRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleSaveEdit(ann.id);
                  } else if (e.key === 'Escape') {
                    setEditingId(null);
                  }
                }}
                style={{
                  width: '100%',
                  minHeight: '60px',
                  fontFamily: 'var(--serif, Georgia, serif)',
                  fontSize: `${ann.fontSize || 14}px`,
                  color: ann.color || '#1e2822',
                  border: '1px solid var(--line, #e2e4da)',
                  borderRadius: '4px',
                  padding: '6px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="button small secondary"
                  style={{ padding: '3px 8px', minHeight: '24px', fontSize: '11px' }}
                  onClick={() => setEditingId(null)}
                >
                  <X size={12} /> Cancel
                </button>
                <button
                  type="button"
                  className="button small primary"
                  style={{ padding: '3px 8px', minHeight: '24px', fontSize: '11px' }}
                  onClick={() => handleSaveEdit(ann.id)}
                >
                  <Check size={12} /> Save
                </button>
              </div>
            </div>
          );
        }

        return (
          <div
            key={ann.id}
            className="text-annotation-card group"
            style={{
              position: 'absolute',
              left: `${ann.x}px`,
              top: `${ann.y}px`,
              maxWidth: isMargin ? '220px' : '320px',
              background: 'rgba(255, 254, 250, 0.96)',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${isMargin ? 'var(--line, #e2e4da)' : '#cbd5c0'}`,
              borderLeft: `3px solid ${ann.color || 'var(--accent, #3a5d49)'}`,
              borderRadius: '6px',
              padding: '6px 10px',
              boxShadow: '0 3px 12px rgba(0, 0, 0, 0.07)',
              pointerEvents: 'auto',
              cursor: 'pointer',
              transition: 'transform 0.15s, box-shadow 0.15s',
              zIndex: 16
            }}
            onClick={(e) => {
              e.stopPropagation();
              startEdit(ann);
            }}
            title="Click to edit text note"
          >
            <div
              style={{
                fontFamily: 'var(--serif, Georgia, serif)',
                fontSize: `${ann.fontSize || 14}px`,
                lineHeight: '1.5',
                color: ann.color || 'var(--ink, #1e2822)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {ann.text}
            </div>

            {/* Quick action bar */}
            <div
              className="text-annotation-actions"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                marginTop: '4px',
                paddingTop: '3px',
                borderTop: '1px dotted var(--line, #e2e4da)',
                fontSize: '9px',
                color: 'var(--muted, #737a6f)'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <MessageSquareQuote size={10} /> {isMargin ? 'Margin Note' : 'Text Gloss'}
              </span>
              <div style={{ display: 'flex', gap: '2px' }}>
                <button
                  type="button"
                  className="icon-button small"
                  style={{ width: '20px', height: '20px', padding: 0 }}
                  title="Edit note"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEdit(ann);
                  }}
                >
                  <Edit3 size={11} />
                </button>
                <button
                  type="button"
                  className="icon-button small"
                  style={{ width: '20px', height: '20px', padding: 0 }}
                  title="Delete note"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAnnotation(ann.id);
                  }}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* New draft editor when clicking with text tool */}
      {newDraft && (
        <div
          className="text-annotation-editor active-new"
          style={{
            position: 'absolute',
            left: `${newDraft.x}px`,
            top: `${newDraft.y}px`,
            width: newDraft.x >= 660 ? '210px' : '280px',
            background: 'var(--surface)',
            border: '2px solid var(--accent, #3a5d49)',
            borderRadius: '8px',
            padding: '10px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            pointerEvents: 'auto',
            zIndex: 30
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.8px',
              color: 'var(--accent, #3a5d49)',
              marginBottom: '6px',
              textTransform: 'uppercase'
            }}
          >
            {newDraft.x >= 660 ? 'Add Margin Note' : 'Add Page Note'}
          </div>
          <textarea
            ref={draftInputRef}
            placeholder={
              newDraft.x >= 660
                ? 'Type margin note, derivation, or formula...'
                : 'Type note over paragraph...'
            }
            value={newDraft.text}
            onChange={(e) => setNewDraft({ ...newDraft, text: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSaveDraft();
              } else if (e.key === 'Escape') {
                handleCancelDraft();
              }
            }}
            style={{
              width: '100%',
              minHeight: '65px',
              fontFamily: 'var(--serif, Georgia, serif)',
              fontSize: '14px',
              color: activeColor,
              border: '1px solid var(--line, #e2e4da)',
              borderRadius: '5px',
              padding: '6px 8px',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '6px'
            }}
          >
            <span style={{ fontSize: '9px', color: 'var(--muted)' }}>Ctrl+Enter to save</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className="button small secondary"
                style={{ padding: '3px 8px', minHeight: '24px', fontSize: '11px' }}
                onClick={handleCancelDraft}
              >
                <X size={12} /> Cancel
              </button>
              <button
                type="button"
                className="button small primary"
                style={{ padding: '3px 10px', minHeight: '24px', fontSize: '11px' }}
                onClick={handleSaveDraft}
              >
                <Check size={12} /> Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
