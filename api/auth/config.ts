export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawClientId =
    process.env.GOOGLE_AUTH_CLIENT_API_KEY ||
    process.env.GOOGLE_CLIENT_ID ||
    process.env.VITE_GOOGLE_CLIENT_ID ||
    '';
  const clientId = rawClientId.trim().replace(/^["']|["']$/g, '');
  return res.status(200).json({ clientId });
}
