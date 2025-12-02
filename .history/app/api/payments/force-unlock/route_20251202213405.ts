import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized - missing token' }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  const user = authData?.user;
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized - invalid token' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const evaluationId = body?.evaluationId as string | undefined;

  try {
    if (evaluationId) {
      const { error } = await supabase
        .from('reports')
        .update({ unlocked: true })
        .eq('id', evaluationId)
        .eq('user_id', user.id);

      if (error) throw error;
      return NextResponse.json({ success: true, unlocked: [evaluationId] });
    }

    const { data, error } = await supabase
      .from('reports')
      .update({ unlocked: true })
      .eq('user_id', user.id);

    if (error) throw error;
    const unlockedIds = Array.isArray(data) ? data.map((r: any) => r.id) : [];
    return NextResponse.json({ success: true, unlocked: unlockedIds });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('force-unlock error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
