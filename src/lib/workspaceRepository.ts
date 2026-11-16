import type { WorkspaceRepository } from './workspaceSession';

/** Keep account reads behind every already-scheduled write, including across React remounts. */
export function serializeRepository(storage: WorkspaceRepository): WorkspaceRepository {
  const pending = new Map<string, Promise<void>>();
  return {
    async read(key) {
      await pending.get(key);
      return storage.read(key);
    },
    write(key, value) {
      const write = (pending.get(key) ?? Promise.resolve())
        .catch(() => {})
        .then(() => storage.write(key, value));
      pending.set(key, write);
      void write
        .finally(() => {
          if (pending.get(key) === write) pending.delete(key);
        })
        .catch(() => {});
      return write;
    },
    quarantine: (key, value) => storage.quarantine(key, value)
  };
}
