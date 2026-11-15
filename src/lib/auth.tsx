import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

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
  isLoading: boolean;
  loginWithGoogle: () => void;
  logout: () => void;
  renderGoogleButton: (element: HTMLElement) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(
    (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || null
  );
  const [isLoading, setIsLoading] = useState(true);

  // Fetch client ID if not provided in Vite env
  useEffect(() => {
    if (!clientId) {
      fetch('/api/auth/config')
        .then(res => res.json())
        .then(data => {
          if (data?.clientId) setClientId(data.clientId);
        })
        .catch(() => {});
    }
  }, [clientId]);

  // Handle Google token
  const handleCredentialResponse = useCallback((response: any) => {
    if (!response?.credential) return;
    const jwt = response.credential;
    setToken(jwt);
    localStorage.setItem('quaos-google-token', jwt);

    const payload = parseJwt(jwt);
    if (payload) {
      const profile: UserProfile = {
        uid: payload.sub,
        email: payload.email || '',
        name: payload.name || payload.email?.split('@')[0] || 'Scholar',
        picture: payload.picture || ''
      };
      setUser(profile);
    }
  }, []);

  // Restore stored session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('quaos-google-token');
    if (savedToken) {
      const payload = parseJwt(savedToken);
      // Check expiration
      if (payload && (!payload.exp || payload.exp * 1000 > Date.now())) {
        setToken(savedToken);
        setUser({
          uid: payload.sub,
          email: payload.email || '',
          name: payload.name || payload.email?.split('@')[0] || 'Scholar',
          picture: payload.picture || ''
        });
      } else {
        localStorage.removeItem('quaos-google-token');
      }
    }
    setIsLoading(false);
  }, []);

  // Initialize Google Identity Services
  useEffect(() => {
    if (!clientId || typeof window === 'undefined') return;

    const checkGsi = () => {
      const google = (window as any).google;
      if (google?.accounts?.id) {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });
      }
    };

    if ((window as any).google?.accounts?.id) {
      checkGsi();
    } else {
      const timer = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          checkGsi();
          clearInterval(timer);
        }
      }, 300);
      return () => clearInterval(timer);
    }
  }, [clientId, handleCredentialResponse]);

  const loginWithGoogle = useCallback(() => {
    const google = (window as any).google;
    if (google?.accounts?.id) {
      google.accounts.id.prompt();
    } else {
      alert('Google Sign-In is initializing or client ID is not configured.');
    }
  }, []);

  const renderGoogleButton = useCallback(
    (element: HTMLElement) => {
      const google = (window as any).google;
      if (google?.accounts?.id && element) {
        element.innerHTML = '';
        google.accounts.id.renderButton(element, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'pill'
        });
      }
    },
    []
  );

  const logout = useCallback(() => {
    const google = (window as any).google;
    if (google?.accounts?.id && user?.email) {
      google.accounts.id.revoke(user.email, () => {});
    }
    localStorage.removeItem('quaos-google-token');
    setToken(null);
    setUser(null);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        clientId,
        isLoading,
        loginWithGoogle,
        logout,
        renderGoogleButton
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
