import { neon } from '@neondatabase/serverless';
import type { GoogleUser } from './auth';

function getDatabaseUrl(): string | null {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    null
  );
}

export function isNeonConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

let initPromise: Promise<void> | null = null;

async function ensureTables() {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) return;

  if (!initPromise) {
    const sql = neon(dbUrl);
    initPromise = (async () => {
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS users (
            user_id VARCHAR(128) PRIMARY KEY,
            email VARCHAR(255),
            name VARCHAR(255),
            picture TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            last_seen_at TIMESTAMPTZ DEFAULT NOW()
          );
        `;

        await sql`
          CREATE TABLE IF NOT EXISTS user_workspaces (
            user_id VARCHAR(128) PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
            study_plan JSONB DEFAULT '{}',
            completed_lectures JSONB DEFAULT '[]',
            lecture_progress JSONB DEFAULT '{}',
            bookmarks JSONB DEFAULT '[]',
            read_docs JSONB DEFAULT '[]',
            preferences JSONB DEFAULT '{}',
            last_read JSONB,
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `;

        await sql`
          CREATE TABLE IF NOT EXISTS user_notes (
            note_id VARCHAR(128) PRIMARY KEY,
            user_id VARCHAR(128) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            lecture_id VARCHAR(128),
            document_id VARCHAR(128),
            title TEXT,
            body TEXT,
            ink_data TEXT,
            lecture_ink TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `;

        await sql`
          ALTER TABLE user_notes ADD COLUMN IF NOT EXISTS lecture_ink TEXT;
        `;

        await sql`
          CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON user_notes(user_id);
        `;
        await sql`
          CREATE INDEX IF NOT EXISTS idx_user_notes_lecture_id ON user_notes(lecture_id);
        `;
        await sql`
          CREATE UNIQUE INDEX IF NOT EXISTS idx_user_notes_user_note_id ON user_notes(user_id, note_id);
        `;

        // Curriculum Static DAG Tables
        await sql`
          CREATE TABLE IF NOT EXISTS curriculum_topics (
            topic_id VARCHAR(64) PRIMARY KEY,
            topic_number INT NOT NULL,
            title TEXT NOT NULL,
            subtitle TEXT,
            description TEXT,
            color VARCHAR(32),
            symbol VARCHAR(32)
          );
        `;

        await sql`
          CREATE TABLE IF NOT EXISTS curriculum_lectures (
            lecture_id VARCHAR(128) PRIMARY KEY,
            topic_id VARCHAR(64) REFERENCES curriculum_topics(topic_id),
            lecture_number INT NOT NULL,
            title TEXT NOT NULL,
            subtitle TEXT,
            question TEXT,
            pack_number INT,
            pack_slot INT,
            topological_rank INT NOT NULL
          );
        `;

        await sql`
          CREATE TABLE IF NOT EXISTS curriculum_dependencies (
            dependency_id VARCHAR(160) PRIMARY KEY,
            from_lecture_id VARCHAR(128) REFERENCES curriculum_lectures(lecture_id),
            to_lecture_id VARCHAR(128) REFERENCES curriculum_lectures(lecture_id),
            edge_type VARCHAR(32) NOT NULL, -- 'hard_prerequisite' or 'soft_link'
            relationship TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `;

        await sql`
          CREATE TABLE IF NOT EXISTS curriculum_graph_meta (
            meta_key VARCHAR(64) PRIMARY KEY,
            meta_value JSONB,
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `;
      } catch (err) {
        console.error('Error creating Neon database tables:', err);
        initPromise = null; // retry next time
        throw err;
      }
    })();
  }
  return initPromise;
}

export async function upsertUser(user: GoogleUser) {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) return;

  await ensureTables();
  const sql = neon(dbUrl);

  await sql`
    INSERT INTO users (user_id, email, name, picture, last_seen_at)
    VALUES (${user.uid}, ${user.email}, ${user.name}, ${user.picture}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      picture = EXCLUDED.picture,
      last_seen_at = NOW();
  `;
}

export async function getFullWorkspaceFromNeon(userId: string): Promise<any | null> {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) return null;

  await ensureTables();
  const sql = neon(dbUrl);

  const [wsRow] = await sql`
    SELECT * FROM user_workspaces WHERE user_id = ${userId};
  `;

  const notesRows = await sql`
    SELECT note_id as id, title, body, ink_data as "inkData", 
           lecture_ink as "lectureInk",
           lecture_id as "lectureId", document_id as "documentId",
           created_at as "createdAt", updated_at as "updatedAt"
    FROM user_notes
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC;
  `;

  if (!wsRow && (!notesRows || notesRows.length === 0)) {
    return null;
  }

  const notes = (notesRows || []).map((n: any) => ({
    id: n.id,
    title: n.title || '',
    body: n.body || '',
    inkData: n.inkData || undefined,
    lectureInk: n.lectureInk || undefined,
    lectureId: n.lectureId || undefined,
    documentId: n.documentId || undefined,
    createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: n.updatedAt ? new Date(n.updatedAt).toISOString() : new Date().toISOString()
  }));

  return {
    version: 2,
    notes,
    read: Array.isArray(wsRow?.read_docs) ? wsRow.read_docs : [],
    bookmarks: Array.isArray(wsRow?.bookmarks) ? wsRow.bookmarks : [],
    completedSessions: [],
    completedLectures: Array.isArray(wsRow?.completed_lectures) ? wsRow.completed_lectures : [],
    lectureProgress: wsRow?.lecture_progress || {},
    studyPlan: wsRow?.study_plan || {
      activePathId: 'symplectic-foundations-to-mastery',
      schedule: 'pack-4h',
      currentWeek: 1
    },
    theme: wsRow?.preferences?.theme || 'light',
    fontScale: wsRow?.preferences?.fontScale || 1,
    lastRead: wsRow?.last_read || undefined,
    updatedAt: wsRow?.updated_at ? new Date(wsRow.updated_at).toISOString() : new Date().toISOString()
  };
}

export async function saveFullWorkspaceToNeon(userId: string, ws: any) {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) return false;

  await ensureTables();
  const sql = neon(dbUrl);

  const studyPlan = JSON.stringify(ws.studyPlan || {});
  const completedLectures = JSON.stringify(ws.completedLectures || []);
  const lectureProgress = JSON.stringify(ws.lectureProgress || {});
  const bookmarks = JSON.stringify(ws.bookmarks || []);
  const readDocs = JSON.stringify(ws.read || []);
  const preferences = JSON.stringify({
    theme: ws.theme || 'light',
    fontScale: ws.fontScale || 1
  });
  const lastRead = ws.lastRead ? JSON.stringify(ws.lastRead) : null;

  // 1. Upsert Workspace row
  await sql`
    INSERT INTO user_workspaces (
      user_id, study_plan, completed_lectures, lecture_progress, 
      bookmarks, read_docs, preferences, last_read, updated_at
    )
    VALUES (
      ${userId}, 
      ${studyPlan}::jsonb, 
      ${completedLectures}::jsonb, 
      ${lectureProgress}::jsonb, 
      ${bookmarks}::jsonb, 
      ${readDocs}::jsonb, 
      ${preferences}::jsonb, 
      ${lastRead}::jsonb, 
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      study_plan = EXCLUDED.study_plan,
      completed_lectures = EXCLUDED.completed_lectures,
      lecture_progress = EXCLUDED.lecture_progress,
      bookmarks = EXCLUDED.bookmarks,
      read_docs = EXCLUDED.read_docs,
      preferences = EXCLUDED.preferences,
      last_read = EXCLUDED.last_read,
      updated_at = NOW();
  `;

  // 2. Batch upsert Notes
  const notes = Array.isArray(ws.notes) ? ws.notes : [];
  for (const n of notes) {
    if (!n || !n.id) continue;
    await sql`
      INSERT INTO user_notes (
        note_id, user_id, lecture_id, document_id, title, body, ink_data, lecture_ink, created_at, updated_at
      )
      VALUES (
        ${n.id},
        ${userId},
        ${n.lectureId || null},
        ${n.documentId || null},
        ${n.title || ''},
        ${n.body || ''},
        ${n.inkData || null},
        ${n.lectureInk || null},
        ${n.createdAt ? new Date(n.createdAt) : new Date()},
        ${n.updatedAt ? new Date(n.updatedAt) : new Date()}
      )
      ON CONFLICT (note_id) DO UPDATE SET
        lecture_id = EXCLUDED.lecture_id,
        document_id = EXCLUDED.document_id,
        title = EXCLUDED.title,
        body = EXCLUDED.body,
        ink_data = EXCLUDED.ink_data,
        lecture_ink = EXCLUDED.lecture_ink,
        updated_at = EXCLUDED.updated_at
      WHERE user_notes.user_id = EXCLUDED.user_id AND EXCLUDED.updated_at >= user_notes.updated_at;
    `;
  }

  return true;
}

export const CURRENT_GRAPH_VERSION = '2.1.0';

/**
 * Persists and idempotently syncs the static curriculum DAG to Neon PostgreSQL.
 * Keeps the database updated with version tracking.
 */
export async function syncCurriculumGraphToNeon(
  topics: Array<{
    id: string;
    number: number;
    title: string;
    subtitle: string;
    description: string;
    color: string;
    symbol: string;
  }>,
  lectures: Array<{
    id: string;
    topicId: string;
    lectureNumber: number;
    title: string;
    subtitle: string;
    question: string;
    packNumber: number;
    packSlot: number;
    topologicalRank: number;
  }>,
  dependencies: Array<{
    fromId: string;
    toId: string;
    edgeType: 'hard_prerequisite' | 'soft_link';
    relationship?: string;
  }>
) {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) return false;

  await ensureTables();
  const sql = neon(dbUrl);

  // Check version in curriculum_graph_meta
  const [metaRow] = await sql`
    SELECT meta_value FROM curriculum_graph_meta WHERE meta_key = 'graph_version';
  `;

  if (metaRow?.meta_value?.version === CURRENT_GRAPH_VERSION) {
    // Already up to date
    return true;
  }

  // 1. Upsert Topics
  for (const t of topics) {
    await sql`
      INSERT INTO curriculum_topics (topic_id, topic_number, title, subtitle, description, color, symbol)
      VALUES (${t.id}, ${t.number}, ${t.title}, ${t.subtitle}, ${t.description}, ${t.color}, ${t.symbol})
      ON CONFLICT (topic_id) DO UPDATE SET
        topic_number = EXCLUDED.topic_number,
        title = EXCLUDED.title,
        subtitle = EXCLUDED.subtitle,
        description = EXCLUDED.description,
        color = EXCLUDED.color,
        symbol = EXCLUDED.symbol;
    `;
  }

  // 2. Upsert Lectures
  for (const l of lectures) {
    await sql`
      INSERT INTO curriculum_lectures (
        lecture_id, topic_id, lecture_number, title, subtitle, question, pack_number, pack_slot, topological_rank
      )
      VALUES (
        ${l.id}, ${l.topicId}, ${l.lectureNumber}, ${l.title}, ${l.subtitle}, ${l.question},
        ${l.packNumber}, ${l.packSlot}, ${l.topologicalRank}
      )
      ON CONFLICT (lecture_id) DO UPDATE SET
        topic_id = EXCLUDED.topic_id,
        lecture_number = EXCLUDED.lecture_number,
        title = EXCLUDED.title,
        subtitle = EXCLUDED.subtitle,
        question = EXCLUDED.question,
        pack_number = EXCLUDED.pack_number,
        pack_slot = EXCLUDED.pack_slot,
        topological_rank = EXCLUDED.topological_rank;
    `;
  }

  // 3. Upsert Dependencies
  for (const dep of dependencies) {
    const depId = `${dep.fromId}->${dep.toId}:${dep.edgeType}`;
    await sql`
      INSERT INTO curriculum_dependencies (dependency_id, from_lecture_id, to_lecture_id, edge_type, relationship)
      VALUES (${depId}, ${dep.fromId}, ${dep.toId}, ${dep.edgeType}, ${dep.relationship || null})
      ON CONFLICT (dependency_id) DO UPDATE SET
        edge_type = EXCLUDED.edge_type,
        relationship = EXCLUDED.relationship;
    `;
  }

  // 4. Update Meta Version
  const metaPayload = JSON.stringify({
    version: CURRENT_GRAPH_VERSION,
    topicsCount: topics.length,
    lecturesCount: lectures.length,
    dependenciesCount: dependencies.length,
    updatedAt: new Date().toISOString()
  });

  await sql`
    INSERT INTO curriculum_graph_meta (meta_key, meta_value, updated_at)
    VALUES ('graph_version', ${metaPayload}::jsonb, NOW())
    ON CONFLICT (meta_key) DO UPDATE SET
      meta_value = EXCLUDED.meta_value,
      updated_at = NOW();
  `;

  return true;
}

/**
 * Retrieves the static curriculum DAG from Neon PostgreSQL.
 */
export async function getCurriculumGraphFromNeon(): Promise<any | null> {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) return null;

  await ensureTables();
  const sql = neon(dbUrl);

  const topics = await sql`SELECT * FROM curriculum_topics ORDER BY topic_number ASC;`;
  const lectures = await sql`SELECT * FROM curriculum_lectures ORDER BY lecture_number ASC;`;
  const dependencies = await sql`SELECT * FROM curriculum_dependencies;`;
  const [meta] = await sql`SELECT meta_value FROM curriculum_graph_meta WHERE meta_key = 'graph_version';`;

  if (!topics || topics.length === 0) return null;

  return {
    version: meta?.meta_value?.version || CURRENT_GRAPH_VERSION,
    topics,
    lectures,
    dependencies,
    meta: meta?.meta_value || null
  };
}
