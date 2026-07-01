# Supabase Schema Reference

**Source:** https://supabase.com/docs/guides/database/tables
**supabase-js client reference:** https://supabase.com/docs/reference/javascript/introduction

All tables belong to the `public` schema in the Supabase project configured via
`NEXT_PUBLIC_SUPABASE_URL` in `.env.local`.

---

## Tables

### `collections`

Stores named groups that notes can be assigned to.

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | `uuid` | primary key | `gen_random_uuid()` |
| `name` | `text` | not null | — |
| `user_id` | `uuid` | not null, FK → `auth.users.id` on delete cascade | set by trigger |
| `created_at` | `timestamptz` | not null | `now()` |

**Relationship:** one collection → many notes (via `notes.collection_id`).

---

### `notes`

The core content table. Each row is one note.

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | `uuid` | primary key | `gen_random_uuid()` |
| `title` | `text` | not null | — |
| `body` | `text` | — | — |
| `collection_id` | `uuid` | nullable, FK → `collections.id` | `null` |
| `user_id` | `uuid` | not null, FK → `auth.users.id` on delete cascade | set by trigger |
| `created_at` | `timestamptz` | not null | `now()` |
| `updated_at` | `timestamptz` | not null | `now()` |
| `fts` | `tsvector` | generated always (stored) | auto from title + body |

The `fts` column is a generated column that stays in sync automatically:

```sql
alter table notes
  add column fts tsvector
  generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
  ) stored;

create index notes_fts_gin on notes using gin(fts);
```

A GIN index on `fts` keeps full-text search fast regardless of note count.
See: https://supabase.com/docs/guides/database/full-text-search

**Relationship:** many notes → one collection (nullable); many notes ↔ many tags via `note_tags`.

---

### `tags`

Stores tag names. Tags are shared across notes via the `note_tags` join table.

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | `uuid` | primary key | `gen_random_uuid()` |
| `name` | `text` | not null, unique | — |
| `user_id` | `uuid` | not null, FK → `auth.users.id` on delete cascade | set by trigger |
| `created_at` | `timestamptz` | not null | `now()` |

---

### `note_tags`

Join table linking notes to tags. One row = one note carrying one tag.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | primary key |
| `note_id` | `uuid` | not null, FK → `notes.id` on delete cascade |
| `tag_id` | `uuid` | not null, FK → `tags.id` on delete cascade |

A note can carry many tags; a tag can apply to many notes.
See: https://supabase.com/docs/guides/database/joins-and-nesting

---

## Row Level Security

All four tables have RLS enabled. Policies enforce that users can only read and
write their own data. `user_id` is set automatically on every insert by a
Postgres trigger — the application never sets it explicitly.

```sql
-- Trigger function (runs for notes, collections, tags)
create or replace function set_user_id()
returns trigger language plpgsql security definer as $$
begin
  new.user_id = auth.uid();
  return new;
end;
$$;

-- Example policy (same pattern on collections and tags)
create policy "users own their notes"
  on notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- note_tags: access derived from note ownership
create policy "users own their note_tags"
  on note_tags for all
  using (
    exists (
      select 1 from notes
      where notes.id = note_tags.note_id
      and notes.user_id = auth.uid()
    )
  );
```

See: https://supabase.com/docs/guides/database/postgres/row-level-security

---

## Entity Relationship Diagram

```
auth.users
    │
    ├─── collections (user_id)
    │         │
    │         └─── notes (collection_id, nullable)
    │                   │
    └─── notes ─────────┤
                        │
                   note_tags ──── tags (user_id)
```

---

## Validation limits (enforced in `app/lib/db.ts`)

| Field | Max length |
|-------|-----------|
| Note title | 200 characters |
| Note body | 100,000 characters |
| Collection name | 100 characters |
| Tag name | 50 characters |
| Search query | 200 characters |
