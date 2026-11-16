import { extractBearerToken, verifyGoogleToken } from '../lib/auth.js';
import { allowRequest, type Request, type Response } from '../lib/http.js';
export default async function handler(req: Request, res: Response) {
  if (!allowRequest(req, res, ['POST'])) return;
  const token = extractBearerToken(req.headers.authorization);
  const user = token && (await verifyGoogleToken(token));
  if (!user) return res.status(401).json({ error: 'Please sign in again.' });
  return res.status(200).json({ user });
}
