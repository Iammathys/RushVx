-- ============================================================
-- RushVx - Schéma Supabase
-- IMPORTANT : Collez tout le CODE SQL ci-dessous (à partir de "-- 1) Tables")
-- dans Supabase > SQL Editor > New query. Ne collez PAS le chemin du fichier.
-- Puis cliquez sur Run.
-- ============================================================

-- 1) Tables
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  title text,
  status text check (status in ('draft','rendering','rendered')) default 'draft',
  duration_ms int,
  fps int,
  aspect text default '9:16',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  type text check (type in ('video','audio')) not null,
  storage_path text not null,
  original_name text,
  duration_ms int,
  metadata jsonb,
  created_at timestamptz default now()
);

create table if not exists public.timelines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  video_asset_id uuid references public.assets(id) on delete set null,
  audio_asset_id uuid references public.assets(id) on delete set null,
  edits jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.exports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  target text check (target in ('file','youtube','tiktok','instagram')) not null,
  status text check (status in ('queued','processing','done','error')) default 'queued',
  storage_path text,
  external_video_id text,
  log text,
  created_at timestamptz default now()
);

-- 2) Trigger : créer un profil quand un utilisateur (anon inclus) est créé
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3) RLS
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid());

alter table public.projects enable row level security;
create policy "projects_select_own" on public.projects for select using (owner_id = auth.uid());
create policy "projects_insert_own" on public.projects for insert with check (owner_id = auth.uid());
create policy "projects_update_own" on public.projects for update using (owner_id = auth.uid());
create policy "projects_delete_own" on public.projects for delete using (owner_id = auth.uid());

alter table public.assets enable row level security;
create policy "assets_select_own" on public.assets for select using (
  exists(select 1 from public.projects p where p.id = assets.project_id and p.owner_id = auth.uid())
);
create policy "assets_insert_own" on public.assets for insert with check (
  exists(select 1 from public.projects p where p.id = assets.project_id and p.owner_id = auth.uid())
);
create policy "assets_update_own" on public.assets for update using (
  exists(select 1 from public.projects p where p.id = assets.project_id and p.owner_id = auth.uid())
);
create policy "assets_delete_own" on public.assets for delete using (
  exists(select 1 from public.projects p where p.id = assets.project_id and p.owner_id = auth.uid())
);

alter table public.timelines enable row level security;
create policy "timelines_select_own" on public.timelines for select using (
  exists(select 1 from public.projects p where p.id = timelines.project_id and p.owner_id = auth.uid())
);
create policy "timelines_insert_own" on public.timelines for insert with check (
  exists(select 1 from public.projects p where p.id = timelines.project_id and p.owner_id = auth.uid())
);
create policy "timelines_update_own" on public.timelines for update using (
  exists(select 1 from public.projects p where p.id = timelines.project_id and p.owner_id = auth.uid())
);
create policy "timelines_delete_own" on public.timelines for delete using (
  exists(select 1 from public.projects p where p.id = timelines.project_id and p.owner_id = auth.uid())
);

alter table public.exports enable row level security;
create policy "exports_select_own" on public.exports for select using (
  exists(select 1 from public.projects p where p.id = exports.project_id and p.owner_id = auth.uid())
);
create policy "exports_insert_own" on public.exports for insert with check (
  exists(select 1 from public.projects p where p.id = exports.project_id and p.owner_id = auth.uid())
);
create policy "exports_update_own" on public.exports for update using (
  exists(select 1 from public.projects p where p.id = exports.project_id and p.owner_id = auth.uid())
);
