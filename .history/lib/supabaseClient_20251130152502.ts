// lib/supabaseClient.ts
import { cache } from 'react';
import { cookies } from 'next/headers';
import {
	createClientComponentClient,
	createServerComponentClient,
} from '@supabase/auth-helpers-nextjs';

export const createSupabaseBrowserClient = () =>
	createClientComponentClient();

export const createSupabaseServerClient = cache(() =>
	createServerComponentClient({ cookies })
);
