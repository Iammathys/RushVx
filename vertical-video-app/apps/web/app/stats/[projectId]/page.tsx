'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import { supabaseBrowser } from '@/lib/supabaseClient';

export default function StatsPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const [project, setProject] = useState<{
    title: string;
    duration_ms: number | null;
    fps: number | null;
    status: string;
    created_at: string;
    updated_at: string;
  } | null>(null);

  useEffect(() => {
    if (!projectId) return;
    const run = async () => {
      const supabase = supabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      const authHeader = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
      const r = await fetch(`/api/projects/${projectId}`, { credentials: 'include', headers: authHeader });
      const data = r.ok ? await r.json() : null;
      if (data) setProject({
        title: data.title,
        duration_ms: data.duration_ms,
        fps: data.fps,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
      });
    };
    run().catch(() => setProject(null));
  }, [projectId]);

  return (
    <div className="min-h-screen pb-20">
      <header className="border-b border-zinc-700 bg-zinc-900/95">
        <div className="max-w-lg mx-auto px-4 h-12 flex items-center justify-between">
          <Link href={`/editor/${projectId}`} className="text-zinc-400 hover:text-zinc-200 text-sm">
            ← Éditeur
          </Link>
          <span className="font-medium text-zinc-200">Statistiques</span>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {project ? (
          <div className="rounded-xl bg-zinc-800/50 border border-zinc-700 p-4 space-y-3">
            <h2 className="font-medium text-zinc-200">{project.title}</h2>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-zinc-500">Statut</dt>
              <dd className="text-zinc-300">{project.status}</dd>
              <dt className="text-zinc-500">Durée</dt>
              <dd className="text-zinc-300">
                {project.duration_ms != null
                  ? `${(project.duration_ms / 1000).toFixed(1)} s`
                  : '—'}
              </dd>
              <dt className="text-zinc-500">FPS</dt>
              <dd className="text-zinc-300">{project.fps ?? '—'}</dd>
              <dt className="text-zinc-500">Créé le</dt>
              <dd className="text-zinc-300">
                {new Date(project.created_at).toLocaleDateString('fr-FR')}
              </dd>
              <dt className="text-zinc-500">Modifié le</dt>
              <dd className="text-zinc-300">
                {new Date(project.updated_at).toLocaleDateString('fr-FR')}
              </dd>
            </dl>
          </div>
        ) : (
          <p className="text-zinc-500">Chargement…</p>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
