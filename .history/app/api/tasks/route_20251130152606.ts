import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { requestEvaluation } from '@/lib/aiEvaluator';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { title, description, code } = body;

  if (!title || !description || !code) {
    return NextResponse.json({ error: 'Title, description, and code are required.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      title,
      description,
      code,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create task' }, { status: 500 });
  }

  requestEvaluation({
    taskId: data.id,
    userId: user.id,
    title,
    description,
    code,
  });

  return NextResponse.json({ task: data });
}
