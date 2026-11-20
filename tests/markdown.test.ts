import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import { MarkdownView } from '../src/components/MarkdownView';
import { MathFormula } from '../src/components/MathFormula';
import { ALL_LECTURES, LEGACY_LECTURE_MAP } from '../src/lib/curriculum';
import { lectureVisualPlacements } from '../src/lib/lectureVisualPlacements';

describe('MarkdownView Math & KaTeX Formula Rendering', () => {
  it('places an insertion after a complete subsection, including nested headings and equations', () => {
    const source = '### First\n\nExplanation.\n\n#### Detail\n\n$$\nx^2\n$$\n\n### Next\n\nMore text.';
    const html = renderToString(
      React.createElement(MarkdownView, {
        source,
        insertions: [{ afterHeading: 'first', content: React.createElement('aside', null, 'Try it') }]
      })
    );
    expect(html).toMatch(
      /id="detail"[\s\S]*class="katex-display"[\s\S]*<aside>Try it<\/aside>\s*<h3 id="next"/
    );
  });

  it('resolves the authored visual anchors for current and preserved lecture text', () => {
    // Heading IDs are assigned before KaTeX renders the math.
    const parser = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMath)
      .use(remarkRehype)
      .use(rehypeSlug);
    for (const lecture of ALL_LECTURES) {
      const legacy = LEGACY_LECTURE_MAP.get(lecture.id);
      for (const version of [
        lecture,
        ...(legacy && legacy.content.theory !== lecture.content.theory ? [legacy] : [])
      ]) {
        const placements = lectureVisualPlacements(lecture.id, version !== lecture);
        const theoryAnchors = placements.flatMap(({ afterHeading }) => (afterHeading ? [afterHeading] : []));
        if (!theoryAnchors.length) continue;
        const tree = parser.runSync(parser.parse(version.content.theory));
        const headings = tree.children.flatMap((node) =>
          node.type === 'element' && /^h[1-6]$/.test(node.tagName) ? [node.properties.id] : []
        );
        for (const id of theoryAnchors) expect(headings, `${version.id}: ${id}`).toContain(id);
      }
    }
  });
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
