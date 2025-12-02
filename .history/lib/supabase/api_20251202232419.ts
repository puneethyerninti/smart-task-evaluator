import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseKeys } from '../env';

export async function createSupabaseRouteHandlerClient() {
  const { url, anon } = getSupabaseKeys();
  if (!url || !anon) {
    throw new Error(
      'Supabase env vars missing for route handler. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.'
    );
  }

  const cookieStore = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });
}
