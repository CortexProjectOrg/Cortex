import React, { useState, useEffect } from 'react';
import {
  FileText,
  ExternalLink,
  Download,
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  Layers,
  Globe,
  AlertCircle
} from 'lucide-react';
import type { ResolvedPaper } from '../lib/paperUtils';
import { getGoogleDocsViewerUrl } from '../lib/paperUtils';

interface PdfEmbedViewerProps {
  paper: ResolvedPaper;
  onClose: () => void;
  initialEngine?: 'native' | 'google';
}

export function PdfEmbedViewer({
  paper,
  onClose,
  initialEngine = 'native'
}: PdfEmbedViewerProps) {
  const [engine, setEngine] = useState<'native' | 'google'>(initialEngine);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!paper.pdfUrl) return null;

  const currentEmbedUrl =
    engine === 'native'
      ? `${paper.pdfUrl}#toolbar=1&navpanes=0&view=FitH`
      : getGoogleDocsViewerUrl(paper.pdfUrl);

  return (
    <div
      className="pdf-viewer-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-paper-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 500,
        background: 'rgba(25, 35, 30, 0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isFullscreen ? '0' : '16px'
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="pdf-viewer-container"
        style={{
          width: isFullscreen ? '100vw' : 'min(1250px, 96vw)',
          height: isFullscreen ? '100vh' : '92vh',
          background: 'var(--surface, #fffefa)',
          borderRadius: isFullscreen ? '0' : '12px',
          border: '1px solid var(--line, #e2e4da)',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Academic PDF Header Toolbar */}
        <header
          style={{
            padding: '12px 18px',
            background: 'var(--sidebar, #f0f0e8)',
            borderBottom: '1px solid var(--line, #e2e4da)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          {/* Paper Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--soft, #e9eee3)',
                color: 'var(--accent, #3a5d49)',
                flexShrink: 0
              }}
            >
              <FileText size={18} />
            </span>

            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  id="pdf-paper-title"
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: '15px',
                    fontWeight: 650,
                    color: 'var(--ink, #28372e)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={paper.title}
                >
                  {paper.title}
                </span>

                {paper.arxivId && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      background: '#e0e7d7',
                      color: 'var(--accent, #3a5d49)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                  >
                    arXiv:{paper.arxivId}
                  </span>
                )}
              </div>

              {(paper.authors || paper.citation) && (
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--muted, #797f73)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {paper.authors ? `${paper.authors} · ` : ''}
                  <em>{paper.citation || 'Academic Source'}</em>
                </div>
              )}
            </div>
          </div>

          {/* Viewer Mode & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* Engine Selector */}
            <div
              className="segmented"
              style={{ padding: '2px', background: 'var(--bg, #f6f5f0)', borderRadius: '6px' }}
            >
              <button
                type="button"
                className={engine === 'native' ? 'selected' : ''}
                style={{ padding: '4px 8px', fontSize: '11px' }}
                onClick={() => {
                  setEngine('native');
                  setHasError(false);
                }}
                title="Direct PDF view from academic source"
              >
                Direct PDF
              </button>
              <button
                type="button"
                className={engine === 'google' ? 'selected' : ''}
                style={{ padding: '4px 8px', fontSize: '11px' }}
                onClick={() => {
                  setEngine('google');
                  setHasError(false);
                }}
                title="Google Docs viewer (Bypasses browser cross-origin embed restrictions)"
              >
                Google Viewer
              </button>
            </div>

            {/* Direct Open in New Tab */}
            <a
              href={paper.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="icon-button"
              style={{ width: '32px', height: '32px' }}
              title="Open direct PDF in new tab"
              aria-label="Open PDF in new tab"
            >
              <ExternalLink size={15} />
            </a>

            {/* Abstract Link */}
            {paper.abstractUrl && (
              <a
                href={paper.abstractUrl}
                target="_blank"
                rel="noreferrer"
                className="icon-button"
                style={{ width: '32px', height: '32px' }}
                title="View abstract & citations on arXiv"
                aria-label="View abstract on arXiv"
              >
                <Globe size={15} />
              </a>
            )}

            {/* Fullscreen Toggle */}
            <button
              type="button"
              className="icon-button"
              style={{ width: '32px', height: '32px' }}
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Restore standard size' : 'Expand full screen'}
              aria-label={isFullscreen ? 'Restore standard size' : 'Expand full screen'}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              className="icon-button"
              style={{ width: '32px', height: '32px' }}
              onClick={onClose}
              title="Close PDF viewer (Esc)"
              aria-label="Close PDF viewer"
            >
              <X size={17} />
            </button>
          </div>
        </header>

        {/* Embedded Iframe Surface */}
        <div style={{ flex: 1, position: 'relative', background: '#525659' }}>
          <iframe
            key={currentEmbedUrl}
            src={currentEmbedUrl}
            title={paper.title}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#525659'
            }}
            onError={() => setHasError(true)}
            allow="fullscreen"
          />

          {/* Discrete Fallback Helper Banner */}
          {engine === 'native' && (
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(255, 254, 250, 0.94)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--line, #e2e4da)',
                borderRadius: '20px',
                padding: '5px 14px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
                color: 'var(--muted, #797f73)',
                pointerEvents: 'auto'
              }}
            >
              <span>If your browser restricts embedding:</span>
              <button
                type="button"
                className="text-button"
                onClick={() => setEngine('google')}
                style={{ fontSize: '11px', color: 'var(--accent, #3a5d49)', fontWeight: 650 }}
              >
                Switch to Google Viewer
              </button>
              <span>·</span>
              <a
                href={paper.pdfUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--accent, #3a5d49)', fontWeight: 650, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
              >
                Open Tab <ExternalLink size={10} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
