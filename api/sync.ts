import { extractBearerToken, verifyGoogleToken } from './lib/auth';
import { getUserData, saveUserData } from './lib/storage';
import { upsertUser } from './lib/db';

function mergeWorkspaces(current: any, incoming: any): any {
  if (!current) return incoming;
  if (!incoming) return current;

  // Merge notes by updatedAt (newer wins)
  const currentNotes = Array.isArray(current.notes) ? current.notes : [];
  const incomingNotes = Array.isArray(incoming.notes) ? incoming.notes : [];
  const notesMap = new Map<string, any>();

  for (const n of currentNotes) {
    if (n && n.id) notesMap.set(n.id, n);
  }
  for (const n of incomingNotes) {
    if (n && n.id) {
      const existing = notesMap.get(n.id);
      if (!existing || Date.parse(n.updatedAt || '0') >= Date.parse(existing.updatedAt || '0')) {
        notesMap.set(n.id, n);
      }
    }
  }

  // Union arrays
  const union = (a?: any[], b?: any[]) => [
    ...new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])])
  ];

  // Merge lecture progress
  const mergedProgress = {
    ...(current.lectureProgress || {}),
    ...(incoming.lectureProgress || {})
  };

  return {
    ...current,
    ...incoming,
    notes: [...notesMap.values()],
    read: union(current.read, incoming.read),
    bookmarks: union(current.bookmarks, incoming.bookmarks),
    completedSessions: union(current.completedSessions, incoming.completedSessions),
    completedLectures: union(current.completedLectures, incoming.completedLectures),
    lectureProgress: mergedProgress,
    lastRead:
      incoming.lastRead && Date.parse(incoming.lastRead.at || '0') > Date.parse(current.lastRead?.at || '0')
        ? incoming.lastRead
        : current.lastRead || incoming.lastRead,
    updatedAt: new Date().toISOString()
  };
}

export default async function handler(req: any, res: any) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const user = await verifyGoogleToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired Google authentication' });
  }

  // Update user profile in Neon
  void upsertUser(user).catch(err => console.warn('Failed to upsert user to Neon:', err));

  const userId = user.uid;

  if (req.method === 'GET') {
    const data = await getUserData(userId);
    return res.status(200).json({
      workspace: data || null,
      syncedAt: new Date().toISOString()
    });
  }

  if (req.method === 'POST') {
    const incoming = req.body?.workspace;
    if (!incoming) {
      return res.status(400).json({ error: 'Missing workspace data in body' });
    }

    const current = await getUserData(userId);
    const merged = mergeWorkspaces(current, incoming);
    await saveUserData(userId, merged);

    return res.status(200).json({
      workspace: merged,
      syncedAt: new Date().toISOString()
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
