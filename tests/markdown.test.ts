import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MarkdownView } from '../src/components/MarkdownView';
import { MathFormula } from '../src/components/MathFormula';

describe('MarkdownView Math & KaTeX Formula Rendering', () => {
  it('renders inline math with KaTeX markup', () => {
    const source = 'The inner product is $\\langle u, v \\rangle = u_z v_x - u_x v_z$.';
    const html = renderToString(React.createElement(MarkdownView, { source }));

    expect(html).toContain('class="katex"');
    expect(html).toContain('math');
    expect(html).not.toContain('$\\langle');
  });

  it('renders display math equations with KaTeX markup', () => {
    const source = `
Here is the core relation:

$$
P_a P_b = (-1)^{\\omega(a, b)} P_b P_a
$$

Following text.
`;
    const html = renderToString(React.createElement(MarkdownView, { source }));

    expect(html).toContain('class="katex"');
    expect(html).not.toContain('$$P_a');
  });

  it('renders complex Hilbert and Lanczos formulas without parse errors', () => {
    const source = `
> **Lanczos Relation:**
>
> $\\beta_j v_{j+1} = H v_j - \\alpha_j v_j - \\beta_{j-1} v_{j-1}$
`;
    const html = renderToString(React.createElement(MarkdownView, { source }));

    expect(html).toContain('class="katex"');
    expect(html).toContain('math');
  });

  describe('MathFormula Component', () => {
    it('renders inline and display KaTeX formulas accurately', () => {
      const inlineHtml = renderToString(
        React.createElement(MathFormula, {
          math: '\\omega(u, v) = u_z \\cdot v_x - u_x \\cdot v_z \\pmod p',
          display: false
        })
      );
      expect(inlineHtml).toContain('class="katex"');
      expect(inlineHtml).toContain('math-formula-inline');

      const displayHtml = renderToString(
        React.createElement(MathFormula, {
          math: 'T_m = V_m^{\\dagger} H V_m = \\begin{pmatrix} \\alpha_1 & \\beta_1 \\\\ \\beta_1 & \\alpha_2 \\end{pmatrix}',
          display: true
        })
      );
      expect(displayHtml).toContain('class="katex"');
      expect(displayHtml).toContain('math-formula-display');
    });

    it('gracefully strips extra surrounding dollar signs if present', () => {
      const html = renderToString(
        React.createElement(MathFormula, {
          math: '$\\mathcal{C}_n = \\{ U \\in \\mathcal{U}(2^n) \\mid U \\mathcal{P}_n U^{\\dagger} = \\mathcal{P}_n \\}$'
        })
      );
      expect(html).toContain('class="katex"');
      expect(html).not.toContain('$\\mathcal');
    });

    it('does not crash on malformed inputs and provides clean fallback', () => {
      const html = renderToString(
        React.createElement(MathFormula, {
          math: '\\frac{incomplete'
        })
      );
      // KaTeX throwOnError: false returns an error span without crashing
      expect(html).toContain('katex');
    });
  });
});
