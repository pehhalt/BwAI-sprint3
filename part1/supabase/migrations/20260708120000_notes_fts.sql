-- Server-side full-text search over notes.title and notes.body
ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS notes_fts_gin ON notes USING gin (fts);
