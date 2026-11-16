import { neon } from '@neondatabase/serverless';
import { parseWorkspace, type Snapshot, type Workspace } from '../../shared/workspace.js';
import type { GoogleUser } from './auth.js';
export function getDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL
  );
}
function database() {
  const url = getDatabaseUrl();
  if (!url) throw new Error('Cloud storage is not configured.');
  return neon(url, { fetchOptions: { signal: AbortSignal.timeout(10_000) } });
}
export async function upsertUser(user: GoogleUser) {
  const sql = database();
  await sql`INSERT INTO users (user_id, email, name, picture) VALUES (${user.uid}, ${user.email}, ${user.name}, ${user.picture})
    ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, picture = EXCLUDED.picture, last_seen_at = NOW()`;
}
export async function getFullWorkspaceFromNeon(userId: string): Promise<Snapshot | null> {
  const sql = database();
  const [row] = await sql`SELECT document, revision FROM workspace_documents WHERE user_id = ${userId}`;
  return row ? { workspace: parseWorkspace(row.document), revision: Number(row.revision) } : null;
}
// One conditional statement commits the entire tenant document. Stale writes receive a conflict.
export const SAVE_WORKSPACE_SQL = `INSERT INTO workspace_documents (user_id, document, revision)
  SELECT $1, $2::jsonb, 1 WHERE $3::bigint = 0
  ON CONFLICT (user_id) DO NOTHING RETURNING revision`;
export const UPDATE_WORKSPACE_SQL = `UPDATE workspace_documents SET document = $2::jsonb,
  revision = revision + 1, updated_at = NOW() WHERE user_id = $1 AND revision = $3::bigint RETURNING revision`;
export async function saveFullWorkspaceToNeon(
  userId: string,
  workspace: Workspace,
  revision: number
): Promise<number | null> {
  const sql = database();
  const rows = await sql.query(revision === 0 ? SAVE_WORKSPACE_SQL : UPDATE_WORKSPACE_SQL, [
    userId,
    JSON.stringify(workspace),
    revision
  ]);
  return rows.length ? Number(rows[0].revision) : null;
}
