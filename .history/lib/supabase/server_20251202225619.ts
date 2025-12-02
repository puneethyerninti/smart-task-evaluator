import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Resolve cookies() once per request to stay compatible with the async Next.js 16 API.
export const createSupabaseServerClient = cache(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const cookieStore = await Promise.resolve(cookies());

  if (!url || !anon) {
    // Provide a harmless stub so server components can render configuration guidance without throwing.
    const stub = {
      auth: {
        async getUser() {
          return { data: { user: null }, error: null };
        },
      },
      from() {
        return {
          select() { return this; },
          eq() { return this; },
          order() { return this; },
          update() { return this; },
          insert() { return this; },
          async single() { return { data: null, error: null }; },
          async then(resolve: any) { resolve({ data: [], error: null }); },
        } as any;
      },
    } as any;
    return stub;
  }

  return createServerClient(url, anon, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });
});
