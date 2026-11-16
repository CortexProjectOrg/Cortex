import type { ReactNode } from 'react';
import { cleanClientId } from '../../shared/googleConfig';
import { loadGoogleIdentity, type GoogleIdentity } from './googleIdentity';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  picture: string;
}
interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  clientId: string | null;
  authWarning: string | null;
  isLoading: boolean;
  signInState: 'loading' | 'ready' | 'error';
  retrySignIn: () => void;
  logout: () => void;
  invalidateSession: () => void;
  renderGoogleButton: (element: HTMLElement) => void;
}
const AuthContext = createContext<AuthContextType | null>(null);
const SESSION_KEY = 'ainotes-session';
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [signInState, setSignInState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const identity = useRef<GoogleIdentity | null>(null);
  const retrySignIn = useCallback(() => setRetry((value) => value + 1), []);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const generation = useRef(0);
  const cancelPending = useCallback(() => {
    generation.current++;
  }, []);
  const invalidateSession = useCallback(() => {
    setToken(null);
    setAuthError('Sign in again to sync. Your notes are still on this device.');
  }, []);
  const acceptCredential = useCallback(async (jwt: string, cachedUser?: UserProfile) => {
    const attempt = ++generation.current;
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwt}` },
        signal: AbortSignal.timeout(8000)
      });
      if (!res.ok) throw new Error('Sign-in could not be verified.');
      const result = await res.json();
      if (!result.user?.uid || attempt !== generation.current) return;
      setUser(result.user);
      setToken(jwt);
      setAuthError(null);
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: jwt, user: result.user }));
      } catch {
        /* Session remains in memory. */
      }
    } catch {
      if (attempt !== generation.current) return;
      // Previously verified profile selects only a local cache. A token is never enabled offline.
      if (cachedUser) setUser(cachedUser);
      setToken(null);
      setAuthError('Sign in again to sync. Your notes are still on this device.');
    } finally {
      if (attempt === generation.current) setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    identity.current = null;
    setSignInState('loading');
    setSetupError(null);
    const setup = async () => {
      try {
        let configured: string | null = null;
        try {
          const response = await fetch('/api/auth/config', {
            signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)])
          });
          if (!response.ok) throw new Error('Sign-in configuration unavailable.');
          configured = cleanClientId((await response.json()).clientId);
        } catch (error) {
          if (controller.signal.aborted) return;
          // Standalone Vite development can use the explicitly configured public build ID.
          configured = cleanClientId(import.meta.env.VITE_GOOGLE_CLIENT_ID);
          if (!configured) throw error;
        }
        if (!configured) throw new Error('Google sign-in is not configured for this app.');
        if (controller.signal.aborted) return;
        setClientId(configured);
        const google = await loadGoogleIdentity();
        if (controller.signal.aborted) return;
        google.initialize({
          client_id: configured,
          auto_select: false,
          callback: (response) => {
            if (response.credential) void acceptCredential(response.credential);
          }
        });
        identity.current = google;
        setSignInState('ready');
      } catch (error) {
        if (controller.signal.aborted) return;
        setSetupError(
          error instanceof Error && error.message.startsWith('Google sign-in')
            ? error.message
            : 'Google sign-in could not load. Check your connection and try again.'
        );
        setSignInState('error');
      }
    };
    void setup();
    return () => controller.abort();
  }, [retry, acceptCredential]);
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      const legacyToken = localStorage.getItem('ainotes-google-token');
      localStorage.removeItem('ainotes-google-token');
      if (saved?.token || legacyToken)
        void acceptCredential(
          saved?.token || legacyToken,
          saved?.user &&
            ['uid', 'email', 'name', 'picture'].every((key) => typeof saved.user[key] === 'string') &&
            saved.user.uid
            ? saved.user
            : undefined
        );
      else setIsLoading(false);
    } catch {
      setIsLoading(false);
    }
    return cancelPending;
  }, [acceptCredential, cancelPending]);
  useEffect(() => {
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      const timer = window.setTimeout(invalidateSession, Math.max(0, payload.exp * 1000 - Date.now()));
      return () => clearTimeout(timer);
    } catch {
      invalidateSession();
    }
  }, [token, invalidateSession]);
  const renderGoogleButton = useCallback(
    (element: HTMLElement) => {
      if (signInState !== 'ready' || !identity.current) return;
      element.replaceChildren();
      identity.current.renderButton(element, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'pill'
      });
    },
    [signInState]
  );
  const logout = useCallback(() => {
    generation.current++;
    identity.current?.disableAutoSelect();
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* No persisted session. */
    }
    setToken(null);
    setUser(null);
    setAuthError(null);
    setIsLoading(false);
  }, []);
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        clientId,
        isLoading,
        logout,
        invalidateSession,
        signInState,
        retrySignIn,
        renderGoogleButton,
        authWarning: setupError || authError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
