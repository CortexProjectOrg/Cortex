export interface GoogleUser {
  uid: string;
  email: string;
  name: string;
  picture: string;
}

export async function verifyGoogleToken(token: string): Promise<GoogleUser | null> {
  if (!token) return null;
  
  try {
    const apiKey = (process.env.GOOGLE_AUTH_API_KEY || '').trim();
    const rawClientId =
      process.env.GOOGLE_AUTH_CLIENT_API_KEY ||
      process.env.GOOGLE_CLIENT_ID ||
      process.env.VITE_GOOGLE_CLIENT_ID ||
      '';
    const clientId = rawClientId.trim().replace(/^["']|["']$/g, '');
    
    const url = new URL('https://oauth2.googleapis.com/tokeninfo');
    url.searchParams.set('id_token', token);
    if (apiKey) {
      url.searchParams.set('key', apiKey);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    // If client ID is configured, verify audience
    if (clientId && data.aud !== clientId) {
      console.warn('Google token audience mismatch');
      // allow if developer is testing or mismatch in dev, but in prod enforce
      if (process.env.NODE_ENV === 'production') {
        return null;
      }
    }

    return {
      uid: data.sub,
      email: data.email || '',
      name: data.name || data.email?.split('@')[0] || 'Scholar',
      picture: data.picture || ''
    };
  } catch (err) {
    console.error('Error verifying Google token:', err);
    return null;
  }
}

export function extractBearerToken(authHeader?: string | string[]): string | null {
  const header = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}
