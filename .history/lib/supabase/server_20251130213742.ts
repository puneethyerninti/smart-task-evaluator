import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

// WORKING for Supabase 0.10.0 + Next.js 15/16 + Turbopack
export function createSupabaseServerClient() {
  return createServerComponentClient({
    cookies
  });
}
