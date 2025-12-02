import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// TODO: set STRIPE_SECRET_KEY, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_REPORT_PRICE_CENTS
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret
  ? new Stripe(stripeSecret, { apiVersion: '2025-11-17.clover' })
  : null;

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
  }

  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contentType = request.headers.get('content-type') ?? '';
  let evaluationId: string | null = null;

  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => null);
    evaluationId = body?.evaluationId ?? null;
  } else {
    const formData = await request.formData();
    evaluationId = formData.get('evaluationId')?.toString() ?? null;
  }

  if (!evaluationId) {
    return NextResponse.json({ error: 'Missing evaluationId' }, { status: 400 });
  }

  const { data: evaluation } = await supabase
    .from('evaluations')
    .select('id,user_id')
    .eq('id', evaluationId)
    .eq('user_id', user.id)
    .single();

  if (!evaluation) {
    return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
  }

  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const price = Number(process.env.NEXT_PUBLIC_REPORT_PRICE_CENTS ?? 1500);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    client_reference_id: user.id,
    metadata: { evaluation_id: evaluation.id, user_id: user.id },
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
    success_url: `${origin}/reports/${evaluation.id}?success=1`,
    cancel_url: `${origin}/reports/${evaluation.id}?canceled=1`,
  });

  if (contentType.includes('application/json')) {
    return NextResponse.json({ url: session.url });
  }

  return NextResponse.redirect(session.url ?? origin, { status: 303 });
}
