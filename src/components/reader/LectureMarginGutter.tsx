import React from 'react';
import { PenTool } from 'lucide-react';

export function LectureMarginGutter() {
  return (
    <aside className="sheet-margin-column" aria-label="Academic Margin Notes and Proofs">
      <div className="sheet-margin-header">
        <div className="sheet-margin-title">
          <PenTool size={11} />
          <span>MARGINALIA & PROOFS</span>
        </div>
        <p className="sheet-margin-desc">
          Preserved margin notes column. Draw proofs, side derivations & notes directly alongside the text.
        </p>
      </div>

      <div className="margin-guide-marker" style={{ marginTop: '24px' }}>
        <span className="margin-section-tag">§ 1 Motivation Notes</span>
      </div>

      <div className="margin-guide-marker" style={{ marginTop: '260px' }}>
        <span className="margin-section-tag">§ 2 Theory & Proofs</span>
      </div>

      <div className="margin-guide-marker" style={{ marginTop: '540px' }}>
        <span className="margin-section-tag">§ 3 Worked Derivations</span>
      </div>

      <div className="margin-guide-marker" style={{ marginTop: '500px' }}>
        <span className="margin-section-tag">§ 4 Systems & Code Notes</span>
      </div>

      <div className="margin-guide-marker" style={{ marginTop: '480px' }}>
        <span className="margin-section-tag">§ 5 Literature Marginalia</span>
      </div>

      <div className="margin-guide-marker" style={{ marginTop: '440px' }}>
        <span className="margin-section-tag">§ 6 Exercise Calculations</span>
      </div>
    </aside>
  );
}
