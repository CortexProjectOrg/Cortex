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
  authWarning: string | null;
  isLoading: boolean;
  loginWithGoogle: () => void;
  logout: () => void;
  renderGoogleButton: (element: HTMLElement) => void;
}

export function cleanClientId(id: string | null | undefined): string | null {
  if (!id) return null;
  const trimmed = id.trim().replace(/^["']|["']$/g, '');
  return trimmed.length > 0 ? trimmed : null;
}

export function inspectClientId(id: string | null | undefined): { isValid: boolean; warning?: string } {
  const cleaned = cleanClientId(id);
  if (!cleaned) {
    return {
      isValid: false,
      warning: 'Google Client ID is not configured in environment variables (GOOGLE_AUTH_CLIENT_API_KEY, GOOGLE_CLIENT_ID, or VITE_GOOGLE_CLIENT_ID).'
    };
  }
  if (cleaned.includes('your_google_oauth_client_id') || cleaned.includes('placeholder')) {
    return {
      isValid: false,
      warning:
        'Default placeholder Client ID detected. Update GOOGLE_AUTH_CLIENT_API_KEY or VITE_GOOGLE_CLIENT_ID with a valid OAuth 2.0 Web Client ID from Google Cloud Console.'
    };
  }
  if (cleaned.startsWith('AIza')) {
    return {
      isValid: false,
      warning:
        'A Google Cloud API Key (starts with AIza...) was provided instead of an OAuth 2.0 Web Client ID (ends with .apps.googleusercontent.com).'
    };
  }
  if (!cleaned.includes('.apps.googleusercontent.com')) {
    return {
      isValid: false,
      warning:
        'Invalid Client ID format. A Google OAuth 2.0 Web Client ID must end in ".apps.googleusercontent.com".'
    };
  }
  return { isValid: true };
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
    cleanClientId(import.meta.env.VITE_GOOGLE_CLIENT_ID as string)
  );
  const [isLoading, setIsLoading] = useState(true);

  // Fetch client ID if not provided in Vite env
  useEffect(() => {
    if (!clientId) {
      fetch('/api/auth/config')
        .then(res => res.json())
        .then(data => {
          if (data?.clientId) {
            const cleaned = cleanClientId(data.clientId);
            if (cleaned) setClientId(cleaned);
          }
        })
        .catch(() => {});
    }
  }, [clientId]);

  const clientInspection = inspectClientId(clientId);
  const authWarning = clientInspection.isValid ? null : (clientInspection.warning || 'Google Client ID is missing or invalid.');

  // Handle Google token
  const handleCredentialResponse = useCallback((response: any) => {
    if (!response?.credential) return;
    const jwt = response.credential;
    setToken(jwt);
    localStorage.setItem('ainotes-google-token', jwt);

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
    const savedToken = localStorage.getItem('ainotes-google-token');
    if (savedToken) {
      const payload = parseJwt(savedToken);
      // Check expiration
      if (payload && (!payload.exp || payload.exp * 1000 > Date.now())) {
        setToken(savedToken);
        localStorage.setItem('ainotes-google-token', savedToken);
        setUser({
          uid: payload.sub,
          email: payload.email || '',
          name: payload.name || payload.email?.split('@')[0] || 'Scholar',
          picture: payload.picture || ''
        });
      } else {
        localStorage.removeItem('ainotes-google-token');
      }
    }
    setIsLoading(false);
  }, []);

  // Initialize Google Identity Services
  useEffect(() => {
    if (!clientId || !clientInspection.isValid || typeof window === 'undefined') return;

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
  }, [clientId, clientInspection.isValid, handleCredentialResponse]);

  const loginWithGoogle = useCallback(() => {
    const inspection = inspectClientId(clientId);
    if (!inspection.isValid) {
      alert(`Google Sign-In configuration required:\n${inspection.warning}\n\nPlease check Google Cloud Console credentials.`);
      return;
    }
    const google = (window as any).google;
    if (google?.accounts?.id) {
      google.accounts.id.prompt();
    } else {
      alert('Google Sign-In library is loading or blocked by an ad-blocker. Please try again.');
    }
  }, [clientId]);

  const renderGoogleButton = useCallback(
    (element: HTMLElement) => {
      const google = (window as any).google;
      const inspection = inspectClientId(clientId);
      if (google?.accounts?.id && element && inspection.isValid && clientId) {
        element.innerHTML = '';
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
    const google = (window as any).google;
    if (google?.accounts?.id && user?.email) {
      google.accounts.id.revoke(user.email, () => {});
    }
    localStorage.removeItem('ainotes-google-token');
    setToken(null);
    setUser(null);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        clientId,
        authWarning,
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
