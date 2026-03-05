import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseWithAuth } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { user } = await getSupabaseWithAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const filename = typeof body.filename === 'string' ? body.filename : 'file';
    const bucket = typeof body.bucket === 'string' ? body.bucket : 'assets';
    const pathPrefix = typeof body.pathPrefix === 'string' ? body.pathPrefix : '';

    const safeName = `${crypto.randomUUID()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const path = `${pathPrefix}${safeName}`.replace(/^\/+/, '').replace(/\/+/g, '/');
    const fullPath = path.startsWith(user.id) ? path : `${user.id}/${path}`;

    const { data, error } = await getSupabaseAdmin().storage
      .from(bucket)
      .createSignedUploadUrl(fullPath);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({
      url: data?.signedUrl,
      path: fullPath,
      token: data?.token ?? null,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
