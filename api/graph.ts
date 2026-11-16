import type { Request, Response } from './lib/http';
// Curriculum is a versioned build asset. There is no public graph writer or database dependency.
export default function handler(_req: Request, res: Response) {
  return res
    .status(410)
    .json({ error: 'The curriculum is included in the app. This endpoint has been retired.' });
}
