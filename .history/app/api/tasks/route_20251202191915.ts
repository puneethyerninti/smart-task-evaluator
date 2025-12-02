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

type TaskInsertPayload = {
  user_id: string;
  title: string;
  description: string;
  code: string;
  language?: string;
  status?: string;
};

type OptionalColumn = 'language' | 'status';

const formatMissingColumnHaystack = (err: PostgrestError) =>
  `${err.message ?? ''} ${err.details ?? ''} ${err.hint ?? ''}`.toLowerCase();

const isMissingColumn = (err: PostgrestError | null | undefined, column: OptionalColumn) => {
  if (!err) return false;
  const haystack = formatMissingColumnHaystack(err);
  const needle = column.toLowerCase();
  return (
    String(err.code) === '42703' ||
    haystack.includes(`'${needle}' column`) ||
    haystack.includes(`column "${needle}"`) ||
    haystack.includes(`column ${needle}`)
  );
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
    error: authError?.message,
  });

  const user = authData?.user;

  if (authError || !user) {
    console.error('Token verification failed:', authError);
    return NextResponse.json({
      error: 'Unauthorized - Invalid token',
      details: authError?.message,
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

  const normalizedLanguage = typeof language === 'string' && language.trim().length > 0
    ? language.trim().toLowerCase()
    : 'unspecified';

  const basePayload: TaskInsertPayload = {
    user_id: user.id,
    title,
    description,
    code,
    language: normalizedLanguage,
    status: 'pending',
  };

  let createdTask: TaskRow | null = null;
  let insertError: PostgrestError | null = null;
  let currentPayload: TaskInsertPayload = { ...basePayload };

  const performInsert = async () => {
    const insert = await supabase
      .from('tasks')
      .insert(currentPayload)
      .select('*')
      .single();

    createdTask = insert.data as TaskRow | null;
    insertError = insert.error;
  };

  await performInsert();

  const retryWithoutColumn = async (column: OptionalColumn) => {
    if (!isMissingColumn(insertError, column)) {
      return;
    }

    const updatedPayload: TaskInsertPayload = { ...currentPayload };
    if (column === 'language') {
      delete updatedPayload.language;
    } else {
      delete updatedPayload.status;
    }

    currentPayload = updatedPayload;
    await performInsert();
  };

  await retryWithoutColumn('language');
  await retryWithoutColumn('status');

  if (insertError || !createdTask) {
    console.error('Supabase insert error:', insertError, 'inserted data:', createdTask);
    const ie = insertError;
    const devDetails = {
      message: ie?.message ?? 'Failed to create task',
      details: ie?.details ?? null,
      hint: ie?.hint ?? null,
      code: ie?.code ?? null,
    };

    return NextResponse.json({ error: devDetails.message, dev: devDetails }, { status: 500 });
  }

  const task = createdTask as TaskRow;

  requestEvaluation({
    taskId: task.id,
    userId: user.id,
    title,
    description,
    code,
    language: normalizedLanguage,
  });

  return NextResponse.json({ task });
}
