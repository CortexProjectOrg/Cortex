import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { extractBearerToken, verifyGoogleToken } from '../api/lib/auth';
import { emptyWorkspace, parseWorkspace } from '../shared/workspace';
import { inkToSvgString } from '../src/lib/ink';
const audience = 'ainotes.apps.googleusercontent.com';
let pair: Awaited<ReturnType<typeof generateKeyPair>>;
let keys: ReturnType<typeof createLocalJWKSet>;
beforeAll(async () => {
  pair = await generateKeyPair('RS256');
  keys = createLocalJWKSet({ keys: [{ ...(await exportJWK(pair.publicKey)), kid: 'test' }] });
});
afterEach(() => vi.unstubAllEnvs());
async function sign(overrides: Record<string, unknown> = {}) {
  return new SignJWT({
    sub: 'user-a',
    aud: audience,
    iss: 'https://accounts.google.com',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    email: 'a@example.com',
    email_verified: true,
    ...overrides
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'test' })
    .sign(pair.privateKey);
}
describe('Google signature and claim verification', () => {
  it('verifies a signed token using trusted keys', async () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', audience);
    expect((await verifyGoogleToken(await sign(), keys))?.uid).toBe('user-a');
  });
  it('fails closed without configured audience', async () => {
    for (const key of ['GOOGLE_CLIENT_ID', 'GOOGLE_AUTH_CLIENT_API_KEY', 'VITE_GOOGLE_CLIENT_ID'])
      vi.stubEnv(key, '');
    expect(await verifyGoogleToken(await sign(), keys)).toBeNull();
  });
  it.each([
    { aud: 'another.apps.googleusercontent.com', azp: audience },
    { iss: 'https://evil.example' },
    { exp: 1 },
    { exp: undefined },
    { sub: '' },
    { email_verified: false }
  ])('rejects invalid claims %j', async (claims) => {
    vi.stubEnv('GOOGLE_CLIENT_ID', audience);
    expect(await verifyGoogleToken(await sign(claims), keys)).toBeNull();
  });
  it('rejects a modified signature', async () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', audience);
    const token = await sign();
    const parts = token.split('.');
    parts[2] = 'X' + parts[2].slice(1);
    expect(await verifyGoogleToken(parts.join('.'), keys)).toBeNull();
  });
  it('extracts only bearer credentials', () => {
    expect(extractBearerToken('  Bearer token  ')).toBe('token');
    expect(extractBearerToken(['bearer abc'])).toBe('abc');
    for (const input of [undefined, '', 'Basic abc', 'Bearer', 'Bearer a b'])
      expect(extractBearerToken(input)).toBeNull();
  });
});
describe('untrusted workspace and drawing boundaries', () => {
  it('rejects invalid dates, duplicate IDs, enums and malformed ink', () => {
    const note = {
      id: 'n',
      title: 'Title',
      body: '',
      createdAt: '2026-11-16T10:00:00.000Z',
      updatedAt: '2026-11-16T10:00:00.000Z'
    };
    expect(() =>
      parseWorkspace({ ...emptyWorkspace(), notes: [{ ...note, updatedAt: 'broken' }] })
    ).toThrow();
    expect(() => parseWorkspace({ ...emptyWorkspace(), notes: [note, note] })).toThrow();
    expect(() =>
      parseWorkspace({ ...emptyWorkspace(), notes: [{ ...note, inkData: '{"strokes":[{"id":"s"}]}' }] })
    ).toThrow();
    expect(() =>
      parseWorkspace({ ...emptyWorkspace(), lectureProgress: { n: { status: 'mastered' } } })
    ).toThrow();
  });
  it('rejects SVG attribute injection before exporting', () => {
    expect(() =>
      inkToSvgString([{ id: 's', points: [[0, 0, 0.5]], size: 2, color: 'red" onload="alert(1)' }])
    ).toThrow();
    expect(() => inkToSvgString([], Infinity)).toThrow();
  });
});
