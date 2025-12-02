// lib/supabaseClient.ts
"use server";

import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

// Browser client (for client components)
export const createSupabaseBrowserClient = () =>
  createClientComponentClient();

// Server client (for server components)
export const createSupabaseServerClient = () => {
  return createServerComponentClient({ 
    cookies: () => cookies()
  });
};

// (Optional) direct supabase-js client for non-auth DB operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
