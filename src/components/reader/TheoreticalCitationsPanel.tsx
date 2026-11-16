import { BookOpen, FileText } from 'lucide-react';
import type { TheoreticalCitation } from '../../lib/curriculum';
import { resolvePaperUrls, type ResolvedPaper } from '../../lib/paperUtils';
import { MathFormula } from '../MathFormula';

interface TheoreticalCitationsPanelProps {
  concise?: boolean;
  citations?: TheoreticalCitation[];
  onOpenPaper: (paper: ResolvedPaper) => void;
}

export function TheoreticalCitationsPanel({
  concise = false,
  citations,
  onOpenPaper
}: TheoreticalCitationsPanelProps) {
  if (!citations || citations.length === 0) return null;

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line, #e2e4da)',
        borderRadius: '8px',
        padding: '18px 22px',
        marginBottom: '32px'
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '1px',
          color: 'var(--accent)',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <BookOpen size={14} /> {concise ? 'Formulas' : 'THEORETICAL FORMULAS & PRIMARY CITATIONS'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {citations.map((cite, i) => {
          const resolvedCite = resolvePaperUrls(cite.doiOrUrl, cite.source, cite.formulaName);
          return (
            <div
              key={i}
              style={{
                borderLeft: '3px solid #8caa7c',
                paddingLeft: '14px',
                fontSize: '13px'
              }}
            >
              <div style={{ fontWeight: 650, color: 'var(--ink)', marginBottom: '4px' }}>
                {cite.formulaName}:
              </div>
              <MathFormula math={cite.expression} display={true} />
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--muted)',
                  marginTop: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '6px'
                }}
              >
                <span>
                  Source: <em>{cite.source}</em> · {cite.theoremOrEquation}
                </span>
                {resolvedCite && (
                  <button
                    type="button"
                    onClick={() => onOpenPaper(resolvedCite)}
                    style={{
                      background: 'var(--soft)',
                      border: '1px solid var(--line)',
                      color: 'var(--accent)',
                      fontSize: '10px',
                      fontWeight: 650,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 7px',
                      borderRadius: '4px'
                    }}
                    title="Open cited paper in PDF viewer"
                  >
                    <FileText size={11} />
                    <span>View Paper PDF</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
