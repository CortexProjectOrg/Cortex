import { ExternalLink, FileText } from 'lucide-react';
import type { PaperReference } from '../../lib/curriculum';
import { resolvePaperUrls, type ResolvedPaper } from '../../lib/paperUtils';

interface PrimaryLiteraturePanelProps {
  legacyLayout?: boolean;
  paperReferences: PaperReference[];
  onOpenPaper: (paper: ResolvedPaper) => void;
}

export function PrimaryLiteraturePanel({
  legacyLayout = false,
  paperReferences,
  onOpenPaper
}: PrimaryLiteraturePanelProps) {
  if (!paperReferences || paperReferences.length === 0) return null;

  return (
    <section style={{ marginBottom: '36px' }}>
      <h2 style={{ fontFamily: 'var(--serif)', fontSize: '24px', marginBottom: '14px' }}>
        {legacyLayout ? '5. Primary Literature & Research Papers' : 'Reading'}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {paperReferences.map((p, i) => {
          const sourceUrl = p.sourceUrl || p.arxivUrl;
          const resolved = resolvePaperUrls(sourceUrl, p.citation, p.title);
          const sourceLabel = resolved?.arxivId ? 'Open on arXiv' : 'Open source';
          return (
            <div
              key={i}
              style={{
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '16px 18px',
                background: 'var(--surface)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <h4 style={{ fontSize: '15px', margin: '0 0 4px', fontWeight: 650 }}>{p.title}</h4>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                    {p.authors} · <em>{p.citation}</em>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--accent)' }}>
                    <strong>Sections to read:</strong> {p.relevantSections}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {resolved ? (
                    <>
                      <button
                        type="button"
                        className="button small primary"
                        onClick={() => onOpenPaper(resolved)}
                        style={{ padding: '6px 12px', minHeight: '32px', fontSize: '11px', gap: '5px' }}
                        title="Open paper in embedded PDF viewer"
                      >
                        <FileText size={13} />
                        <span>View Paper PDF</span>
                      </button>
                      <a
                        href={resolved.abstractUrl || resolved.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="icon-button small"
                        style={{ width: '32px', height: '32px' }}
                        title={`${sourceLabel} (new tab)`}
                        aria-label={sourceLabel}
                      >
                        <ExternalLink size={13} />
                      </a>
                    </>
                  ) : sourceUrl ? (
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="button small secondary"
                      style={{ flexShrink: 0, textDecoration: 'none' }}
                    >
                      Read Paper <ExternalLink size={12} />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
