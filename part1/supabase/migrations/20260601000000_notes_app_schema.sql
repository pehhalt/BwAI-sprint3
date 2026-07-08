-- Base schema: collections, notes, tags, note_tags + Row Level Security.
--
-- This documents the schema and RLS policies that already exist on the
-- linked Supabase project (see docs/supabase-schema.md), so the security
-- model the app depends on is reviewable and reproducible from source
-- instead of living only in the dashboard. Written with IF NOT EXISTS /
-- DROP ... IF EXISTS throughout so it is safe to re-run against a database
-- that already has this schema.

-- ── Tables ───────────────────────────────────────────────────────────────

create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  collection_id uuid references collections(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists note_tags (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references notes(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade
);

-- ── user_id is always set by trigger, never by application code ───────────

create or replace function set_user_id()
returns trigger language plpgsql security definer as $$
begin
  new.user_id = auth.uid();
  return new;
end;
$$;

drop trigger if exists set_collections_user_id on collections;
create trigger set_collections_user_id
  before insert on collections
  for each row execute function set_user_id();

drop trigger if exists set_notes_user_id on notes;
create trigger set_notes_user_id
  before insert on notes
  for each row execute function set_user_id();

drop trigger if exists set_tags_user_id on tags;
create trigger set_tags_user_id
  before insert on tags
  for each row execute function set_user_id();

-- ── Row Level Security ──────────────────────────────────────────────────

alter table collections enable row level security;
alter table notes enable row level security;
alter table tags enable row level security;
alter table note_tags enable row level security;

drop policy if exists "users own their collections" on collections;
create policy "users own their collections"
  on collections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users own their notes" on notes;
create policy "users own their notes"
  on notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users own their tags" on tags;
create policy "users own their tags"
  on tags for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- note_tags has no user_id column; ownership is derived from the parent note.
drop policy if exists "users own their note_tags" on note_tags;
create policy "users own their note_tags"
  on note_tags for all
  using (
    exists (
      select 1 from notes
      where notes.id = note_tags.note_id
      and notes.user_id = auth.uid()
    )
  );
