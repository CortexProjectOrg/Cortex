export function cleanClientId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const id = value.trim().replace(/^["']|["']$/g, '');
  return /^[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(id) && !id.includes('placeholder') ? id : null;
}

export function configuredClientId(): string {
  return (
    cleanClientId(
      process.env.GOOGLE_CLIENT_ID ||
        process.env.GOOGLE_AUTH_CLIENT_API_KEY ||
        process.env.VITE_GOOGLE_CLIENT_ID
    ) || ''
  );
}
