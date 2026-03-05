'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { getSignedUploadUrl, uploadFileToSignedUrl } from '@/lib/storage';

const ACCEPT_VIDEO = 'video/mp4,.mp4';
const ACCEPT_AUDIO = 'audio/mpeg,.mp3';

export default function HomePage() {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<{ video?: File; audio?: File }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const items = Array.from(e.dataTransfer.files);
    const video = items.find((f) => f.type.startsWith('video/') || f.name.endsWith('.mp4'));
    const audio = items.find((f) => f.type.startsWith('audio/') || f.name.endsWith('.mp3'));
    if (video) setFiles((prev) => ({ ...prev, video }));
    if (audio) setFiles((prev) => ({ ...prev, audio }));
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'audio') => {
    const f = e.target.files?.[0];
    if (f) setFiles((prev) => ({ ...prev, [type]: f }));
  }, []);

  const startProject = useCallback(async () => {
    if (!files.video) {
      setError('Ajoutez au moins une vidéo MP4.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const supabase = supabaseBrowser();
      let { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const { error: signError } = await supabase.auth.signInAnonymously();
        if (signError) throw new Error('Connexion requise. Activez l’auth anonyme dans Supabase.');
        // Laisser le temps aux cookies d’être écrits avant le premier appel API
        await new Promise((r) => setTimeout(r, 400));
        const next = await supabase.auth.getUser();
        user = next.data.user;
      }
      if (!user?.id) throw new Error('Session invalide.');

      const { data: { session } } = await supabase.auth.getSession();
      const authHeader = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {};

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ title: files.video?.name ?? 'Nouveau projet' }),
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || res.statusText);
      }
      const project = await res.json();
      const projectId = project.id as string;
      const pathPrefix = `${user.id}/${projectId}/`;

      const videoResult = await uploadAsset(projectId, 'video', files.video!, pathPrefix, session?.access_token);
      let audioResult: { path: string; assetId: string } | undefined;
      if (files.audio) {
        audioResult = await uploadAsset(projectId, 'audio', files.audio, pathPrefix, session?.access_token);
      }

      const timelineRes = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        credentials: 'include',
        body: JSON.stringify({
          timeline: {
            video_asset_id: videoResult.assetId,
            audio_asset_id: audioResult?.assetId ?? null,
            edits: {},
          },
        }),
      });
      if (!timelineRes.ok) throw new Error('Erreur lors de la sauvegarde de la timeline.');

      window.location.href = `/editor/${projectId}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la création du projet.');
    } finally {
      setLoading(false);
    }
  }, [files]);

  async function uploadAsset(
    projectId: string,
    type: 'video' | 'audio',
    file: File,
    pathPrefix: string,
    accessToken?: string | null
  ): Promise<{ path: string; assetId: string }> {
    const { path, token, bucket } = await getSignedUploadUrl(file.name, 'assets', pathPrefix, accessToken);
    await uploadFileToSignedUrl(bucket, path, token, file);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    const res = await fetch(`/api/projects/${projectId}/assets`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type,
        storage_path: path,
        original_name: file.name,
        duration_ms: null,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Upload asset failed');
    }
    const asset = await res.json();
    return { path, assetId: asset.id };
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center text-zinc-100 mb-2">
          RushVx
        </h1>
        <p className="text-zinc-400 text-center text-sm mb-8">
          Importez une vidéo MP4 et optionnellement un MP3 pour monter en 9:16
        </p>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center transition-colors
            ${dragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-600 bg-zinc-800/30'}
          `}
        >
          <p className="text-zinc-400 mb-4">Glissez-déposez ou sélectionnez</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <label className="btn btn-secondary cursor-pointer">
              Vidéo MP4
              <input
                type="file"
                accept={ACCEPT_VIDEO}
                className="hidden"
                onChange={(e) => handleFileInput(e, 'video')}
              />
            </label>
            <label className="btn btn-secondary cursor-pointer">
              Musique MP3
              <input
                type="file"
                accept={ACCEPT_AUDIO}
                className="hidden"
                onChange={(e) => handleFileInput(e, 'audio')}
              />
            </label>
          </div>
          {files.video && (
            <p className="mt-4 text-sm text-emerald-400">
              Vidéo : {files.video.name}
            </p>
          )}
          {files.audio && (
            <p className="mt-1 text-sm text-emerald-400">
              Audio : {files.audio.name}
            </p>
          )}
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
        )}

        <button
          type="button"
          onClick={startProject}
          disabled={!files.video || loading}
          className="btn btn-primary w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Création du projet…' : 'Créer le projet et ouvrir l’éditeur'}
        </button>

        <p className="mt-6 text-center text-zinc-500 text-xs">
          Vous devez configurer Supabase (Auth anonyme activée, buckets assets/renders, schéma DB).
          <br />
          <Link href="/api/health" className="text-indigo-400 hover:underline">
            Vérifier l’API
          </Link>
        </p>
      </div>
    </div>
  );
}
