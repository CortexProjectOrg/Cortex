export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const clientId = process.env.GOOGLE_AUTH_CLIENT_API_KEY || process.env.VITE_GOOGLE_CLIENT_ID || '';
  return res.status(200).json({ clientId });
}
