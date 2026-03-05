'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import ExportPanel from '@/components/ExportPanel';
import { useEditorStore } from '@/store/editorStore';
import { supabaseBrowser } from '@/lib/supabaseClient';

export default function ExportPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const { projectId: storeId, loadProject } = useEditorStore();

  useEffect(() => {
    if (!projectId || storeId === projectId) return;
    (async () => {
      const supabase = supabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      const authHeader = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};

      const res = await fetch(`/api/projects/${projectId}`, {
        credentials: 'include',
        headers: authHeader,
      });
      if (!res.ok) return;
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
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({ path: video.storage_path, bucket: 'assets' }),
          credentials: 'include',
        });
        if (urlRes.ok) {
          const { url } = await urlRes.json();
          useEditorStore.getState().setVideo(video, url, null);
        }
      }
      if (audio?.storage_path) {
        const urlRes = await fetch('/api/storage/signed-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({ path: audio.storage_path, bucket: 'assets' }),
          credentials: 'include',
        });
        if (urlRes.ok) {
          const { url } = await urlRes.json();
          useEditorStore.getState().setAudio(audio, url, null);
        }
      }
    })();
  }, [projectId, storeId, loadProject]);

  return (
    <div className="min-h-screen pb-20">
      <header className="border-b border-zinc-700 bg-zinc-900/95">
        <div className="max-w-lg mx-auto px-4 h-12 flex items-center justify-between">
          <Link href={`/editor/${projectId}`} className="text-zinc-400 hover:text-zinc-200 text-sm">
            ← Éditeur
          </Link>
          <span className="font-medium text-zinc-200">Export</span>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">
        <ExportPanel />
      </main>
      <BottomNav />
    </div>
  );
}
