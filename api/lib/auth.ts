export interface GoogleUser {
  uid: string;
  email: string;
  name: string;
  picture: string;
}

export async function verifyGoogleToken(token: string): Promise<GoogleUser | null> {
  if (!token || typeof token !== 'string') return null;

  try {
    const rawClientId =
      process.env.GOOGLE_AUTH_CLIENT_API_KEY ||
      process.env.GOOGLE_CLIENT_ID ||
      process.env.VITE_GOOGLE_CLIENT_ID ||
      '';
    const clientId = rawClientId.trim().replace(/^["']|["']$/g, '');

    const url = new URL('https://oauth2.googleapis.com/tokeninfo');
    url.searchParams.set('id_token', token);

    const response = await fetch(url.toString());
    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // 1. Strict issuer verification: token MUST originate from Google
    if (data.iss !== 'accounts.google.com' && data.iss !== 'https://accounts.google.com') {
      console.warn('Security Warning: Rejected token with invalid issuer:', data.iss);
      return null;
    }

    // 2. Strict audience verification: token MUST be issued specifically to our Client ID
    if (clientId) {
      const isMatch = data.aud === clientId || data.azp === clientId;
      if (!isMatch) {
        console.warn(
          'Security Warning: Rejected token with audience mismatch. Token aud:',
          data.aud,
          'Expected:',
          clientId
        );
        return null;
      }
    }

    // 3. Subject identifier (Google user ID) MUST be valid
    if (!data.sub || typeof data.sub !== 'string' || data.sub.trim().length === 0) {
      console.warn('Security Warning: Rejected token missing valid sub claim');
      return null;
    }

    // 4. Token expiration verification
    if (data.exp && Number(data.exp) * 1000 < Date.now()) {
      console.warn('Security Warning: Rejected expired token');
      return null;
    }

    // 5. Email verification: require verified email if present
    if (data.email && (data.email_verified === 'false' || data.email_verified === false)) {
      console.warn('Security Warning: Rejected unverified email account');
      return null;
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
  if (!header || typeof header !== 'string') return null;
  const match = header.trim().match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}
