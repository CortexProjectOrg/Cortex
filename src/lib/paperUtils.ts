export interface ResolvedPaper {
  title: string;
  authors?: string;
  citation?: string;
  arxivId?: string;
  abstractUrl?: string;
  pdfUrl?: string;
}

/**
 * Extracts arXiv ID from an arXiv URL or citation string.
 * Supports legacy formats (quant-ph/9705052) and modern numeric formats (2605.18966, 2103.02202).
 */
export function extractArxivId(input?: string): string | null {
  if (!input) return null;

  // Match: https://arxiv.org/abs/quant-ph/0406196 or https://arxiv.org/pdf/2103.02202.pdf
  const urlMatch = input.match(/arxiv\.org\/(?:abs|pdf)\/([a-zA-Z\-]+(?:\/\d+)?|\d+\.\d+)(?:\.pdf)?/i);
  if (urlMatch) return urlMatch[1];

  // Match: arXiv:quant-ph/9705052 or arXiv:2605.18966
  const citationMatch = input.match(/arxiv:\s*([a-zA-Z\-]+(?:\/\d+)?|\d+\.\d+)/i);
  if (citationMatch) return citationMatch[1];

  return null;
}

/**
 * Resolves a paper reference into viewable PDF and abstract URLs.
 */
export function resolvePaperUrls(
  candidateUrl?: string,
  citation?: string,
  title: string = 'Research Paper'
): ResolvedPaper | null {
  const arxivId = extractArxivId(candidateUrl) || extractArxivId(citation);

  if (arxivId) {
    return {
      title,
      citation,
      arxivId,
      abstractUrl: `https://arxiv.org/abs/${arxivId}`,
      pdfUrl: `https://arxiv.org/pdf/${arxivId}.pdf`
    };
  }

  if (candidateUrl && candidateUrl.toLowerCase().endsWith('.pdf')) {
    return {
      title,
      citation,
      abstractUrl: candidateUrl,
      pdfUrl: candidateUrl
    };
  }

  return null;
}

/**
 * Generates an embedded Google Docs Viewer URL for a PDF.
 * This provides a guaranteed cross-origin preview if an academic host restricts iframe embedding.
 */
export function getGoogleDocsViewerUrl(pdfUrl: string): string {
  return `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
}
