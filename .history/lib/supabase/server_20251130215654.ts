import { cache } from "react";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

// Memoize to avoid re-instantiating per request while keeping per-user isolation.
export const createSupabaseServerClient = cache(() =>
  createServerComponentClient({
    cookies,
  })
);
