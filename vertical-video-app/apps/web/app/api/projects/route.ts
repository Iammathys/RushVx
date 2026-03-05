import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseWithAuth } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getSupabaseWithAuth(request);
    if (!user || !supabase) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('projects')
      .select('id, title, status, duration_ms, fps, aspect, created_at, updated_at')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data ?? []);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await getSupabaseWithAuth(req);
    if (!user || !supabase) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const title = typeof body.title === 'string' ? body.title : 'Sans titre';

    // S'assurer que le profil existe (le trigger auth peut ne pas avoir créé pour anonyme)
    const admin = getSupabaseAdmin();
    await admin.from('profiles').upsert(
      { id: user.id, display_name: user.email ?? 'Utilisateur' },
      { onConflict: 'id' }
    );

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        owner_id: user.id,
        title,
        status: 'draft',
        aspect: '9:16',
        fps: 30,
      })
      .select('id, title, status, created_at')
      .single();

    if (projectError) {
      return NextResponse.json({ error: projectError.message }, { status: 400 });
    }

    await supabase.from('timelines').insert({
      project_id: project.id,
      edits: {},
    });

    return NextResponse.json(project);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
