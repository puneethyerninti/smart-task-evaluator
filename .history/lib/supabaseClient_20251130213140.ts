// lib/supabaseClient.ts

import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

// Browser client (client components)
export const createSupabaseBrowserClient = () =>
  createClientComponentClient();

// Server client (server components)
export const createSupabaseServerClient = () => {
  return createServerComponentClient({
    cookies: () => cookies()
  });
};

// Direct supabase-js client (optional)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
