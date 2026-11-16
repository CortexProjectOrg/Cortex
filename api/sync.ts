import { z } from 'zod';
import { emptyWorkspace, MAX_WORKSPACE_BYTES, parseWorkspace } from '../shared/workspace';
import { extractBearerToken, verifyGoogleToken } from './lib/auth';
import { upsertUser } from './lib/db';
import { allowRequest, type Request, type Response } from './lib/http';
import { getUserData, saveUserData } from './lib/storage';
const requestSchema = z
  .object({
    protocol: z.literal(1),
    revision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
    workspace: z.unknown()
  })
  .strict();
export default async function handler(req: Request, res: Response) {
  if (!allowRequest(req, res, ['GET', 'POST'])) return;
  if (Number(req.headers['content-length'] || 0) > MAX_WORKSPACE_BYTES + 1000)
    return res.status(413).json({ error: 'Workspace is too large.' });
  const token = extractBearerToken(req.headers.authorization);
  const user = token && (await verifyGoogleToken(token));
  if (!user) return res.status(401).json({ error: 'Please sign in again.' });
  let incoming;
  if (req.method === 'POST') {
    try {
      const body = requestSchema.parse(req.body);
      incoming = { revision: body.revision, workspace: parseWorkspace(body.workspace) };
    } catch {
      return res.status(400).json({ error: 'Invalid workspace. Update the app or check your backup.' });
    }
  }
  try {
    if (!incoming)
      return res
        .status(200)
        .json((await getUserData(user.uid)) || { workspace: emptyWorkspace(), revision: 0 });
    await upsertUser(user);
    const revision = await saveUserData(user.uid, incoming.workspace, incoming.revision);
    if (revision === null)
      return res
        .status(409)
        .json((await getUserData(user.uid)) || { workspace: emptyWorkspace(), revision: 0 });
    return res.status(200).json({ workspace: incoming.workspace, revision });
  } catch (error) {
    console.error('Workspace storage failed', error instanceof Error ? error.name : 'unknown');
    return res
      .status(503)
      .json({ error: 'Cloud save is unavailable. Your local changes are still pending.' });
  }
}
