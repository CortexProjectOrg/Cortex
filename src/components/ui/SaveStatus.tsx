import { useWorkspace } from '../../lib/workspace';
export function SaveStatus() {
  const { saving, error, savedAt, syncState } = useWorkspace();
  const text = error
    ? 'Save failed — export a backup'
    : saving
      ? 'Saving…'
      : syncState === 'syncing'
        ? 'Syncing…'
        : syncState === 'synced'
          ? 'Synced'
          : syncState === 'pending'
            ? 'Waiting to sync'
            : syncState === 'error'
              ? 'Cloud sync unavailable'
              : savedAt
                ? 'Saved on this device'
                : 'On this device';
  return (
    <span role="status" className="save-status">
      {text}
    </span>
  );
}
