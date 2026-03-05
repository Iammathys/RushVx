import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseWithAuth } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { supabase, user } = await getSupabaseWithAuth(req);
    if (!user || !supabase) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const type = body.type === 'audio' ? 'audio' : 'video';
    const storage_path = typeof body.storage_path === 'string' ? body.storage_path : '';
    const original_name = typeof body.original_name === 'string' ? body.original_name : null;
    const duration_ms = typeof body.duration_ms === 'number' ? body.duration_ms : null;

    if (!storage_path) {
      return NextResponse.json({ error: 'storage_path requis' }, { status: 400 });
    }

    const { data: asset, error } = await supabase
      .from('assets')
      .insert({
        project_id: projectId,
        type,
        storage_path,
        original_name,
        duration_ms,
      })
      .select('id, type, storage_path, original_name, duration_ms')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(asset);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
