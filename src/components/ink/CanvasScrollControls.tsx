import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface CanvasScrollControlsProps {
  sideNotesOpen?: boolean;
  sideNotesWidth?: number;
  onScrollStep: (direction: 'up' | 'down') => void;
}

export function CanvasScrollControls({
  sideNotesOpen = false,
  sideNotesWidth = 450,
  onScrollStep
}: CanvasScrollControlsProps) {
  return (
    <div
      className="canvas-scroll-controls"
      style={{
        position: 'fixed',
        bottom: '24px',
        right:
          sideNotesOpen && typeof window !== 'undefined' && window.innerWidth > 900
            ? `${sideNotesWidth + 24}px`
            : '24px',
        zIndex: 160,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(255, 254, 250, 0.96)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--line, #e2e4da)',
        borderRadius: '28px',
        padding: '6px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.16)',
        transition: 'right 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <button
        type="button"
        className="icon-button"
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          background: 'var(--soft)',
          color: 'var(--accent)'
        }}
        onClick={() => onScrollStep('up')}
        title="Scroll Document Up (Drawing Mode frozen)"
        aria-label="Scroll document up"
      >
        <ArrowUp size={20} />
      </button>
      <span
        style={{
          fontSize: '8px',
          fontWeight: 800,
          letterSpacing: '0.8px',
          color: 'var(--muted)',
          userSelect: 'none'
        }}
      >
        SCROLL
      </span>
      <button
        type="button"
        className="icon-button"
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          background: 'var(--soft)',
          color: 'var(--accent)'
        }}
        onClick={() => onScrollStep('down')}
        title="Scroll Document Down (Drawing Mode frozen)"
        aria-label="Scroll document down"
      >
        <ArrowDown size={20} />
      </button>
    </div>
  );
}
