import { beforeEach, describe, expect, it, vi } from 'vitest';
import handler from '../api/sync';
import graph from '../api/graph';
import { emptyWorkspace } from '../shared/workspace';
import type { Request, Response } from '../api/lib/http';
import { verifyGoogleToken } from '../api/lib/auth';
import { getUserData, saveUserData } from '../api/lib/storage';
import { upsertUser } from '../api/lib/db';
vi.mock('../api/lib/auth', () => ({ extractBearerToken: (v: string) => v, verifyGoogleToken: vi.fn() }));
vi.mock('../api/lib/storage', () => ({ getUserData: vi.fn(), saveUserData: vi.fn() }));
vi.mock('../api/lib/db', () => ({ upsertUser: vi.fn() }));
function response() {
  const res = { setHeader: vi.fn(), status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res as unknown as Response;
}
const request = (body?: unknown, method = 'POST') =>
  ({
    method,
    body,
    headers: { authorization: 'token', host: 'app.test', origin: 'https://app.test' }
  }) as Request;
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(verifyGoogleToken).mockResolvedValue({ uid: 'verified-user', email: '', name: '', picture: '' });
  vi.mocked(upsertUser).mockResolvedValue(undefined);
  vi.mocked(getUserData).mockResolvedValue({ revision: 2, workspace: emptyWorkspace() });
  vi.mocked(saveUserData).mockResolvedValue(3);
});
describe('authenticated sync endpoint', () => {
  it('uses only the verified identity and awaits durable commit', async () => {
    const res = response();
    await handler(request({ protocol: 1, revision: 2, workspace: emptyWorkspace() }), res);
    expect(saveUserData).toHaveBeenCalledWith('verified-user', emptyWorkspace(), 2);
    expect(vi.mocked(upsertUser).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(saveUserData).mock.invocationCallOrder[0]
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
  it('returns 409 on revision conflict', async () => {
    vi.mocked(saveUserData).mockResolvedValue(null);
    const res = response();
    await handler(request({ protocol: 1, revision: 1, workspace: emptyWorkspace() }), res);
    expect(res.status).toHaveBeenCalledWith(409);
  });
  it('returns a failure when storage fails', async () => {
    vi.mocked(saveUserData).mockRejectedValue(new Error('private database detail'));
    const res = response();
    await handler(request({ protocol: 1, revision: 2, workspace: emptyWorkspace() }), res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(JSON.stringify(vi.mocked(res.json).mock.calls)).not.toContain('private database');
  });
  it('rejects malformed input and old clients without writes', async () => {
    const res = response();
    await handler(request({ workspace: emptyWorkspace() }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(saveUserData).not.toHaveBeenCalled();
    expect(upsertUser).not.toHaveBeenCalled();
  });
  it('rejects unauthenticated callers, cross-origin requests, oversized requests and unsupported methods', async () => {
    vi.mocked(verifyGoogleToken).mockResolvedValue(null);
    const unauthorized = response();
    await handler(request(), unauthorized);
    expect(unauthorized.status).toHaveBeenCalledWith(401);
    const origin = response();
    const cross = request();
    cross.headers.origin = 'https://other.test';
    await handler(cross, origin);
    expect(origin.status).toHaveBeenCalledWith(403);
    const method = response();
    await handler(request({}, 'DELETE'), method);
    expect(method.status).toHaveBeenCalledWith(405);
    const size = response();
    const huge = request();
    huge.headers['content-length'] = '9000000';
    await handler(huge, size);
    expect(size.status).toHaveBeenCalledWith(413);
    expect(saveUserData).not.toHaveBeenCalled();
  });
  it('retires unauthenticated curriculum writes', () => {
    const res = response();
    graph(request({ topics: [] }), res);
    expect(res.status).toHaveBeenCalledWith(410);
    expect(saveUserData).not.toHaveBeenCalled();
  });
});
