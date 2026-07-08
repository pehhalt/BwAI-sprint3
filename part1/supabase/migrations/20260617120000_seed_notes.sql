-- Seed the notes table with initial data.
--
-- notes.user_id is NOT NULL and normally set by the set_notes_user_id
-- trigger, which unconditionally overwrites it with auth.uid() (a
-- deliberate anti-forgery measure — see docs/supabase-schema.md). Outside
-- an authenticated request (e.g. this migration replaying via
-- `supabase db reset`), auth.uid() is NULL, so the trigger is disabled
-- for this one insert and the seeded notes are attached explicitly to the
-- earliest-created user instead. On a fresh project with no users yet,
-- the cross join produces zero rows — a no-op, not an error.

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
