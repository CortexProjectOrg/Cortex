import type { Snapshot, Workspace } from '../../shared/workspace';
import {
  emptyWorkspace,
  equal,
  mergeWorkspace,
  parseWorkspace,
  rebaseWorkspace,
  validateWorkspace
} from '../../shared/workspace';

export type SyncState = 'local' | 'pending' | 'syncing' | 'synced' | 'error';
export type LocalEnvelope = { format: 1; data: Workspace; base: Workspace | null; revision: number };
export interface WorkspaceRepository {
  read(key: string): Promise<unknown>;
  write(key: string, value: LocalEnvelope): Promise<void>;
  quarantine(key: string, value: unknown): Promise<void>;
}
export type SessionState = {
  data: Workspace;
  loaded: boolean;
  saving: boolean;
  syncState: SyncState;
  error: string;
  savedAt: string;
  needsRecovery: boolean;
};

/** One instance owns one account. Its requests, acknowledgements and writes cannot reach another instance. */
export class WorkspaceSession {
  state: SessionState = {
    data: emptyWorkspace(),
    loaded: false,
    saving: false,
    syncState: 'local',
    error: '',
    savedAt: '',
    needsRecovery: false
  };
  private base: Workspace | null = null;
  private revision = 0;
  private listeners = new Set<() => void>();
  private alive = true;
  private writable = true;
  private queue = Promise.resolve();
  private timer?: ReturnType<typeof setTimeout>;
  private abort = new AbortController();
  private syncing: Promise<boolean> | null = null;
  private token: string | null = null;
  constructor(
    readonly key: string,
    private repository: WorkspaceRepository,
    private request: typeof fetch = fetch,
    private unauthorized: () => void = () => {}
  ) {}
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  snapshot = () => this.state;
  private publish(patch: Partial<SessionState>) {
    if (!this.alive) return;
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }
  async load() {
    try {
      const raw = await this.repository.read(this.key);
      if (!this.alive) return;
      if (raw) {
        try {
          if (typeof raw === 'object' && 'format' in raw && raw.format === 1) {
            const envelope = raw as LocalEnvelope;
            this.base = envelope.base ? validateWorkspace(envelope.base) : null;
            if (!Number.isSafeInteger(envelope.revision) || envelope.revision < 0)
              throw new Error('Invalid revision');
            this.revision = envelope.revision;
            this.publish({ data: validateWorkspace(envelope.data) });
          } else this.publish({ data: validateWorkspace(raw) });
        } catch {
          // Preserve the original value and block writes; never overwrite an unreadable cache with an empty one.
          this.writable = false;
          this.publish({ needsRecovery: true });
          await this.repository.quarantine(this.key, raw);
          this.publish({
            error:
              'This workspace needs recovery. Its original data has been preserved; restore a backup in Settings.'
          });
        }
      }
    } catch {
      this.writable = false;
      this.publish({
        needsRecovery: true,
        error: 'Browser storage could not be read. Reload to retry, or restore a backup in Settings.'
      });
    }
    this.publish({ loaded: true });
  }
  setToken(token: string | null) {
    if (token === this.token) return;
    this.abort.abort();
    this.abort = new AbortController();
    this.token = token;
    if (token && this.state.loaded && this.writable) void this.sync();
    else this.publish({ syncState: 'local' });
  }
  update(fn: (current: Workspace) => Workspace) {
    if (!this.alive || !this.state.loaded || !this.writable) return;
    const before = this.state.data;
    const next = fn(before);
    if (equal(before, next)) return;
    const deletedNotes = [
      ...new Set([
        ...next.deletedNotes,
        ...before.notes.filter((n) => !next.notes.some((v) => v.id === n.id)).map((n) => n.id)
      ])
    ];
    this.publish({ data: { ...next, deletedNotes }, syncState: this.token ? 'pending' : 'local' });
    this.persist();
    this.schedule();
  }
  /** An explicit backup recovery is the only way to replace a quarantined local cache. */
  recover(workspace: Workspace) {
    const data = parseWorkspace(workspace);
    this.writable = true;
    this.base = null;
    this.revision = 0;
    this.publish({ data, error: '', needsRecovery: false, syncState: this.token ? 'pending' : 'local' });
    this.persist();
    this.schedule();
  }
  private persist() {
    if (!this.writable || !this.alive) return;
    const value: LocalEnvelope = {
      format: 1,
      data: this.state.data,
      base: this.base,
      revision: this.revision
    };
    this.publish({ saving: true });
    const write = this.repository.write(this.key, value);
    this.queue = write;
    void write.then(
      () => {
        if (this.queue === write)
          this.publish({ saving: false, savedAt: new Date().toISOString(), error: '' });
      },
      () => {
        if (this.queue === write)
          this.publish({
            saving: false,
            error: 'Changes could not be saved on this device. Export a backup before closing.'
          });
      }
    );
  }
  private schedule() {
    clearTimeout(this.timer);
    if (this.token)
      this.timer = setTimeout(() => {
        void this.sync();
      }, 1500);
  }
  sync = (): Promise<boolean> => {
    if (this.syncing) return this.syncing;
    if (!this.token || !this.alive || !this.state.loaded || !this.writable) return Promise.resolve(false);
    clearTimeout(this.timer);
    const signal = this.abort.signal,
      token = this.token;
    const active = () => this.alive && !signal.aborted;
    const readResponse = async (response: globalThis.Response): Promise<Snapshot> => {
      if (response.status === 401) {
        if (active()) this.unauthorized();
        throw new Error('Please sign in again.');
      }
      if (!response.ok && response.status !== 409)
        throw new Error('Cloud save unavailable. Changes remain on this device.');
      const body = await response.json();
      if (!Number.isSafeInteger(body.revision) || body.revision < 0)
        throw new Error('Invalid sync response.');
      return { workspace: parseWorkspace(body.workspace), revision: body.revision };
    };
    const run = async () => {
      this.publish({ syncState: 'syncing' });
      try {
        const remote = await readResponse(
          await this.request('/api/sync', {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)])
          })
        );
        if (!active()) return false;
        const merged = this.base
          ? rebaseWorkspace(this.base, this.state.data, remote.workspace)
          : remote.revision === 0
            ? this.state.data
            : mergeWorkspace(remote.workspace, this.state.data);
        this.base = remote.workspace;
        this.revision = remote.revision;
        this.publish({ data: merged });
        this.persist();
        for (let attempt = 0; attempt < 4; attempt++) {
          if (equal(this.state.data, this.base)) {
            this.publish({ syncState: 'synced' });
            return true;
          }
          const sent = parseWorkspace(this.state.data),
            base = this.base!;
          const response = await this.request('/api/sync', {
            method: 'POST',
            signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ protocol: 1, revision: this.revision, workspace: sent })
          });
          const canonical = await readResponse(response);
          if (!active()) return false;
          const data = rebaseWorkspace(
            response.status === 409 ? base : sent,
            this.state.data,
            canonical.workspace
          );
          this.base = canonical.workspace;
          this.revision = canonical.revision;
          this.publish({ data });
          this.persist();
        }
        if (equal(this.state.data, this.base)) {
          this.publish({ syncState: 'synced' });
          return true;
        }
        this.publish({ syncState: 'pending' });
        this.schedule();
        return false;
      } catch {
        if (active()) this.publish({ syncState: 'error' });
        return false;
      }
    };
    this.syncing = run().finally(() => {
      this.syncing = null;
      if (this.alive && signal.aborted && this.token) void this.sync();
    });
    return this.syncing;
  };
  flush = () => this.queue;
  dispose() {
    this.alive = false;
    clearTimeout(this.timer);
    this.abort.abort();
    this.listeners.clear();
  }
}
