import { describe, expect, it } from 'vitest';
import { extractArxivId, getGoogleDocsViewerUrl, resolvePaperUrls } from '../src/lib/paperUtils';

describe('Paper & PDF Resolution Engine', () => {
  it('extracts legacy and modern arXiv IDs from URLs and citation strings', () => {
    // Legacy string format
    expect(extractArxivId('https://arxiv.org/abs/quant-ph/0406196')).toBe('quant-ph/0406196');
    expect(extractArxivId('https://arxiv.org/pdf/quant-ph/9705052.pdf')).toBe('quant-ph/9705052');
    expect(extractArxivId('arXiv:quant-ph/9807006 (1998)')).toBe('quant-ph/9807006');

    // Modern numeric format
    expect(extractArxivId('https://arxiv.org/abs/2103.02202')).toBe('2103.02202');
    expect(extractArxivId('arXiv:2605.18966 (2026)')).toBe('2605.18966');
    expect(extractArxivId('arXiv:2605.00682')).toBe('2605.00682');

    // Invalid or non-arXiv
    expect(extractArxivId('https://cambridge.org/book/12345')).toBeNull();
    expect(extractArxivId('')).toBeNull();
    expect(extractArxivId(undefined)).toBeNull();
  });

  it('resolves paper URLs to canonical abstract and direct PDF addresses', () => {
    const paper = resolvePaperUrls(
      'https://arxiv.org/abs/quant-ph/0406196',
      'Aaronson & Gottesman (2004)',
      'Improved Simulation of Stabilizer Circuits'
    );

    expect(paper).not.toBeNull();
    expect(paper?.arxivId).toBe('quant-ph/0406196');
    expect(paper?.abstractUrl).toBe('https://arxiv.org/abs/quant-ph/0406196');
    expect(paper?.pdfUrl).toBe('https://arxiv.org/pdf/quant-ph/0406196.pdf');
    expect(paper?.title).toBe('Improved Simulation of Stabilizer Circuits');
  });

  it('resolves direct PDF URLs correctly', () => {
    const direct = resolvePaperUrls('https://example.com/papers/my-paper.pdf', undefined, 'Direct Paper');
    expect(direct).not.toBeNull();
    expect(direct?.pdfUrl).toBe('https://example.com/papers/my-paper.pdf');
  });

  it('generates working Google Docs Viewer fallback embed URLs', () => {
    const pdfUrl = 'https://arxiv.org/pdf/2103.02202.pdf';
    const viewerUrl = getGoogleDocsViewerUrl(pdfUrl);
    expect(viewerUrl).toContain('https://docs.google.com/viewer?url=');
    expect(viewerUrl).toContain('embedded=true');
    expect(viewerUrl).toContain(encodeURIComponent(pdfUrl));
  });
});
