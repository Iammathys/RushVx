alter table profiles enable row level security;
create policy "profiles_select_own" on profiles for select using (id = auth.uid());
create policy "profiles_update_own" on profiles for update using (id = auth.uid());

alter table projects enable row level security;
create policy "projects_select_own" on projects for select using (owner_id = auth.uid());
create policy "projects_insert_own" on projects for insert with check (owner_id = auth.uid());
create policy "projects_update_own" on projects for update using (owner_id = auth.uid());
create policy "projects_delete_own" on projects for delete using (owner_id = auth.uid());

alter table assets enable row level security;
create policy "assets_select_own" on assets for select using (
  exists(select 1 from projects p where p.id = assets.project_id and p.owner_id = auth.uid())
);
create policy "assets_insert_own" on assets for insert with check (
  exists(select 1 from projects p where p.id = assets.project_id and p.owner_id = auth.uid())
);
create policy "assets_update_own" on assets for update using (
  exists(select 1 from projects p where p.id = assets.project_id and p.owner_id = auth.uid())
);
create policy "assets_delete_own" on assets for delete using (
  exists(select 1 from projects p where p.id = assets.project_id and p.owner_id = auth.uid())
);

alter table timelines enable row level security;
create policy "timelines_select_own" on timelines for select using (
  exists(select 1 from projects p where p.id = timelines.project_id and p.owner_id = auth.uid())
);
create policy "timelines_insert_own" on timelines for insert with check (
  exists(select 1 from projects p where p.id = timelines.project_id and p.owner_id = auth.uid())
);
create policy "timelines_update_own" on timelines for update using (
  exists(select 1 from projects p where p.id = timelines.project_id and p.owner_id = auth.uid())
);
create policy "timelines_delete_own" on timelines for delete using (
  exists(select 1 from projects p where p.id = timelines.project_id and p.owner_id = auth.uid())
);

alter table exports enable row level security;
create policy "exports_select_own" on exports for select using (
  exists(select 1 from projects p where p.id = exports.project_id and p.owner_id = auth.uid())
);
create policy "exports_insert_own" on exports for insert with check (
  exists(select 1 from projects p where p.id = exports.project_id and p.owner_id = auth.uid())
);
create policy "exports_update_own" on exports for update using (
  exists(select 1 from projects p where p.id = exports.project_id and p.owner_id = auth.uid())
);
