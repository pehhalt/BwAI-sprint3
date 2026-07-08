-- Local dev seed data.
--
-- supabase/seed.sql is a Supabase CLI convention: it runs on
-- `supabase db reset` / `supabase start` for local development, but is
-- never included when pushing schema changes to a remote database via
-- `supabase db push`. This was previously a timestamped file under
-- supabase/migrations/, which meant it could in principle run against
-- any environment those migrations were replayed on — including a
-- shared/staging/production database — silently attaching sample notes
-- to whichever real user happened to exist first there. Moved here so
-- that can't happen.
--
-- notes.user_id is NOT NULL and normally set by the set_notes_user_id
-- trigger, which unconditionally overwrites it with auth.uid() (a
-- deliberate anti-forgery measure — see docs/supabase-schema.md).
-- Outside an authenticated request (e.g. a local db reset), auth.uid()
-- is NULL, so the trigger is disabled for this one insert and the
-- seeded notes are attached explicitly to the earliest-created user
-- instead. On a fresh project with no users yet, the cross join
-- produces zero rows — a no-op, not an error.

ALTER TABLE notes DISABLE TRIGGER set_notes_user_id;

INSERT INTO notes (title, body, user_id)
SELECT v.title, v.body, u.id
FROM (VALUES
  ('Shopping list', 'Milk, eggs, bread'),
  ('Meeting notes', 'Discussed Q2 priorities'),
  ('Ideas', 'Redesign the onboarding flow')
) AS v(title, body)
CROSS JOIN (SELECT id FROM auth.users ORDER BY created_at LIMIT 1) AS u;

ALTER TABLE notes ENABLE TRIGGER set_notes_user_id;
