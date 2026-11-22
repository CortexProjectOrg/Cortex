import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { analyzePaper, DEFAULT_GEMINI_MODEL, readPaperFile } from '../src/lib/gemini';
import { buildPaperPlan, paperAnalysisSchema } from '../src/lib/paperPlan';
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
  it('accepts consistent underscore IDs in a completed PDF response and preserves them on import', async () => {
    const input = structuredClone(paperAnalysis);
    input.concepts[0].id = 'map_definition';
    input.concepts[1].id = 'inverse_maps';
    input.concepts[1].prerequisites = ['map_definition'];
    input.theorem!.prerequisites = ['inverse_maps'];
    vi.mocked(fetch).mockResolvedValue(success(input));
    const plan = await analyzePaper({
      ...options(),
      paper: { kind: 'pdf', data: 'JVBERi0=', name: 'maps.pdf' }
    });
    expect(plan.analysis).toEqual(input);
    expect(buildPaperPlan(plan.analysis).graph?.edges).toEqual(plan.graph?.edges);
    input.concepts[1].prerequisites = ['map-definition'];
    vi.mocked(fetch).mockResolvedValue(success(input));
    await expect(analyzePaper(options())).rejects.toMatchObject({ code: 'proposal' });
  });
  it('rejects a different numbered theorem even when its quote appears in the source', async () => {
    const args = options();
    args.paper.text += ' Theorem 2: The inverse of a bijection is itself a bijection.';
    args.target = 'theorem   2';
    await expect(analyzePaper(args)).rejects.toMatchObject({
      stage: 'validation',
      code: 'target-mismatch',
      message: 'Gemini returned a different theorem. Check the label and try again.'
    });
  });
  it('sends the user key only as a Google header and validates the structured result', async () => {
    const plan = await analyzePaper(options());
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toMatch(/^https:\/\/generativelanguage.googleapis.com\//);
    expect(url).not.toContain('example-user-key');
    expect(init!.headers).toHaveProperty('x-goog-api-key', 'example-user-key');
    expect(init!.redirect).toBe('error');
    expect(init!.body).not.toContain('example-user-key');
    const config = JSON.parse(init!.body as string).generationConfig;
    expect(config.responseMimeType).toBe('application/json');
    const schema = config.responseJsonSchema;
    const local = z.toJSONSchema(paperAnalysisSchema);
    expect(Object.keys(schema.properties)).toEqual(Object.keys(local.properties!));
    expect(schema.required).toEqual(local.required);
    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties.theorem.anyOf[1]).toEqual({ type: 'null' });
    expect(schema.properties.theorem.anyOf[0].properties.title).toEqual({ type: 'string' });
    expect(Object.keys(schema.properties.concepts.items.properties)).toEqual(
      Object.keys(paperAnalysisSchema.shape.concepts.element.shape)
    );
    expect(schema.properties.concepts.items.properties.practiceMinutes).toEqual({ type: 'integer' });
    expect(schema.properties.concepts).not.toHaveProperty('maxItems');
    expect(plan.analysis.theorem!.quote).toBe(paperAnalysis.theorem!.quote);
  });
  it.each([
    [400, 'paper format'],
    [401, 'restrictions'],
    [403, 'restrictions'],
    [404, 'model available'],
    [429, 'quota'],
    [500, 'Try again']
  ])('returns a safe error for HTTP %s without reading the provider body', async (status, action) => {
    const response = Response.json({ error: 'secret echoed by provider' }, { status });
    vi.mocked(fetch).mockResolvedValue(response);
    await expect(analyzePaper(options())).rejects.toMatchObject({
      stage: 'request',
      code: 'http',
      status,
      message: expect.stringContaining(action)
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(response.bodyUsed).toBe(false);
  });
  it.each([
    [{}, 'unreadable'],
    [{ promptFeedback: { blockReason: 'SAFETY' } }, 'unfinished'],
    [{ candidates: [{ finishReason: 'MAX_TOKENS' }] }, 'unfinished'],
    [{ candidates: [{ finishReason: 'STOP', content: { parts: {} } }] }, 'unreadable'],
    [
      { candidates: [{ finishReason: 'STOP', content: { parts: [{ thought: true, text: '{}' }] } }] },
      'unreadable'
    ]
  ])('classifies unexpected success envelopes separately from network errors', async (payload, code) => {
    vi.mocked(fetch).mockResolvedValue(Response.json(payload));
    await expect(analyzePaper(options())).rejects.toMatchObject({ stage: 'response', code });
  });
  it('applies local bounds and hides validation messages that contain a generated title', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(success({ ...paperAnalysis, paperTitle: 'x'.repeat(301) }));
    await expect(analyzePaper(options())).rejects.toMatchObject({ stage: 'validation', code: 'proposal' });
    const generated = { ...paperAnalysis.concepts[0], title: 'PRIVATE TITLE', explanation: 'A qubit.' };
    vi.mocked(fetch).mockResolvedValueOnce(
      success({ ...paperAnalysis, concepts: [generated, ...paperAnalysis.concepts.slice(1)] })
    );
    await expect(analyzePaper(options())).rejects.toMatchObject({
      code: 'proposal',
      message: 'Gemini returned an invalid plan. Try again.'
    });
  });
  it('classifies fetch and stream I/O failures as connectivity errors', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('private diagnostic'));
    await expect(analyzePaper(options())).rejects.toMatchObject({ stage: 'request', code: 'network' });
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        new ReadableStream({
          start(controller) {
            controller.error(new TypeError('private diagnostic'));
          }
        })
      )
    );
    await expect(analyzePaper(options())).rejects.toMatchObject({ stage: 'request', code: 'network' });
  });
  it('keeps the output-size error if stopping the response stream fails', async () => {
    const cancel = vi.fn(async () => {
      throw new Error('private diagnostic');
    });
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(1_000_001));
          },
          cancel
        })
      )
    );
    await expect(analyzePaper(options())).rejects.toMatchObject({ stage: 'response', code: 'output-size' });
    expect(cancel).toHaveBeenCalledOnce();
  });
  it('checks that the quoted theorem occurs in supplied text', async () => {
    vi.mocked(fetch).mockResolvedValue(
      success({
        ...paperAnalysis,
        theorem: { ...paperAnalysis.theorem, quote: 'An invented theorem statement' }
      })
    );
    await expect(analyzePaper(options())).rejects.toMatchObject({ stage: 'validation', code: 'evidence' });
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
    vi.mocked(fetch).mockImplementationOnce(async () => {
      controller.abort();
      throw new DOMException('Aborted', 'AbortError');
    });
    await expect(analyzePaper({ ...options(), signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError'
    });
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
