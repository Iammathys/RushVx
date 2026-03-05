import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseWithAuth } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { user } = await getSupabaseWithAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const path = typeof body.path === 'string' ? body.path : '';
    const bucket = typeof body.bucket === 'string' ? body.bucket : 'assets';

    if (!path || !path.startsWith(user.id + '/')) {
      return NextResponse.json({ error: 'Chemin invalide' }, { status: 400 });
    }

    const { data, error } = await getSupabaseAdmin().storage
      .from(bucket)
      .createSignedUrl(path, 3600);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ url: data?.signedUrl ?? '' });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
