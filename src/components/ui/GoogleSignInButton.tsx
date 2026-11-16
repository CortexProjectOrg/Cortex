import { useEffect, useRef } from 'react';
import { useAuth } from '../../lib/auth';

export function GoogleSignInButton() {
  const ref = useRef<HTMLDivElement>(null);
  const { signInState, retrySignIn, renderGoogleButton } = useAuth();
  useEffect(() => {
    if (ref.current) renderGoogleButton(ref.current);
  }, [renderGoogleButton]);
  return (
    <div className="google-sign-in">
      {signInState === 'loading' && <p role="status">Loading Google sign-in…</p>}
      <div ref={ref} hidden={signInState !== 'ready'} />
      {signInState === 'error' && (
        <button type="button" className="button secondary" onClick={retrySignIn}>
          Retry Google sign-in
        </button>
      )}
    </div>
  );
}
