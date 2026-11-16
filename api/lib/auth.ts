import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

export interface GoogleUser {
  uid: string;
  email: string;
  name: string;
  picture: string;
}
const keys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'), {
  timeoutDuration: 5000
});
export function configuredClientId(): string {
  return (
    process.env.GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_AUTH_CLIENT_API_KEY ||
    process.env.VITE_GOOGLE_CLIENT_ID ||
    ''
  )
    .trim()
    .replace(/^["']|["']$/g, '');
}
export async function verifyGoogleToken(
  token: string,
  keySet: JWTVerifyGetKey = keys
): Promise<GoogleUser | null> {
  const audience = configuredClientId();
  if (
    !audience.endsWith('.apps.googleusercontent.com') ||
    typeof token !== 'string' ||
    !token ||
    token.length > 16_384
  )
    return null;
  try {
    const { payload } = await jwtVerify(token, keySet, {
      issuer: ['accounts.google.com', 'https://accounts.google.com'],
      audience,
      algorithms: ['RS256'],
      requiredClaims: ['sub', 'exp', 'iat', 'aud', 'iss']
    });
    if (
      !payload.sub ||
      payload.sub.length > 128 ||
      !Number.isFinite(payload.exp) ||
      (payload.email && payload.email_verified !== true)
    )
      return null;
    return {
      uid: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : '',
      name: typeof payload.name === 'string' ? payload.name : 'Student',
      picture:
        typeof payload.picture === 'string' && payload.picture.startsWith('https://') ? payload.picture : ''
    };
  } catch {
    return null;
  }
}
export function extractBearerToken(authHeader?: string | string[]): string | null {
  const header = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  return typeof header === 'string' ? header.trim().match(/^Bearer\s+(\S+)$/i)?.[1] || null : null;
}
