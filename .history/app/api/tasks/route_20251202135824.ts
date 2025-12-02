import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requestEvaluation } from '@/lib/aiEvaluator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  console.log('Auth header received:', authHeader ? authHeader.substring(0, 30) + '...' : 'NONE');
  
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : null;

  if (!token) {
    console.error('No bearer token found in request');
    return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
  }

  console.log('Verifying token with Supabase...');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const {
    data: authData,
    error: authError,
  } = await supabase.auth.getUser();

  console.log('Auth result:', { 
    userId: authData?.user?.id, 
    error: authError?.message 
  });

  const user = authData?.user;

  if (authError || !user) {
    console.error('Token verification failed:', authError);
    return NextResponse.json({ 
      error: 'Unauthorized - Invalid token',
      details: authError?.message 
    }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { title, description, code, language } = body;

  if (!title || !description || !code) {
    return NextResponse.json({ error: 'Title, description, and code are required.' }, { status: 400 });
  }

  const normalizedLanguage = typeof language === 'string' && language.trim().length > 0 ? language.trim().toLowerCase() : 'unspecified';

  const basePayload = {
    user_id: user.id,
    title,
    description,
    code,
    language: normalizedLanguage,
    status: 'pending',
  };

  let data;
  let error;

  const insert = await supabase
    .from('tasks')
    .insert(basePayload)
    .select('*')
    .single();

  data = insert.data;
  error = insert.error;

  // Fallback: if the Supabase project hasn't been migrated yet and `language`
  // column is missing, retry without the column so users can still proceed.
  if (error && (error as any)?.code === '42703') {
    const legacyPayload = { ...basePayload } as Record<string, unknown>;
    delete legacyPayload.language;

    const legacyInsert = await supabase
      .from('tasks')
      .insert(legacyPayload)
      .select('*')
      .single();

    data = legacyInsert.data;
    error = legacyInsert.error;
  }

  if (error || !data) {
    console.error('Supabase insert error:', error, 'inserted data:', data);
    const devDetails = {
      message: error?.message ?? 'Failed to create task',
      details: (error as any)?.details ?? null,
      hint: (error as any)?.hint ?? null,
      code: (error as any)?.code ?? null,
    };

    return NextResponse.json({ error: devDetails.message, dev: devDetails }, { status: 500 });
  }

  requestEvaluation({
    taskId: data.id,
    userId: user.id,
    title,
    description,
    code,
    language: normalizedLanguage,
  });

  return NextResponse.json({ task: data });
}
