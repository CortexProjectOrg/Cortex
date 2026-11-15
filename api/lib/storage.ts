import { put, list, del } from '@vercel/blob';

// In-memory fallback for local dev or before Vercel Blob/KV is attached
const memoryStore = new Map<string, any>();

export async function getUserData(userId: string): Promise<any | null> {
  // 1. Try Vercel Blob
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { blobs } = await list({ prefix: `workspaces/${userId}.json` });
      if (blobs.length > 0) {
        const res = await fetch(blobs[0].url);
        if (res.ok) {
          return await res.json();
        }
      }
    } catch (err) {
      console.warn('Vercel Blob read error, falling back:', err);
    }
  }

  // 2. Try Upstash / Vercel KV if available
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const res = await fetch(`${process.env.KV_REST_API_URL}/get/workspace:${userId}`, {
        headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.result) {
          return typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
        }
      }
    } catch (err) {
      console.warn('Vercel KV read error:', err);
    }
  }

  // 3. Fallback to memoryStore
  return memoryStore.get(userId) || null;
}

export async function saveUserData(userId: string, data: any): Promise<boolean> {
  let saved = false;

  // 1. Try Vercel Blob
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await put(`workspaces/${userId}.json`, JSON.stringify(data), {
        access: 'public',
        addRandomSuffix: false
      });
      saved = true;
    } catch (err) {
      console.warn('Vercel Blob save error:', err);
    }
  }

  // 2. Try Vercel KV
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      await fetch(`${process.env.KV_REST_API_URL}/set/workspace:${userId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(typeof data === 'string' ? data : JSON.stringify(data))
      });
      saved = true;
    } catch (err) {
      console.warn('Vercel KV save error:', err);
    }
  }

  // Always update memory store as immediate cache
  memoryStore.set(userId, data);
  return saved || true;
}
