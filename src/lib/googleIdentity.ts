export interface GoogleIdentity {
  initialize(options: {
    client_id: string;
    auto_select: boolean;
    callback: (response: { credential?: string }) => void;
  }): void;
  renderButton(
    element: HTMLElement,
    options: { theme: string; size: string; text: string; shape: string }
  ): void;
  disableAutoSelect(): void;
}
declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleIdentity } };
  }
}

let pending: Promise<GoogleIdentity> | null = null;
export function loadGoogleIdentity(): Promise<GoogleIdentity> {
  const ready = window.google?.accounts?.id;
  if (ready) return Promise.resolve(ready);
  if (pending) return pending;
  pending = new Promise<GoogleIdentity>((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    const created = !script;
    script ??= document.createElement('script');
    const target = script;
    const finish = () => {
      clearTimeout(timeout);
      clearInterval(poll);
      target.removeEventListener('load', loaded);
      target.removeEventListener('error', failed);
    };
    const loaded = () => {
      const identity = window.google?.accounts?.id;
      if (identity) {
        finish();
        resolve(identity);
      }
    };
    const failed = () => {
      finish();
      target.remove();
      reject(new Error('Google sign-in could not load. Check your connection and try again.'));
    };
    const timeout = setTimeout(failed, 10_000);
    const poll = setInterval(loaded, 100);
    target.addEventListener('load', loaded);
    target.addEventListener('error', failed);
    if (created) {
      target.src = 'https://accounts.google.com/gsi/client';
      target.async = true;
      document.head.append(target);
    }
    loaded();
  }).then(
    (identity) => {
      pending = null;
      return identity;
    },
    (error) => {
      pending = null;
      throw error;
    }
  );
  return pending;
}
