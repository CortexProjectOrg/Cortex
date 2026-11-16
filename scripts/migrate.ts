import { neon } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';
import { getDatabaseUrl } from '../api/lib/db';
import { emptyWorkspace, validateWorkspace } from '../shared/workspace';

// Run in a maintenance window after a private database backup. No schema changes run in API requests.
const url = getDatabaseUrl();
if (!url) throw new Error('Set DATABASE_URL before running the migration.');
const sql = neon(url);
const schema = await readFile(new URL('../migrations/001_workspace_documents.sql', import.meta.url), 'utf8');
await sql.transaction(
  schema
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((statement) => sql.query(statement, []))
);
const rows = await sql`SELECT w.*, u.user_id FROM users u LEFT JOIN user_workspaces w USING (user_id)
  WHERE NOT EXISTS (SELECT 1 FROM workspace_documents d WHERE d.user_id = u.user_id)`;
const notes = await sql`SELECT * FROM user_notes ORDER BY updated_at DESC`;
// Validate everything before copying any records. Invalid legacy rows require recovery, never truncation.
const copies = rows.map((row) => {
  const defaults = emptyWorkspace();
  const workspace = validateWorkspace({
    ...defaults,
    read: row.read_docs || [],
    bookmarks: row.bookmarks || [],
    completedLectures: row.completed_lectures || [],
    lectureProgress: row.lecture_progress || {},
    studyPlan: { ...defaults.studyPlan, ...row.study_plan },
    ...row.preferences,
    lastRead: row.last_read || undefined,
    notes: notes
      .filter((n) => n.user_id === row.user_id)
      .map((n) => ({
        id: n.note_id,
        title: n.title || '',
        body: n.body || '',
        lectureId: n.lecture_id || undefined,
        documentId: n.document_id || undefined,
        inkData: n.ink_data || undefined,
        lectureInk: n.lecture_ink || undefined,
        createdAt: new Date(n.created_at).toISOString(),
        updatedAt: new Date(n.updated_at).toISOString()
      }))
  });
  return { userId: row.user_id, workspace };
});
if (copies.length)
  await sql.transaction(
    copies.map(
      ({ userId, workspace }) => sql`
  INSERT INTO workspace_documents (user_id, document) VALUES (${userId}, ${JSON.stringify(workspace)}::jsonb)
  ON CONFLICT (user_id) DO NOTHING`
    )
  );
console.log(`Validated and copied ${copies.length} workspaces. Legacy tables have been retained.`);
