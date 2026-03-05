-- Profiles (id = auth.users.id)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

-- Projets
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade not null,
  title text,
  status text check (status in ('draft','rendering','rendered')) default 'draft',
  duration_ms int,
  fps int,
  aspect text default '9:16',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Assets (vidéo / audio)
create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade not null,
  type text check (type in ('video','audio')) not null,
  storage_path text not null,
  original_name text,
  duration_ms int,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Timelines (édits par projet)
create table if not exists timelines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade not null,
  video_asset_id uuid references assets(id) on delete set null,
  audio_asset_id uuid references assets(id) on delete set null,
  edits jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Exports
create table if not exists exports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade not null,
  target text check (target in ('file','youtube','tiktok','instagram')) not null,
  status text check (status in ('queued','processing','done','error')) default 'queued',
  storage_path text,
  external_video_id text,
  log text,
  created_at timestamptz default now()
);

-- Trigger: créer un profil à l'inscription
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
