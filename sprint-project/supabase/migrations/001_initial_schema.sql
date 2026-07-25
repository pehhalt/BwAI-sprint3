-- Script Rewriter initial schema
-- Review in a development Supabase project before applying to production.

create extension if not exists pgcrypto;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  target_audience text not null default '',
  global_instructions text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  source_text text not null default '',
  source_page_start integer check (source_page_start is null or source_page_start > 0),
  source_page_end integer check (source_page_end is null or source_page_end > 0),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    source_page_start is null
    or source_page_end is null
    or source_page_end >= source_page_start
  )
);

create table public.rewrite_versions (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rewritten_text text not null,
  section_instructions text not null default '',
  model text not null,
  status text not null default 'draft'
    check (status in ('draft', 'manually_edited', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index one_approved_rewrite_per_section
  on public.rewrite_versions(section_id)
  where status = 'approved';

create index projects_user_id_idx on public.projects(user_id);
create index sections_project_id_position_idx on public.sections(project_id, position);
create index rewrite_versions_section_id_created_at_idx
  on public.rewrite_versions(section_id, created_at desc);

alter table public.projects enable row level security;
alter table public.sections enable row level security;
alter table public.rewrite_versions enable row level security;

create policy "projects_select_own"
  on public.projects for select
  using (user_id = auth.uid());

create policy "projects_insert_own"
  on public.projects for insert
  with check (user_id = auth.uid());

create policy "projects_update_own"
  on public.projects for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "projects_delete_own"
  on public.projects for delete
  using (user_id = auth.uid());

create policy "sections_select_own"
  on public.sections for select
  using (user_id = auth.uid());

create policy "sections_insert_own"
  on public.sections for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

create policy "sections_update_own"
  on public.sections for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "sections_delete_own"
  on public.sections for delete
  using (user_id = auth.uid());

create policy "rewrite_versions_select_own"
  on public.rewrite_versions for select
  using (user_id = auth.uid());

create policy "rewrite_versions_insert_own"
  on public.rewrite_versions for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.sections s
      where s.id = section_id
        and s.project_id = project_id
        and s.user_id = auth.uid()
    )
  );

create policy "rewrite_versions_update_own"
  on public.rewrite_versions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "rewrite_versions_delete_own"
  on public.rewrite_versions for delete
  using (user_id = auth.uid());
