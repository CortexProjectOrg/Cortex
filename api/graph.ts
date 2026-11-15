import {
  getCurriculumGraphFromNeon,
  syncCurriculumGraphToNeon,
  CURRENT_GRAPH_VERSION
} from './lib/db';

export default async function handler(req: any, res: any) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      const { topics, lectures, dependencies } = req.body || {};
      if (!topics || !lectures || !dependencies) {
        return res.status(400).json({ error: 'Missing topics, lectures, or dependencies payload' });
      }

      const synced = await syncCurriculumGraphToNeon(topics, lectures, dependencies);
      return res.status(200).json({
        success: synced,
        version: CURRENT_GRAPH_VERSION,
        syncedAt: new Date().toISOString()
      });
    }

    if (req.method === 'GET') {
      const dbGraph = await getCurriculumGraphFromNeon();
      return res.status(200).json({
        graph: dbGraph,
        version: CURRENT_GRAPH_VERSION,
        servedAt: new Date().toISOString()
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Error handling /api/graph:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
