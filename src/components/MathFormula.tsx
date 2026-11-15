import React, { useMemo } from 'react';
import katex from 'katex';

interface MathFormulaProps {
  math: string;
  display?: boolean;
  className?: string;
}

export function MathFormula({ math, display = false, className = '' }: MathFormulaProps) {
  const html = useMemo(() => {
    if (!math) return '';

    // Strip optional surrounding $ or $$ if provided
    let cleaned = math.trim();
    if (cleaned.startsWith('$$') && cleaned.endsWith('$$') && cleaned.length >= 4) {
      cleaned = cleaned.slice(2, -2).trim();
    } else if (cleaned.startsWith('$') && cleaned.endsWith('$') && cleaned.length >= 2) {
      cleaned = cleaned.slice(1, -1).trim();
    }

    try {
      return katex.renderToString(cleaned, {
        displayMode: display,
        throwOnError: false,
        strict: false
      });
    } catch {
      return `<code class="math-fallback">${math}</code>`;
    }
  }, [math, display]);

  if (display) {
    return (
      <div
        className={`math-formula-display ${className}`}
        style={{ margin: '10px 0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={`math-formula-inline ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
