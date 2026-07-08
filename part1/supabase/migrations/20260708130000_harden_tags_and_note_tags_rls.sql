-- Hardening from the security-auditor's second review, ahead of the
-- Sprint 3 Part 2 Vercel deploy:
--
-- 1. tags.name was assumed to be globally unique per docs/supabase-schema.md,
--    but checking the live database found no such constraint (or any unique
--    index/constraint on the column) actually existed — only the primary
--    key, the user_id foreign key, and the two NOT NULL checks. So this
--    isn't dropping a legacy constraint; it's adding per-user uniqueness
--    for the first time. Verified no existing (user_id, name) duplicates
--    before adding it.
-- 2. note_tags' USING clause only checked note ownership, leaving tag
--    ownership checked only in WITH CHECK (the insert/update path).
--    Tightened so reads/deletes also require owning both sides of the link.
--
-- 20260601000000_notes_app_schema.sql was updated to match, so a fresh
-- `supabase db reset` creates the correct schema from the start; this
-- migration is what actually alters the already-live database.

-- ── tags.name: unique per user ──────────────────────────────────────────

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tags_user_id_name_key'
      and conrelid = 'tags'::regclass
  ) then
    alter table tags add constraint tags_user_id_name_key unique (user_id, name);
  end if;
end $$;

-- ── note_tags: require owning both the note and the tag on every access ─

drop policy if exists "users own their note_tags" on note_tags;
create policy "users own their note_tags"
  on note_tags for all
  using (
    exists (
      select 1 from notes
      where notes.id = note_tags.note_id
      and notes.user_id = auth.uid()
    )
    and exists (
      select 1 from tags
      where tags.id = note_tags.tag_id
      and tags.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from notes
      where notes.id = note_tags.note_id
      and notes.user_id = auth.uid()
    )
    and exists (
      select 1 from tags
      where tags.id = note_tags.tag_id
      and tags.user_id = auth.uid()
    )
  );
