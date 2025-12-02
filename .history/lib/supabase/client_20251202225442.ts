import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    // Return a proxy that throws on auth calls to surface a clear configuration error at runtime instead of failing build prerender.
    return new Proxy(
      {},
      {
        get() {
          throw new Error(
            "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel Project Settings > Environment Variables."
          );
        },
      }
    ) as ReturnType<typeof createBrowserClient>;
  }

  return createBrowserClient(url, anon);
}
