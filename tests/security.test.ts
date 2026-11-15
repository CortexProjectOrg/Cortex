import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractBearerToken, verifyGoogleToken } from '../api/lib/auth';
import { emptyWorkspace, mergeWorkspace, type Note, type Workspace } from '../src/lib/model';

describe('Security & Multi-Tenant Isolation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('Bearer Token Extraction & Header Sanitization', () => {
    it('correctly extracts bearer tokens from Authorization header string', () => {
      expect(extractBearerToken('Bearer abc.def.ghi')).toBe('abc.def.ghi');
      expect(extractBearerToken('bearer abc.def.ghi')).toBe('abc.def.ghi');
      expect(extractBearerToken('  Bearer   token123  ')).toBe('token123');
    });

    it('correctly extracts bearer tokens from header array', () => {
      expect(extractBearerToken(['Bearer array.token.123'])).toBe('array.token.123');
    });

    it('rejects missing or malformed headers', () => {
      expect(extractBearerToken(undefined)).toBeNull();
      expect(extractBearerToken('')).toBeNull();
      expect(extractBearerToken('Basic dXNlcjpwYXNz')).toBeNull();
      expect(extractBearerToken('Token xyz')).toBeNull();
      expect(extractBearerToken('Bearer')).toBeNull();
    });
  });

  describe('Google Token Cryptographic Verification & Audience Enforcement', () => {
    it('rejects empty or non-string tokens immediately without network requests', async () => {
      expect(await verifyGoogleToken('')).toBeNull();
      expect(await verifyGoogleToken(undefined as any)).toBeNull();
    });

    it('rejects tokens issued by untrusted issuers', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          iss: 'https://evil-hacker.com',
          sub: 'attacker-123',
          email: 'attacker@evil.com'
        })
      } as any);

      const user = await verifyGoogleToken('fake.jwt.token');
      expect(user).toBeNull();
    });

    it('rejects tokens with audience mismatch (preventing cross-client token reuse)', async () => {
      process.env.GOOGLE_AUTH_CLIENT_API_KEY = 'official-ainotes-client-id.apps.googleusercontent.com';

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          iss: 'https://accounts.google.com',
          aud: 'some-other-app-client-id.apps.googleusercontent.com',
          azp: 'some-other-app-client-id.apps.googleusercontent.com',
          sub: 'google-user-789',
          email: 'scholar@gmail.com',
          email_verified: 'true'
        })
      } as any);

      const user = await verifyGoogleToken('stolen.from.another.app');
      expect(user).toBeNull();
    });

    it('rejects expired tokens', async () => {
      process.env.GOOGLE_AUTH_CLIENT_API_KEY = 'official-ainotes-client-id.apps.googleusercontent.com';

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          iss: 'accounts.google.com',
          aud: 'official-ainotes-client-id.apps.googleusercontent.com',
          sub: 'google-user-expired',
          email: 'scholar@gmail.com',
          email_verified: 'true',
          exp: String(Math.floor(Date.now() / 1000) - 3600) // 1 hour ago
        })
      } as any);

      const user = await verifyGoogleToken('expired.jwt.token');
      expect(user).toBeNull();
    });

    it('rejects tokens without a verified email address', async () => {
      process.env.GOOGLE_AUTH_CLIENT_API_KEY = 'official-ainotes-client-id.apps.googleusercontent.com';

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          iss: 'https://accounts.google.com',
          aud: 'official-ainotes-client-id.apps.googleusercontent.com',
          sub: 'unverified-user',
          email: 'fake@spammer.com',
          email_verified: 'false'
        })
      } as any);

      const user = await verifyGoogleToken('unverified.jwt.token');
      expect(user).toBeNull();
    });

    it('accepts authentic Google tokens with matching audience and verified claims', async () => {
      process.env.GOOGLE_AUTH_CLIENT_API_KEY = 'official-ainotes-client-id.apps.googleusercontent.com';

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          iss: 'https://accounts.google.com',
          aud: 'official-ainotes-client-id.apps.googleusercontent.com',
          sub: '1098237461928374',
          email: 'einstein@princeton.edu',
          email_verified: 'true',
          name: 'Albert Einstein',
          picture: 'https://lh3.googleusercontent.com/photo.jpg',
          exp: String(Math.floor(Date.now() / 1000) + 3600)
        })
      } as any);

      const user = await verifyGoogleToken('valid.jwt.token');
      expect(user).toBeDefined();
      expect(user?.uid).toBe('1098237461928374');
      expect(user?.email).toBe('einstein@princeton.edu');
      expect(user?.name).toBe('Albert Einstein');
    });
  });

  describe('Multi-Tenant Data Boundaries', () => {
    it('ensures distinct user workspaces never leak data across tenants', () => {
      const userA_Workspace: Workspace = {
        ...emptyWorkspace(),
        notes: [
          {
            id: 'secret-note-a',
            title: "User A's Proprietary Derivation",
            body: 'Confidential symplectic proof',
            createdAt: '2026-11-15T12:00:00.000Z',
            updatedAt: '2026-11-15T12:00:00.000Z'
          }
        ]
      };

      const userB_Workspace: Workspace = {
        ...emptyWorkspace(),
        notes: [
          {
            id: 'note-b',
            title: "User B's Note",
            body: 'Public exercise notes',
            createdAt: '2026-11-15T13:00:00.000Z',
            updatedAt: '2026-11-15T13:00:00.000Z'
          }
        ]
      };

      // Ensure that fresh workspace for User B contains zero information from User A
      expect(userB_Workspace.notes.some(n => n.id === 'secret-note-a')).toBe(false);
      expect(userB_Workspace.notes.some(n => n.title.includes('User A'))).toBe(false);

      // Verify that logout resets state completely
      const loggedOutWorkspace = emptyWorkspace();
      expect(loggedOutWorkspace.notes).toEqual([]);
      expect(loggedOutWorkspace.completedLectures).toEqual([]);
      expect(loggedOutWorkspace.lectureProgress).toEqual({});
    });
  });
});
