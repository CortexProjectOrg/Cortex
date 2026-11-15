import React, { useRef, useEffect } from 'react';
import {
  Sun,
  Moon,
  FolderOpen,
  ArrowDownToLine,
  Download,
  Upload,
  User,
  LogOut,
  RefreshCw,
  Check,
  Cloud
} from 'lucide-react';
import { useWorkspace } from '../lib/workspace';
import { useAuth } from '../lib/auth';
import { validateWorkspace, mergeWorkspace } from '../lib/model';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  installEvent: any;
  installed: boolean;
  offlineReady: boolean;
}

export function SettingsModal({
  open,
  onClose,
  onShowToast,
  installEvent,
  installed,
  offlineReady
}: SettingsModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  const { data, update, syncState, triggerSync } = useWorkspace();
  const { user, loginWithGoogle, logout, clientId, renderGoogleButton } = useAuth();

  useEffect(() => {
    if (open && !dialogRef.current?.open) {
      dialogRef.current?.showModal();
    } else if (!open && dialogRef.current?.open) {
      dialogRef.current?.close();
    }
  }, [open]);

  useEffect(() => {
    if (open && !user && googleBtnContainerRef.current) {
      renderGoogleButton(googleBtnContainerRef.current);
    }
  }, [open, user, renderGoogleButton]);

  const exportBackup = () => {
    const backup = {
      ...data,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ainotes-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onShowToast('Workspace backup exported successfully.');
  };

  const importBackup = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > 30 * 1024 * 1024) throw new Error('Backup file must be smaller than 30MB');
      const text = await file.text();
      const incoming = validateWorkspace(JSON.parse(text));
      update(current => mergeWorkspace(current, incoming));
      onShowToast(`Merged ${incoming.notes.length} notes and study progress.`);
    } catch (err: any) {
      onShowToast(err?.message || 'Failed to import backup.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="modal settings-modal"
      onCancel={e => {
        e.preventDefault();
        onClose();
      }}
      onClick={e => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="modal-inner">
        <div className="modal-heading">
          <h2>Settings & Synchronisation</h2>
          <button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Google Account & Cross-Device Cloud Sync */}
        <section className="settings-section">
          <div className="small-heading">
            <Cloud size={17} /> Cross-Device Cloud Sync
          </div>
          {user ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: 'var(--soft)',
                borderRadius: '8px',
                gap: '14px',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600
                    }}
                  >
                    {user.name[0]}
                  </div>
                )}
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px' }}>{user.name}</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>{user.email}</p>
                  <span
                    style={{
                      fontSize: '11px',
                      color: syncState === 'synced' ? 'var(--accent)' : 'var(--muted)',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '4px'
                    }}
                  >
                    <Check size={12} /> Cloud sync active
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="button small secondary"
                  title="Force Sync Now"
                  onClick={async () => {
                    await triggerSync();
                    onShowToast('Synced with cloud.');
                  }}
                >
                  <RefreshCw size={13} /> Sync Now
                </button>
                <button
                  type="button"
                  className="button small secondary"
                  title="Sign out"
                  onClick={logout}
                >
                  <LogOut size={13} /> Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '14px' }}>
                Sign in with your Google account to automatically persist your notes, stylus
                drawings, and lecture progress between your tablet and PC.
              </p>
              <div ref={googleBtnContainerRef} style={{ marginBottom: '10px' }} />
              <button
                type="button"
                className="button primary"
                onClick={loginWithGoogle}
                style={{ width: '100%' }}
              >
                Sign In with Google
              </button>
              {!clientId && (
                <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '8px' }}>
                  Note: Deploy with <code>GOOGLE_AUTH_CLIENT_API_KEY</code> set in your Vercel
                  environment to activate Google sign-in.
                </p>
              )}
            </div>
          )}
        </section>

        {/* Reading Comfort */}
        <section className="settings-section">
          <div className="small-heading">
            <Sun size={17} /> Reading Comfort
          </div>
          <div className="setting-row">
            <span>Appearance</span>
            <div className="segmented">
              {(['light', 'dark', 'system'] as const).map(theme => (
                <button
                  key={theme}
                  type="button"
                  className={data.theme === theme ? 'selected' : ''}
                  onClick={() => update(cur => ({ ...cur, theme }))}
                >
                  {theme === 'light' ? (
                    <Sun size={14} />
                  ) : theme === 'dark' ? (
                    <Moon size={14} />
                  ) : null}
                  {theme[0].toUpperCase() + theme.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="setting-row">
            <span>Reading Size</span>
            <div className="segmented">
              {[0.9, 1, 1.12, 1.25].map((scale, index) => (
                <button
                  key={scale}
                  type="button"
                  className={data.fontScale === scale ? 'selected' : ''}
                  aria-label={`Reading size ${index + 1}`}
                  onClick={() => update(cur => ({ ...cur, fontScale: scale }))}
                  style={{ fontSize: `${12 + index * 2}px` }}
                >
                  A
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Local Backup & Restore */}
        <section className="settings-section">
          <div className="small-heading">
            <FolderOpen size={17} /> Offline Backups
          </div>
          <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
            All your notes, drawings, and progress are cached locally in your browser's IndexedDB.
            Export a backup file to keep an offline JSON copy.
          </p>
          <div className="backup-buttons">
            <button type="button" className="button primary" onClick={exportBackup}>
              <Download size={16} /> Export Backup
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} /> Import Backup
            </button>
            <input
              ref={fileInputRef}
              hidden
              type="file"
              accept=".json,application/json"
              onChange={e => importBackup(e.target.files?.[0])}
            />
          </div>
        </section>

        {/* PWA & Tablet Installation */}
        <section className="settings-section">
          <div className="small-heading">
            <ArrowDownToLine size={17} /> PWA & Tablet Installation
          </div>
          <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
            {installed
              ? 'AINotes is running as an installed PWA on this device.'
              : 'Install this application to your home screen on iPad or Android tablet for full-screen stylus input.'}
          </p>
          {installEvent && !installed && (
            <button
              type="button"
              className="button secondary"
              onClick={async () => {
                await installEvent.prompt();
                await installEvent.userChoice;
              }}
            >
              Install AINotes App
            </button>
          )}
          <div className="offline-setting" style={{ marginTop: '10px' }}>
            <span className="status-dot" />
            <span>
              {offlineReady ? 'All 60 study lectures available offline' : 'Offline ready'}
            </span>
          </div>
        </section>
      </div>
    </dialog>
  );
}
