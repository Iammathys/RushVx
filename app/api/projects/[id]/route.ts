import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseWithAuth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, user } = await getSupabaseWithAuth(req);
    if (!user || !supabase) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });
    }

    const { data: timeline } = await supabase
      .from('timelines')
      .select('id, video_asset_id, audio_asset_id, edits')
      .eq('project_id', id)
      .single();

    const assetIds = [
      timeline?.video_asset_id,
      timeline?.audio_asset_id,
    ].filter(Boolean) as string[];

    let assets: { id: string; type: string; storage_path: string; original_name: string | null; duration_ms: number | null }[] = [];
    if (assetIds.length > 0) {
      const { data: assetsData } = await supabase
        .from('assets')
        .select('id, type, storage_path, original_name, duration_ms')
        .in('id', assetIds);
      assets = assetsData ?? [];
    }

    return NextResponse.json({
      ...project,
      timeline: timeline ?? null,
      assets,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, user } = await getSupabaseWithAuth(req);
    if (!user || !supabase) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));

    const projectUpdates: Record<string, unknown> = {};
    if (typeof body.title === 'string') projectUpdates.title = body.title;
    if (typeof body.status === 'string' && ['draft', 'rendering', 'rendered'].includes(body.status)) projectUpdates.status = body.status;
    if (typeof body.duration_ms === 'number') projectUpdates.duration_ms = body.duration_ms;
    if (typeof body.fps === 'number') projectUpdates.fps = body.fps;
    projectUpdates.updated_at = new Date().toISOString();

    if (Object.keys(projectUpdates).length > 0) {
      await supabase.from('projects').update(projectUpdates).eq('id', id).eq('owner_id', user.id);
    }

    if (body.timeline && typeof body.timeline === 'object') {
      const tl = body.timeline as { video_asset_id?: string; audio_asset_id?: string; edits?: unknown };
      const timelineUpdates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (tl.video_asset_id !== undefined) timelineUpdates.video_asset_id = tl.video_asset_id || null;
      if (tl.audio_asset_id !== undefined) timelineUpdates.audio_asset_id = tl.audio_asset_id || null;
      if (tl.edits !== undefined) timelineUpdates.edits = tl.edits;
      await supabase
        .from('timelines')
        .update(timelineUpdates)
        .eq('project_id', id);
    }

    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    return NextResponse.json(project);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
