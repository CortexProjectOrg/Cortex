import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { openDB } from 'idb';
import { emptyWorkspace, validateWorkspace, mergeWorkspace } from './model';
import type { Workspace } from './model';
import { useAuth } from './auth';

export type SyncState = 'local' | 'syncing' | 'synced' | 'error';

type Context = {
  data: Workspace;
  update: (fn: (current: Workspace) => Workspace) => void;
  loaded: boolean;
  saving: boolean;
  syncState: SyncState;
  error: string;
  savedAt: string;
  triggerSync: () => Promise<void>;
};

const WorkspaceContext = createContext<Context | null>(null);

const dbPromise = (async () => {
  const db = await openDB('ainotes-workspace', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('workspace')) {
        db.createObjectStore('workspace');
      }
    }
  });

  return db;
})();

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [data, setData] = useState<Workspace>(emptyWorkspace);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>('local');
  const [error, setError] = useState('');
  const [savedAt, setSavedAt] = useState('');

  const currentUserId = user?.uid || null;
  const prevUserIdRef = useRef<string | null>(null);
  const initialMountRef = useRef(true);

  const writeQueue = useRef(Promise.resolve());
  const syncTimer = useRef<number | null>(null);

  // 1. Initial Load from local IndexedDB (user-scoped)
  useEffect(() => {
    let active = true;
    dbPromise
      .then(async db => {
        if (currentUserId) {
          const userVal = await db.get('workspace', `user:${currentUserId}`);
          if (userVal) return userVal;
        }
        return await db.get('workspace', 'main');
      })
      .then(value => {
        if (active && value) {
          try {
            setData(validateWorkspace(value));
          } catch {
            setData(emptyWorkspace());
          }
        }
      })
      .catch(() => {
        if (active) setError('Browser storage is unavailable. Export a backup to keep your work.');
      })
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  // 2. Strict Tenant Isolation on User Switch / Logout (Prevents Cross-User Bleed on Shared Devices)
  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;
      prevUserIdRef.current = currentUserId;
      return;
    }

    if (prevUserIdRef.current !== currentUserId) {
      const wasAnonymous = prevUserIdRef.current === null;
      prevUserIdRef.current = currentUserId;

      // User logged out: clear screen and reset to empty state so previous user data isn't exposed
      if (!currentUserId) {
        setData(emptyWorkspace());
        setSyncState('local');
        return;
      }

      // User logged in: load user's private workspace
      const userKey = `user:${currentUserId}`;
      dbPromise
        .then(db => db.get('workspace', userKey))
        .then(cached => {
          if (cached) {
            setData(validateWorkspace(cached));
          } else if (!wasAnonymous) {
            // New user login after another user: clear state to prevent mixing
            setData(emptyWorkspace());
          }
        })
        .catch(() => {});
    }
  }, [currentUserId]);

  // 3. Persist to local IndexedDB whenever state updates (scoped to user)
  useEffect(() => {
    if (!loaded) return;
    let active = true;
    setSaving(true);

    writeQueue.current = writeQueue.current
      .catch(() => {})
      .then(async () => {
        const db = await dbPromise;
        const key = currentUserId ? `user:${currentUserId}` : 'main';
        await db.put('workspace', data, key);
      });

    writeQueue.current
      .then(() => {
        if (active) {
          setSaving(false);
          setSavedAt(new Date().toISOString());
          setError('');
        }
      })
      .catch(() => {
        if (active) {
          setSaving(false);
          setError('Local changes could not be saved. Export a backup before closing.');
        }
      });

    return () => {
      active = false;
    };
  }, [data, loaded, currentUserId]);

  // 3. Theme & Font Scale application
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.dataset.theme =
        data.theme === 'system' ? (media.matches ? 'dark' : 'light') : data.theme;
      document.documentElement.style.setProperty('--reading-scale', String(data.fontScale));
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [data.theme, data.fontScale]);

  // 4. Cloud Sync with Vercel Serverless Backend
  const syncWithCloud = useCallback(
    async (currentWorkspace: Workspace) => {
      if (!token) {
        setSyncState('local');
        return;
      }

      setSyncState('syncing');
      try {
        const res = await fetch('/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ workspace: currentWorkspace })
        });

        if (res.ok) {
          const json = await res.json();
          if (json.workspace) {
            const canonical = validateWorkspace(json.workspace);
            setData(prev => mergeWorkspace(prev, canonical));
            setSyncState('synced');
            return;
          }
        }
        setSyncState('local');
      } catch (err) {
        console.warn('Sync failed, keeping local:', err);
        setSyncState('error');
      }
    },
    [token]
  );

  // Initial fetch and merge on Google Login
  useEffect(() => {
    if (!token || !loaded) return;

    let active = true;
    fetch('/api/sync', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => (res.ok ? res.json() : null))
      .then(json => {
        if (active && json?.workspace) {
          setData(current => {
            const merged = mergeWorkspace(current, validateWorkspace(json.workspace));
            // Push merged back to ensure server is in sync
            syncWithCloud(merged);
            return merged;
          });
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [token, loaded, syncWithCloud]);

  // Debounced cloud sync on data change
  useEffect(() => {
    if (!token || !loaded) return;

    if (syncTimer.current) {
      window.clearTimeout(syncTimer.current);
    }

    syncTimer.current = window.setTimeout(() => {
      syncWithCloud(data);
    }, 2500);

    return () => {
      if (syncTimer.current) window.clearTimeout(syncTimer.current);
    };
  }, [data, token, loaded, syncWithCloud]);

  const update = useCallback((fn: (current: Workspace) => Workspace) => {
    setData(current => fn(current));
  }, []);

  const triggerSync = useCallback(async () => {
    await syncWithCloud(data);
  }, [data, syncWithCloud]);

  return (
    <WorkspaceContext.Provider
      value={{
        data,
        update,
        loaded,
        saving,
        syncState,
        error,
        savedAt,
        triggerSync
      }}
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
