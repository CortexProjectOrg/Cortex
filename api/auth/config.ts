import { configuredClientId } from '../../shared/googleConfig.js';
import { allowRequest, type Request, type Response } from '../lib/http.js';
export default function handler(req: Request, res: Response) {
  if (!allowRequest(req, res, ['GET'])) return;
  return res.status(200).json({ clientId: configuredClientId() });
}
