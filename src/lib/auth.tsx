import type { ReactNode } from 'react';
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
  loginWithGoogle: () => void;
  logout: () => void;
  invalidateSession: () => void;
  renderGoogleButton: (element: HTMLElement) => void;
}
export function cleanClientId(id: string | null | undefined): string | null {
  if (!id) return null;
  const trimmed = id.trim().replace(/^["']|["']$/g, '');
  return trimmed.length > 0 ? trimmed : null;
}

export function inspectClientId(id: string | null | undefined): { isValid: boolean; warning?: string } {
  const cleaned = cleanClientId(id);
  const isValid =
    !!cleaned && cleaned.endsWith('.apps.googleusercontent.com') && !cleaned.includes('placeholder');
  return { isValid, warning: isValid ? undefined : 'Sign-in is unavailable.' };
}

const AuthContext = createContext<AuthContextType | null>(null);
const SESSION_KEY = 'ainotes-session';
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [clientId, setClientId] = useState(cleanClientId(import.meta.env.VITE_GOOGLE_CLIENT_ID));
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
    if (!clientId)
      void fetch('/api/auth/config', { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((v) => {
          if (v?.clientId) setClientId(cleanClientId(v.clientId));
        })
        .catch(() => {});
    return () => controller.abort();
  }, [clientId]);
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
  useEffect(() => {
    if (!inspectClientId(clientId).isValid) return;
    const initialize = () => {
      const google = (window as any).google;
      if (!google?.accounts?.id) return false;
      google.accounts.id.initialize({
        client_id: clientId,
        auto_select: false,
        callback: (response: { credential?: string }) => {
          if (response.credential) void acceptCredential(response.credential);
        }
      });
      return true;
    };
    if (initialize()) return;
    const timer = setInterval(() => {
      if (initialize()) clearInterval(timer);
    }, 300);
    return () => clearInterval(timer);
  }, [clientId, acceptCredential]);
  const loginWithGoogle = useCallback(() => {
    const google = (window as any).google;
    if (inspectClientId(clientId).isValid && google?.accounts?.id) google.accounts.id.prompt();
    else setAuthError('Sign-in is unavailable. Please try again later.');
  }, [clientId]);
  const renderGoogleButton = useCallback(
    (element: HTMLElement) => {
      const google = (window as any).google;
      if (element && inspectClientId(clientId).isValid && google?.accounts?.id) {
        element.replaceChildren();
        google.accounts.id.renderButton(element, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'pill'
        });
      }
    },
    [clientId]
  );
  const logout = useCallback(() => {
    generation.current++;
    (window as any).google?.accounts?.id?.disableAutoSelect();
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
        loginWithGoogle,
        renderGoogleButton,
        authWarning: authError || inspectClientId(clientId).warning || null
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
