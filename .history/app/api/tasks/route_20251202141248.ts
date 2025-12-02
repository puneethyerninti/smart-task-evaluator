import { NextResponse } from 'next/server';
import { createClient, type PostgrestError } from '@supabase/supabase-js';
import { requestEvaluation } from '@/lib/aiEvaluator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type TaskRow = {
  id: string;
  user_id: string;
  language?: string | null;
  status?: string | null;
  title?: string | null;
  description?: string | null;
  code?: string | null;
};

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

  let createdTask: TaskRow | null = null;
  let insertError: PostgrestError | null = null;

  const insert = await supabase
    .from('tasks')
    .insert(basePayload)
    .select('*')
    .single();

  createdTask = insert.data as TaskRow | null;
  insertError = insert.error;

  // Fallback: if the Supabase project hasn't been migrated yet and `language`
  // Fallback: if the Supabase project hasn't been migrated yet and the
  // `language` column is missing, retry without the column so users can still proceed.
  const isMissingLanguageColumn = (err: PostgrestError | null | undefined) => {
    if (!err) return false;
    const msg = (err.message ?? "").toLowerCase();
    const details = (err.details ?? "").toLowerCase();
    // Postgres code 42703 indicates undefined column. Also check message text
    // because different client layers can wrap errors differently.
    return (
      String(err.code) === "42703" ||
      msg.includes("column \"language\"") ||
      msg.includes("column language") ||
      details.includes("language")
    );
  };

  if (isMissingLanguageColumn(insertError)) {
    const legacyPayload: Record<string, unknown> = { ...basePayload };
    delete legacyPayload.language;

    const legacyInsert = await supabase
      .from('tasks')
      .insert(legacyPayload)
      .select('*')
      .single();

    createdTask = legacyInsert.data as TaskRow | null;
    insertError = legacyInsert.error;
  }

  if (insertError || !createdTask) {
    console.error('Supabase insert error:', insertError, 'inserted data:', createdTask);
    const devDetails = {
      message: insertError?.message ?? 'Failed to create task',
      details: insertError?.details ?? null,
      hint: insertError?.hint ?? null,
      code: insertError?.code ?? null,
    };

    return NextResponse.json({ error: devDetails.message, dev: devDetails }, { status: 500 });
  }

  requestEvaluation({
    taskId: createdTask.id,
    userId: user.id,
    title,
    description,
    code,
    language: normalizedLanguage,
  });

  return NextResponse.json({ task: createdTask });
}
