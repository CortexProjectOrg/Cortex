import { describe, expect, it } from 'vitest';
import { cleanMarkdown, documentRoute, linkTarget } from '../scripts/content.mjs';

describe('Content Processing & Markdown Pipeline', () => {
  it('strips code fences, bold, math, and headers into clean plain text for indexing', () => {
    const raw = `
# Gram-Schmidt in $\\mathbb{F}_2^{2n}$

This is **essential** theory.
\`\`\`rust
let mut x = 42;
\`\`\`
Check [the plan](PLAN.md) and equation $x^2 + y^2 = 1$.
    `;

    const cleaned = cleanMarkdown(raw);
    expect(cleaned).not.toContain('```');
    expect(cleaned).not.toContain('let mut x');
    expect(cleaned).not.toContain('**');
    expect(cleaned).not.toContain('#');
    expect(cleaned).toContain('Gram-Schmidt in');
    expect(cleaned).toContain('This is essential theory');
    expect(cleaned).toContain('Check the plan and equation');
  });

  it('generates internal document route with optional anchor', () => {
    expect(documentRoute('sessions/01-foundations/theory.md')).toBe(
      '/read/sessions/01-foundations/theory.md'
    );
    expect(documentRoute('sessions/01-foundations/theory.md', 'section-2')).toBe(
      '/read/sessions/01-foundations/theory.md#section-2'
    );
  });

  it('correctly classifies link targets', () => {
    const knownIds = new Set(['PLAN.md', 'sessions/01-foundations/theory.md', 'GLOSSARY.md']);

    expect(
      linkTarget('sessions/01-foundations/README.md', 'https://arxiv.org/abs/quant-ph/0406196', knownIds)
    ).toEqual({
      kind: 'external',
      href: 'https://arxiv.org/abs/quant-ph/0406196'
    });

    expect(linkTarget('sessions/01-foundations/README.md', '#overview', knownIds)).toEqual({
      kind: 'anchor',
      href: '#overview'
    });

    expect(linkTarget('sessions/01-foundations/README.md', 'notes/README.md', knownIds)).toEqual({
      kind: 'notes',
      href: '/notes'
    });

    expect(linkTarget('sessions/01-foundations/README.md', 'PERSONAL_PATH.md', knownIds)).toEqual({
      kind: 'path',
      href: '/path'
    });

    expect(linkTarget('sessions/01-foundations/README.md', 'PROGRESS.md', knownIds)).toEqual({
      kind: 'progress',
      href: '/'
    });

    expect(linkTarget('sessions/01-foundations/README.md', 'theory.md', knownIds)).toEqual({
      kind: 'document',
      href: '/read/sessions/01-foundations/theory.md'
    });
  });

  it('ensures no legacy proprietary brand references (quaos, sympleq) exist in generated content or curriculum', async () => {
    const content = await import('../src/generated/content.json');
    const jsonStr = JSON.stringify(content).toLowerCase();
    expect(jsonStr).not.toContain('quaos');
    expect(jsonStr).not.toContain('sympleq');
  });
});
