-- Third round of security-auditor findings, ahead of the Sprint 3 Part 2
-- Vercel deploy:
--
-- 1. note_tags had no unique constraint on (note_id, tag_id) — RLS still
--    scoped every row to its owner, so this wasn't a cross-tenant issue,
--    but nothing stopped a user (or a buggy client) from attaching the
--    same tag to the same note more than once. Added unique (note_id,
--    tag_id). Assumes no existing duplicates; verify with:
--      select note_id, tag_id, count(*) from note_tags
--      group by note_id, tag_id having count(*) > 1;
--    before running, same as was done for tags.name earlier.
-- 2. RLS policies called auth.uid() directly rather than
--    (select auth.uid()). Not a security issue — same semantics — but
--    Postgres can cache the wrapped form once per statement instead of
--    re-evaluating per row, which matters as notes/note_tags grow.
--
-- 20260601000000_notes_app_schema.sql was updated to match, so a fresh
-- `supabase db reset` creates the correct schema from the start; this
-- migration is what actually alters the already-live database.

-- ── note_tags: no duplicate tag-on-note links ───────────────────────────

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'note_tags_note_id_tag_id_key'
      and conrelid = 'note_tags'::regclass
  ) then
    alter table note_tags
      add constraint note_tags_note_id_tag_id_key unique (note_id, tag_id);
  end if;
end $$;

-- ── Policies: wrap auth.uid() so Postgres caches it per statement ──────

drop policy if exists "users own their collections" on collections;
create policy "users own their collections"
  on collections for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "users own their notes" on notes;
create policy "users own their notes"
  on notes for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "users own their tags" on tags;
create policy "users own their tags"
  on tags for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "users own their note_tags" on note_tags;
create policy "users own their note_tags"
  on note_tags for all
  using (
    exists (
      select 1 from notes
      where notes.id = note_tags.note_id
      and notes.user_id = (select auth.uid())
    )
    and exists (
      select 1 from tags
      where tags.id = note_tags.tag_id
      and tags.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from notes
      where notes.id = note_tags.note_id
      and notes.user_id = (select auth.uid())
    )
    and exists (
      select 1 from tags
      where tags.id = note_tags.tag_id
      and tags.user_id = (select auth.uid())
    )
  );
