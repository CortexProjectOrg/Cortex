import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { analyzePaper, DEFAULT_GEMINI_MODEL, readPaperFile } from '../src/lib/gemini';
import { paperAnalysis, sourcePaper } from './fixtures/paperAnalysis';

const options = () => ({
  apiKey: 'example-user-key',
  model: DEFAULT_GEMINI_MODEL,
  paper: { kind: 'text' as const, text: sourcePaper },
  target: '',
  signal: new AbortController().signal
});
const success = (analysis: unknown = paperAnalysis) =>
  Response.json({
    candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(analysis) }] } }]
  });
beforeEach(() =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => success())
  )
);
afterEach(() => vi.unstubAllGlobals());
describe('Gemini paper boundary', () => {
  it('sends the user key only as a Google header and validates the structured result', async () => {
    const plan = await analyzePaper(options());
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toMatch(/^https:\/\/generativelanguage.googleapis.com\//);
    expect(url).not.toContain('example-user-key');
    expect(init!.headers).toHaveProperty('x-goog-api-key', 'example-user-key');
    expect(init!.body).not.toContain('example-user-key');
    expect(JSON.parse(init!.body as string).generationConfig.responseMimeType).toBe('application/json');
    expect(plan.analysis.theorem!.quote).toBe(paperAnalysis.theorem!.quote);
  });
  it.each([400, 401, 403, 404, 429, 500])(
    'returns a safe error for HTTP %s without leaking the provider body',
    async (status) => {
      vi.mocked(fetch).mockResolvedValue(Response.json({ error: 'secret echoed by provider' }, { status }));
      await expect(analyzePaper(options())).rejects.toThrow(/Gemini/);
      await analyzePaper(options()).catch((error) => expect(error.message).not.toContain('secret echoed'));
    }
  );
  it('does not silently accept truncation, blocked or malformed responses', async () => {
    for (const payload of [
      {},
      { candidates: [{ finishReason: 'MAX_TOKENS' }] },
      { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{}' }] } }] }
    ]) {
      vi.mocked(fetch).mockResolvedValue(Response.json(payload));
      await expect(analyzePaper(options())).rejects.toThrow();
    }
  });
  it('checks that the quoted theorem occurs in supplied text', async () => {
    vi.mocked(fetch).mockResolvedValue(
      success({
        ...paperAnalysis,
        theorem: { ...paperAnalysis.theorem, quote: 'An invented theorem statement' }
      })
    );
    await expect(analyzePaper(options())).rejects.toThrow(/quote/);
  });
  it('rejects invalid model paths and undersized inputs before using the key', async () => {
    await expect(analyzePaper({ ...options(), model: '../other-host' })).rejects.toThrow(/model/);
    await expect(
      analyzePaper({ ...options(), paper: { kind: 'text', text: 'abstract only' } })
    ).rejects.toThrow(/100/);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('stops on cancellation without retrying a paid request', async () => {
    const controller = new AbortController();
    controller.abort();
    vi.mocked(fetch).mockRejectedValue(new DOMException('Aborted', 'AbortError'));
    await expect(analyzePaper({ ...options(), signal: controller.signal })).rejects.toThrow('Cancelled');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('reads PDF bytes inline and rejects mislabeled or excessive files', async () => {
    const paper = await readPaperFile(new File(['%PDF-1.7\nexample'], 'paper.pdf'));
    expect(paper.kind).toBe('pdf');
    await analyzePaper({ ...options(), paper });
    const payload = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
    expect(payload.contents[0].parts[1].inlineData.mimeType).toBe('application/pdf');
    await expect(readPaperFile(new File(['not a pdf'], 'paper.pdf'))).rejects.toThrow(/valid PDF/);
    await expect(readPaperFile(new File(['x'.repeat(8 * 1024 * 1024 + 1)], 'large.pdf'))).rejects.toThrow(
      /8 MB/
    );
    await expect(readPaperFile(new File(['hello'], 'script.html'))).rejects.toThrow(/Choose/);
  });
});
