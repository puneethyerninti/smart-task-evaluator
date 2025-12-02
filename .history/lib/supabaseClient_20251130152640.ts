// lib/supabaseClient.ts
import { cache } from 'react';
import { cookies } from 'next/headers';
import {
	createClientComponentClient,
	createServerComponentClient,
} from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const createSupabaseBrowserClient = () =>
	createClientComponentClient();

export const createSupabaseServerClient = cache(() =>
	createServerComponentClient({ cookies })
);
