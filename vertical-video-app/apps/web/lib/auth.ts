import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import type { User } from '@supabase/supabase-js';

export type AuthResult = { supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>; user: User };

/**
 * Récupère le client Supabase et l'utilisateur : cookies d'abord, sinon token Bearer.
 * À utiliser dans les routes API protégées (RLS fonctionne avec le bon client).
 */
export async function getSupabaseWithAuth(request: NextRequest): Promise<AuthResult | { supabase: null; user: null }> {
  const supabase = await createSupabaseServerClient();
  let { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (token) {
      const result = await supabase.auth.getUser(token);
      user = result.data.user ?? null;
      if (user) {
        const clientWithToken = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { global: { headers: { Authorization: `Bearer ${token}` } } }
        );
        return { supabase: clientWithToken, user };
      }
    }
    return { supabase: null, user: null };
  }

  return { supabase, user };
}
