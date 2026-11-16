import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SAVE_WORKSPACE_SQL, UPDATE_WORKSPACE_SQL } from '../api/lib/db';
import { emptyWorkspace } from '../shared/workspace';
import { makeNote } from '../src/lib/model';
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(await readFile('migrations/001_workspace_documents.sql', 'utf8'));
  await db.exec("INSERT INTO users (user_id) VALUES ('A'), ('B')");
}, 30_000);
afterAll(async () => db?.close());
describe('PostgreSQL revision persistence', () => {
  it('round-trips the complete document with tenant-scoped note IDs', async () => {
    const workspace = {
      ...emptyWorkspace(),
      notes: [{ ...makeNote('Same ID'), id: 'same' }],
      path: [
        {
          id: 'custom',
          title: 'Path',
          theory: '',
          question: '',
          practice: '',
          source: '',
          status: 'next' as const
        }
      ],
      completedSessions: [1]
    };
    for (const user of ['A', 'B'])
      expect((await db.query(SAVE_WORKSPACE_SQL, [user, JSON.stringify(workspace), 0])).rows).toHaveLength(1);
    const rows = await db.query<{ document: unknown }>('SELECT document FROM workspace_documents');
    expect(rows.rows.map((r) => r.document)).toEqual([workspace, workspace]);
  });
  it('allows only one writer for a revision and leaves stale writes unchanged', async () => {
    const a = { ...emptyWorkspace(), theme: 'dark' },
      b = { ...emptyWorkspace(), theme: 'system' };
    const results = await Promise.all([
      db.query(UPDATE_WORKSPACE_SQL, ['A', JSON.stringify(a), 1]),
      db.query(UPDATE_WORKSPACE_SQL, ['A', JSON.stringify(b), 1])
    ]);
    expect(results.reduce((n, r) => n + r.rows.length, 0)).toBe(1);
    expect(
      (await db.query<{ revision: number }>("SELECT revision FROM workspace_documents WHERE user_id='A'"))
        .rows[0].revision
    ).toBe(2);
  });
  it('cannot leave a partial document after a failed write', async () => {
    await expect(db.query(UPDATE_WORKSPACE_SQL, ['B', '{invalid', 1])).rejects.toThrow();
    const result = await db.query<{ revision: number; document: { notes: unknown[] } }>(
      "SELECT revision, document FROM workspace_documents WHERE user_id='B'"
    );
    expect(result.rows[0].revision).toBe(1);
    expect(result.rows[0].document.notes).toHaveLength(1);
  });
});
