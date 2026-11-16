import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptyWorkspace, rebaseWorkspace, type Workspace } from '../shared/workspace';
import { makeNote } from '../src/lib/model';
import { WorkspaceSession, type LocalEnvelope, type WorkspaceRepository } from '../src/lib/workspaceSession';
import { serializeRepository } from '../src/lib/workspaceRepository';

const note = (id: string) => ({ ...makeNote(id), id });
function repository(values = new Map<string, unknown>()) {
  const repo: WorkspaceRepository = {
    read: vi.fn(async (key) => structuredClone(values.get(key))),
    write: vi.fn(async (key, value) => {
      values.set(key, structuredClone(value));
    }),
    quarantine: vi.fn(async (key, value) => {
      values.set(`recovery:${key}`, value);
    })
  };
  return { repo, values };
}
function server(workspace = emptyWorkspace()) {
  let revision = 1;
  const request = vi.fn(async (_url: unknown, init?: RequestInit) => {
    if (init?.method === 'POST') {
      const incoming = JSON.parse(String(init.body));
      if (incoming.revision !== revision) return Response.json({ workspace, revision }, { status: 409 });
      workspace = incoming.workspace;
      revision++;
    }
    return Response.json({ workspace, revision });
  });
  return { request, get: () => workspace };
}
afterEach(() => vi.useRealTimers());
describe('account-owned workspace sessions', () => {
  it('waits for queued local edits when returning immediately to the same account', async () => {
    const { repo, values } = repository();
    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const write = repo.write;
    repo.write = async (key, value) => {
      await held;
      await write(key, value);
    };
    const ordered = serializeRepository(repo);
    const first = new WorkspaceSession('user:A', ordered);
    await first.load();
    first.update((ws) => ({ ...ws, notes: [note('latest')] }));
    first.dispose();
    const second = new WorkspaceSession('user:A', ordered);
    const loading = second.load();
    expect(second.state.loaded).toBe(false);
    release();
    await loading;
    expect(second.state.data.notes[0].id).toBe('latest');
    second.update((ws) => ({ ...ws, theme: 'dark' }));
    await second.flush();
    expect((values.get('user:A') as LocalEnvelope).data.notes[0].id).toBe('latest');
    second.dispose();
  });
  it('blocks replacement of an unreadable local cache until explicit recovery', async () => {
    const { repo } = repository();
    vi.mocked(repo.read).mockRejectedValue(new Error('unavailable'));
    const session = new WorkspaceSession('main', repo);
    await session.load();
    session.update((ws) => ({ ...ws, theme: 'dark' }));
    expect(repo.write).not.toHaveBeenCalled();
    expect(session.state.needsRecovery).toBe(true);
    session.recover({ ...emptyWorkspace(), notes: [note('backup')] });
    await session.flush();
    expect(session.state.needsRecovery).toBe(false);
    expect(session.state.data.notes[0].id).toBe('backup');
    session.dispose();
  });
  it('loads only the requested account, keeping anonymous work separate', async () => {
    const { repo, values } = repository(
      new Map([
        ['main', { ...emptyWorkspace(), notes: [note('anonymous')] }],
        ['user:A', { ...emptyWorkspace(), notes: [note('A')] }]
      ])
    );
    const a = new WorkspaceSession('user:A', repo);
    await a.load();
    a.update((ws) => ({ ...ws, theme: 'dark' }));
    a.dispose();
    const b = new WorkspaceSession('user:B', repo);
    await b.load();
    expect(b.state.data.notes).toEqual([]);
    await a.flush();
    expect((values.get('user:A') as LocalEnvelope).data.notes[0].id).toBe('A');
    expect((values.get('main') as Workspace).notes[0].id).toBe('anonymous');
    b.dispose();
  });
  it('discards a late cloud response after switching accounts', async () => {
    const { repo } = repository();
    let finish!: (value: Response) => void;
    const request = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        })
    );
    const a = new WorkspaceSession('user:A', repo, request);
    await a.load();
    a.setToken('A');
    const pending = a.sync();
    a.dispose();
    const b = new WorkspaceSession('user:B', repo);
    await b.load();
    finish(Response.json({ revision: 1, workspace: { ...emptyWorkspace(), notes: [note('private-A')] } }));
    await pending;
    expect(b.state.data.notes).toEqual([]);
    expect(repo.write).not.toHaveBeenCalled();
    b.dispose();
  });
  it('quarantines corrupt caches without replacing the original', async () => {
    const { repo, values } = repository(new Map([['user:A', { version: 2, notes: [{ id: 'broken' }] }]]));
    const s = new WorkspaceSession('user:A', repo);
    await s.load();
    s.update((ws) => ({ ...ws, theme: 'dark' }));
    expect(repo.quarantine).toHaveBeenCalled();
    expect(repo.write).not.toHaveBeenCalled();
    expect(values.get('user:A')).toEqual({ version: 2, notes: [{ id: 'broken' }] });
    s.dispose();
  });
  it('stops requests and writes after acknowledgement', async () => {
    vi.useFakeTimers();
    const { repo } = repository();
    const cloud = server();
    const s = new WorkspaceSession('user:A', repo, cloud.request);
    await s.load();
    s.setToken('A');
    await s.sync();
    s.update((ws) => ({ ...ws, notes: [note('new')] }));
    await s.sync();
    await s.flush();
    const calls = cloud.request.mock.calls.length,
      writes = vi.mocked(repo.write).mock.calls.length;
    await vi.advanceTimersByTimeAsync(30_000);
    expect(cloud.request).toHaveBeenCalledTimes(calls);
    expect(repo.write).toHaveBeenCalledTimes(writes);
    expect(s.state.syncState).toBe('synced');
    s.dispose();
  });
  it('preserves independent concurrent edits and a deletion on a second device', async () => {
    const cloud = server({ ...emptyWorkspace(), notes: [note('old')] });
    const a = new WorkspaceSession('user:A', repository().repo, cloud.request);
    const b = new WorkspaceSession('user:A', repository().repo, cloud.request);
    await Promise.all([a.load(), b.load()]);
    a.setToken('A');
    b.setToken('A');
    await Promise.all([a.sync(), b.sync()]);
    a.update((ws) => ({ ...ws, notes: [note('a')] }));
    b.update((ws) => ({ ...ws, notes: [...ws.notes, note('b')] }));
    await Promise.all([a.sync(), b.sync()]);
    await a.sync();
    expect(
      cloud
        .get()
        .notes.map((n) => n.id)
        .sort()
    ).toEqual(['a', 'b']);
    expect(cloud.get().deletedNotes).toContain('old');
    a.dispose();
    b.dispose();
  });
  it('keeps pending local changes when the backend fails and retries explicitly', async () => {
    const { repo } = repository();
    const request = vi.fn(async () => Response.json({}, { status: 503 }));
    const s = new WorkspaceSession('user:A', repo, request);
    await s.load();
    s.update((ws) => ({ ...ws, notes: [note('local')] }));
    s.setToken('A');
    expect(await s.sync()).toBe(false);
    await s.flush();
    expect(s.state.syncState).toBe('error');
    expect(s.state.data.notes[0].id).toBe('local');
    s.dispose();
  });
  it('retains edits made while a POST acknowledgement is pending', async () => {
    const cloud = server();
    let release!: () => void;
    const request = vi.fn(async (url: unknown, init?: RequestInit) => {
      const response = await cloud.request(url, init);
      if (init?.method === 'POST' && !release)
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      return response;
    });
    const s = new WorkspaceSession('user:A', repository().repo, request);
    await s.load();
    s.setToken('A');
    await s.sync();
    s.update((ws) => ({ ...ws, notes: [note('first')] }));
    const saving = s.sync();
    await vi.waitFor(() => expect(release).toBeTypeOf('function'));
    s.update((ws) => ({ ...ws, notes: [...ws.notes, note('second')] }));
    release();
    await saving;
    expect(
      cloud
        .get()
        .notes.map((n) => n.id)
        .sort()
    ).toEqual(['first', 'second']);
    s.dispose();
  });
});
describe('reversible progress and conflicts', () => {
  it('retains removals and earlier pack selection across a stale peer', () => {
    const base = {
      ...emptyWorkspace(),
      bookmarks: ['doc'],
      read: ['doc'],
      completedLectures: ['lecture'],
      studyPlan: { ...emptyWorkspace().studyPlan, currentWeek: 8 }
    };
    const local = {
      ...base,
      bookmarks: [],
      read: [],
      completedLectures: [],
      studyPlan: { ...base.studyPlan, currentWeek: 2 }
    };
    const merged = rebaseWorkspace(base, local, { ...base, theme: 'dark' });
    expect([merged.bookmarks, merged.read, merged.completedLectures]).toEqual([[], [], []]);
    expect(merged.studyPlan.currentWeek).toBe(2);
    expect(merged.theme).toBe('dark');
  });
  it('keeps a conflict copy instead of silently dropping an edit', () => {
    const original = note('same');
    const base = { ...emptyWorkspace(), notes: [original] };
    const local = { ...base, notes: [{ ...original, body: 'local' }] };
    const remote = { ...base, notes: [{ ...original, body: 'remote' }] };
    const result = rebaseWorkspace(base, local, remote);
    expect(result.notes.map((n) => n.body).sort()).toEqual(['local', 'remote']);
    expect(rebaseWorkspace(base, local, remote)).toEqual(result);
  });
});
