import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/api';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const reportPrice = Number(process.env.NEXT_PUBLIC_REPORT_PRICE_CENTS ?? '0');
const currency = process.env.STRIPE_CURRENCY ?? 'usd';
const stripe = stripeSecret
  ? new Stripe(stripeSecret, { apiVersion: '2025-11-25.acacia' })
  : null;

const errorResponse = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

const extractReportId = async (request: Request) => {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const candidate = (body?.evaluationId ?? body?.reportId) as unknown;
    return typeof candidate === 'string' ? candidate : null;
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) return null;
  const value = formData.get('evaluationId') ?? formData.get('reportId');
  return typeof value === 'string' ? value : null;
};

export async function POST(request: Request) {
  try {
    if (!stripe) {
      return errorResponse('Stripe is not configured. Set STRIPE_SECRET_KEY.', 500);
    }

    if (!Number.isFinite(reportPrice) || reportPrice <= 0) {
      return errorResponse('Set NEXT_PUBLIC_REPORT_PRICE_CENTS to a positive integer.', 500);
    }

    const supabase = await createSupabaseRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const reportId = await extractReportId(request);
    if (!reportId) {
      return errorResponse('Missing reportId/evaluationId');
    }

    const { data: report, error } = await supabase
      .from('reports')
      .select('id, unlocked')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();

    if (error || !report) {
      return errorResponse('Report not found', 404);
    }

    if (report.unlocked) {
      return errorResponse('Report already unlocked', 400);
    }

    const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email ?? undefined,
      client_reference_id: user.id,
      metadata: {
        report_id: reportId,
        user_id: user.id,
      },
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: 'Smart Task Evaluator – Full Report Unlock',
              description: 'Unlock complete AI insights for one submission.',
            },
            unit_amount: Math.round(reportPrice),
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/reports/${reportId}?checkout=success`,
      cancel_url: `${origin}/reports/${reportId}?checkout=cancelled`,
    });

    if (!session.url) {
      return errorResponse('Unable to start checkout session', 500);
    }

    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      return NextResponse.json({ url: session.url });
    }

    return NextResponse.redirect(session.url, { status: 303 });
  } catch (err) {
    console.error('checkout error:', err);
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return errorResponse(message, 500);
  }
}
