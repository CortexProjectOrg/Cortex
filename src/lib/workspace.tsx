import { openDB } from 'idb';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { useAuth } from './auth';
import { serializeRepository } from './workspaceRepository';
import type { Workspace } from './model';
import { emptyWorkspace } from './model';
import { WorkspaceSession, type SessionState, type WorkspaceRepository } from './workspaceSession';
export type { SyncState } from './workspaceSession';
type Context = SessionState & {
  update: (fn: (current: Workspace) => Workspace) => void;
  recover: (workspace: Workspace) => void;
  triggerSync: () => Promise<boolean>;
  flush: () => Promise<void>;
};
const WorkspaceContext = createContext<Context | null>(null);
let dbPromise: ReturnType<typeof openDB> | undefined;
function database() {
  return (dbPromise ??= openDB('ainotes-workspace', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('workspace')) db.createObjectStore('workspace');
    }
  }));
}
const repository: WorkspaceRepository = serializeRepository({
  read: async (key) => (await database()).get('workspace', key),
  write: async (key, value) => {
    await (await database()).put('workspace', value, key);
  },
  quarantine: async (key, value) => {
    await (await database()).put('workspace', value, `recovery:${key}:${Date.now()}`);
  }
});
const loading: Context = {
  data: emptyWorkspace(),
  loaded: false,
  saving: false,
  syncState: 'local',
  error: '',
  savedAt: '',
  needsRecovery: false,
  update: () => {},
  recover: () => {},
  triggerSync: async () => false,
  flush: async () => {}
};
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <WorkspaceContext.Provider value={loading}>{children}</WorkspaceContext.Provider>;
  return (
    <AccountWorkspace key={user?.uid || 'anonymous'} accountKey={user ? `user:${user.uid}` : 'main'}>
      {children}
    </AccountWorkspace>
  );
}
function AccountWorkspace({ children, accountKey }: { children: ReactNode; accountKey: string }) {
  const { token, invalidateSession } = useAuth();
  const [session, setSession] = useState(
    () => new WorkspaceSession(accountKey, repository, fetch, invalidateSession)
  );
  const state = useSyncExternalStore(session.subscribe, session.snapshot);
  useEffect(() => {
    // A fresh instance also makes StrictMode setup/cleanup safe.
    const current = new WorkspaceSession(accountKey, repository, fetch, invalidateSession);
    setSession(current);
    void current.load();
    return () => current.dispose();
  }, [accountKey, invalidateSession]);
  useEffect(() => {
    if (state.loaded) session.setToken(token);
  }, [session, state.loaded, token]);
  useEffect(() => {
    const retry = () => {
      void session.sync();
    };
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [session]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.dataset.theme =
        state.data.theme === 'system' ? (media.matches ? 'dark' : 'light') : state.data.theme;
      document.documentElement.style.setProperty('--reading-scale', String(state.data.fontScale));
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [state.data.theme, state.data.fontScale]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (state.saving || state.error) event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [state.saving, state.error]);
  const update = useCallback((fn: (current: Workspace) => Workspace) => session.update(fn), [session]);
  const recover = useCallback((ws: Workspace) => session.recover(ws), [session]);
  return (
    <WorkspaceContext.Provider
      value={{ ...state, update, recover, triggerSync: session.sync, flush: session.flush }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within a WorkspaceProvider');
  return context;
}
