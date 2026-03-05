/**
 * Helpers pour Supabase Storage.
 * Upload : API create-signed-url puis uploadToSignedUrl côté client (format attendu par Supabase).
 */

import { supabaseBrowser } from '@/lib/supabaseClient';

export async function getSignedUploadUrl(
  filename: string,
  bucket: string = 'assets',
  pathPrefix: string = '',
  accessToken?: string | null
): Promise<{ url: string; path: string; token: string | null; bucket: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  const res = await fetch('/api/upload/create-signed-url', {
    method: 'POST',
    headers,
    body: JSON.stringify({ filename, bucket, pathPrefix }),
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText || 'Upload URL failed');
  }
  const data = await res.json();
  return {
    url: data.url,
    path: data.path,
    token: data.token ?? null,
    bucket: bucket,
  };
}

/**
 * Upload via l'API Supabase uploadToSignedUrl (token + path).
 * À utiliser de préférence : évite le 400 dû au PUT brut.
 */
export async function uploadFileToSignedUrl(
  bucket: string,
  path: string,
  token: string | null,
  file: File | Blob
): Promise<void> {
  if (!token) {
    throw new Error('Token d’upload manquant');
  }
  const supabase = supabaseBrowser();
  const contentType = file instanceof File && file.type ? file.type : 'application/octet-stream';
  const { error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(path, token, file, { contentType });
  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
}
