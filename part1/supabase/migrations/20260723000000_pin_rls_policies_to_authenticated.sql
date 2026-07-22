-- Security-scan Medium finding: RLS policies had no `to authenticated`
-- clause, so Postgres applied them to PUBLIC (including anon) rather than
-- scoping them to the authenticated role. Not currently exploitable —
-- every policy's condition is (select auth.uid()) = user_id, and
-- auth.uid() is NULL for anon requests — but this pins the policies to the
-- role they're actually meant for, matching the supabase skill's
-- documented pattern (`to authenticated using (...)`) instead of relying
-- solely on the auth.uid() comparison to keep anon out.
--
-- 20260601000000_notes_app_schema.sql was updated to match, so a fresh
-- `supabase db reset` creates the correct schema from the start; this
-- migration is what actually alters the already-live database.
--
-- Verifying this fix against the live project's pg_policies also surfaced
-- two extra policies on `notes` — "users can insert their own notes" and
-- "users can read their own notes" — that don't appear in any migration
-- in this repo. They must predate this project's migration history (never
-- captured in source) rather than having been created by anything here.
-- Their conditions are equivalent to (and weaker than, being {public}
-- instead of {authenticated} and un-cached) what "users own their notes"
-- already covers for INSERT/SELECT, so they were redundant rather than a
-- live gap (auth.uid() is still NULL for anon, so they never let anon
-- through) — but "reviewable and reproducible from source instead of
-- living only in the dashboard" is the whole point of versioning RLS
-- here, so drop the untracked duplicates.

drop policy if exists "users can insert their own notes" on notes;
drop policy if exists "users can read their own notes" on notes;

drop policy if exists "users own their collections" on collections;
create policy "users own their collections"
  on collections for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "users own their notes" on notes;
create policy "users own their notes"
  on notes for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "users own their tags" on tags;
create policy "users own their tags"
  on tags for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "users own their note_tags" on note_tags;
create policy "users own their note_tags"
  on note_tags for all
  to authenticated
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
