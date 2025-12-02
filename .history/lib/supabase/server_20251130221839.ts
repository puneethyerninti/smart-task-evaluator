import { cache } from "react";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

// Resolve cookies() once per request to stay compatible with the async Next.js 16 API.
export const createSupabaseServerClient = cache(async () => {
  const cookieStore = await Promise.resolve(cookies());

  return createServerComponentClient({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });
});
