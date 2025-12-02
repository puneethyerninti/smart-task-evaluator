import { cookies } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";

// Fully compatible with Next.js 15–16 + Turbopack
export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient({
    cookies: () => cookieStore
  });
}
