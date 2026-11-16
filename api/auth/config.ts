import { configuredClientId } from '../lib/auth';
import { allowRequest, type Request, type Response } from '../lib/http';
export default function handler(req: Request, res: Response) {
  if (!allowRequest(req, res, ['GET'])) return;
  return res.status(200).json({ clientId: configuredClientId() });
}
