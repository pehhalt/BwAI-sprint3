create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  url text not null,
  title text not null,
  created_at timestamptz not null default now()
);

alter table public.bookmarks enable row level security;

create policy "bookmarks_select_own" on public.bookmarks
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "bookmarks_insert_own" on public.bookmarks
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "bookmarks_delete_own" on public.bookmarks
  for delete
  to authenticated
  using (auth.uid() = user_id);
