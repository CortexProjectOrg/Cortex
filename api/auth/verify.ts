import { extractBearerToken, verifyGoogleToken } from '../lib/auth';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = extractBearerToken(req.headers.authorization) || req.body?.token;
  if (!token) {
    return res.status(401).json({ error: 'Missing authentication token' });
  }

  const user = await verifyGoogleToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired Google token' });
  }

  return res.status(200).json({ user });
}
