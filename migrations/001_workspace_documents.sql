CREATE TABLE IF NOT EXISTS users (
            user_id VARCHAR(128) PRIMARY KEY,
            email VARCHAR(255),
            name VARCHAR(255),
            picture TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            last_seen_at TIMESTAMPTZ DEFAULT NOW()
          );
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
ALTER TABLE user_notes ADD COLUMN IF NOT EXISTS lecture_ink TEXT;
CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON user_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_lecture_id ON user_notes(lecture_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_notes_user_note_id ON user_notes(user_id, note_id);
CREATE TABLE IF NOT EXISTS workspace_documents (
  user_id VARCHAR(128) PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  document JSONB NOT NULL,
  revision BIGINT NOT NULL DEFAULT 1 CHECK (revision > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
