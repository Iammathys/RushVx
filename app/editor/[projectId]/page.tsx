'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import VideoPlayer from '@/components/VideoPlayer';
import Timeline from '@/components/Timeline';
import MusicPanel from '@/components/MusicPanel';
import ExportPanel from '@/components/ExportPanel';
import TrimControls from '@/components/TrimControls';
import { useEditorStore } from '@/store/editorStore';
import { supabaseBrowser } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'edit' | 'export'>('edit');
  const {
    loadProject,
    setVideo,
    setAudio,
    setError,
    setSaving,
    setDirty,
    projectId: storeProjectId,
    title,
    setTitle,
    isDirty,
    isSaving,
    error,
    videoAsset,
    audioAsset,
  } = useEditorStore();

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = supabaseBrowser();
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

        const res = await fetch(`/api/projects/${projectId}`, {
          credentials: 'include',
          headers,
        });
        if (!res.ok) {
          if (res.status === 404) router.replace('/');
          return;
        }
        const data = await res.json();
        loadProject(projectId, {
          title: data.title ?? 'Sans titre',
          timeline: data.timeline,
          assets: data.assets,
        });

        const assets = data.assets ?? [];
        const video = data.timeline?.video_asset_id
          ? assets.find((a: { id: string }) => a.id === data.timeline.video_asset_id)
          : null;
        const audio = data.timeline?.audio_asset_id
          ? assets.find((a: { id: string }) => a.id === data.timeline.audio_asset_id)
          : null;

        if (video?.storage_path) {
          const urlRes = await fetch('/api/storage/signed-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify({ path: video.storage_path, bucket: 'assets' }),
            credentials: 'include',
          });
          if (urlRes.ok) {
            const { url } = await urlRes.json();
            setVideo(video, url, null);
          }
        }
        if (audio?.storage_path) {
          const urlRes = await fetch('/api/storage/signed-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify({ path: audio.storage_path, bucket: 'assets' }),
            credentials: 'include',
          });
          if (urlRes.ok) {
            const { url } = await urlRes.json();
            setAudio(audio, url, null);
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur chargement projet');
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, loadProject, setVideo, setAudio, setError]);

  const handleSave = async () => {
    if (!storeProjectId || !isDirty) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = supabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
      const res = await fetch(`/api/projects/${storeProjectId}`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          title,
          timeline: {
            video_asset_id: videoAsset?.id ?? null,
            audio_asset_id: audioAsset?.id ?? null,
            edits: useEditorStore.getState().edits,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || res.statusText);
      }
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (!projectId) return null;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-400">Chargement du projet…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 border-b border-zinc-700 bg-zinc-900/95 backdrop-blur">
        <div className="flex items-center justify-between max-w-4xl mx-auto px-4 h-12">
          <Link href="/" className="text-zinc-400 hover:text-zinc-200 text-sm">
            ← Accueil
          </Link>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent text-center font-medium text-zinc-100 w-48 focus:outline-none focus:ring-0"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="text-sm text-indigo-400 hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Enregistrement…' : isDirty ? 'Enregistrer' : 'Enregistré'}
          </button>
        </div>
      </header>

      {error && (
        <div className="max-w-4xl mx-auto px-4 py-2">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <VideoPlayer />
        <Timeline />
        <TrimControls />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab('edit')}
            className={`btn flex-1 ${tab === 'edit' ? 'btn-primary' : 'btn-ghost'}`}
          >
            Musique
          </button>
          <button
            type="button"
            onClick={() => setTab('export')}
            className={`btn flex-1 ${tab === 'export' ? 'btn-primary' : 'btn-ghost'}`}
          >
            Export
          </button>
        </div>
        {tab === 'edit' && <MusicPanel />}
        {tab === 'export' && <ExportPanel />}
      </main>
      <BottomNav />
    </div>
  );
}
