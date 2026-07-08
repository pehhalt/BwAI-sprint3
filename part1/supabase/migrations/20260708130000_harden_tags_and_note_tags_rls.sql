-- Hardening from the security-auditor's second review, ahead of the
-- Sprint 3 Part 2 Vercel deploy:
--
-- 1. tags.name was globally unique across all users. RLS hid other users'
--    tags from view, but the UNIQUE constraint still applied database-wide
--    regardless of RLS — a user could infer whether some other user already
--    had a given tag name (unique_violation vs. success), and two different
--    users could never share a tag name like "work". Scoped to per-user.
-- 2. note_tags' USING clause only checked note ownership, leaving tag
--    ownership checked only in WITH CHECK (the insert/update path).
--    Tightened so reads/deletes also require owning both sides of the link.
--
-- 20260601000000_notes_app_schema.sql was updated to match, so a fresh
-- `supabase db reset` creates the correct schema from the start; this
-- migration is what actually alters the already-live database.

-- ── tags.name: unique per user, not globally ────────────────────────────

do $$
declare
  legacy_constraint text;
begin
  select con.conname into legacy_constraint
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_attribute att
    on att.attrelid = con.conrelid and att.attnum = any(con.conkey)
  where rel.relname = 'tags'
    and con.contype = 'u'
    and att.attname = 'name'
    and cardinality(con.conkey) = 1;

  if legacy_constraint is not null then
    execute format('alter table tags drop constraint %I', legacy_constraint);
  end if;
end $$;

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
