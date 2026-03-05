-- Activer RLS sur storage.objects (Supabase Dashboard > Storage > Policies si besoin)
-- Les buckets 'assets' et 'renders' doivent exister et être privés.
-- Arborescence recommandée : {auth.uid()}/{project_id}/fichier.mp4

create policy "storage_select_own" on storage.objects
for select to authenticated
using (
  bucket_id in ('assets','renders')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "storage_insert_own" on storage.objects
for insert to authenticated
with check (
  bucket_id in ('assets','renders')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "storage_update_own" on storage.objects
for update to authenticated
using (
  bucket_id in ('assets','renders')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "storage_delete_own" on storage.objects
for delete to authenticated
using (
  bucket_id in ('assets','renders')
  and (storage.foldername(name))[1] = auth.uid()::text
);
