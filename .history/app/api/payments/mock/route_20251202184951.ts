import { NextResponse } from 'next/server';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/api';

// Demo-only mock payment endpoint. This simulates a successful payment
// and unlocks the specified report for the authenticated user.
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const contentType = request.headers.get('content-type') ?? '';
    let reportId: string | null = null;

    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => null);
      reportId = (body?.reportId ?? body?.evaluationId) as string | null;
    } else {
      const form = await request.formData();
      const v = form.get('reportId') ?? form.get('evaluationId');
      reportId = typeof v === 'string' ? v : null;
    }

    if (!reportId) return NextResponse.json({ error: 'Missing reportId' }, { status: 400 });

    // confirm report belongs to user
    const { data: report, error } = await supabase
      .from('reports')
      .select('id, unlocked')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();

    if (error || !report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    if (report.unlocked) return NextResponse.json({ error: 'Report already unlocked' }, { status: 400 });

    // Insert a payment record and mark report as unlocked (demo: amount=0, method=mock)
    const { error: payErr } = await supabase.from('payments').insert([
      {
        user_id: user.id,
        report_id: reportId,
        stripe_session_id: null,
        stripe_payment_id: null,
        amount: 0,
        currency: 'demo',
        status: 'succeeded',
      },
    ]);

    if (payErr) {
      console.error('mock payment insert failed', payErr);
      return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
    }

    const { error: unlockErr } = await supabase.from('reports').update({ unlocked: true }).eq('id', reportId);
    if (unlockErr) {
      console.error('mock payment unlock failed', unlockErr);
      return NextResponse.json({ error: 'Failed to unlock report' }, { status: 500 });
    }

    return NextResponse.json({ success: true, reportId });
  } catch (err) {
    console.error('mock checkout error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
