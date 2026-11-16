import type { IncomingMessage, ServerResponse } from 'node:http';
export type Request = IncomingMessage & { body?: unknown };
export type Response = ServerResponse & { status: (code: number) => Response; json: (body: unknown) => void };
export function allowRequest(req: Request, res: Response, methods: string[]): boolean {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Allow', methods.join(', '));
  const origin = req.headers.origin;
  if (origin) {
    try {
      if (new URL(origin).host !== req.headers.host) {
        res.status(403).json({ error: 'Origin not allowed' });
        return false;
      }
    } catch {
      res.status(403).json({ error: 'Origin not allowed' });
      return false;
    }
  }
  if (!methods.includes(req.method || '')) {
    res.status(405).json({ error: 'Method not allowed' });
    return false;
  }
  return true;
}
