import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/api';

// TODO: set STRIPE_SECRET_KEY, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_REPORT_PRICE_CENTS
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret
  ? new Stripe(stripeSecret, { apiVersion: '2025-11-17.clover' })
  : null;

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
  }

  const supabase = createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contentType = request.headers.get('content-type') ?? '';
  let reportId: string | null = null;

  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => null);
    reportId = body?.evaluationId ?? body?.reportId ?? null;
  } else {
    const formData = await request.formData();
    reportId =
      formData.get('evaluationId')?.toString() ??
      formData.get('reportId')?.toString() ??
      null;
  }

  if (!reportId) {
    return NextResponse.json({ error: 'Missing evaluationId' }, { status: 400 });
  }

  const { data: report } = await supabase
    .from('reports')
    .select('id,user_id')
    .eq('id', reportId)
    .eq('user_id', user.id)
    .single();

  if (!report) {
    return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
  }

  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const price = Number(process.env.NEXT_PUBLIC_REPORT_PRICE_CENTS ?? 1500);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    client_reference_id: user.id,
    metadata: { report_id: report.id, user_id: user.id },
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: 'Full AI evaluation report' },
          unit_amount: price,
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/reports/${report.id}?success=1`,
    cancel_url: `${origin}/reports/${report.id}?canceled=1`,
  });

  if (contentType.includes('application/json')) {
    return NextResponse.json({ url: session.url });
  }

  return NextResponse.redirect(session.url ?? origin, { status: 303 });
}
