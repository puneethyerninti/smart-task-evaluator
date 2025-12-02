import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const priceCents = Number(process.env.NEXT_PUBLIC_REPORT_PRICE_CENTS ?? '1500');
const priceDisplay = priceCents > 0 ? `$${(priceCents / 100).toFixed(2)}` : '—';

export default async function BillingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: reports } = await supabase
    .from('reports')
    .select('id, unlocked, short_feedback, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const lockedReports = (reports ?? []).filter((report) => !report.unlocked);

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.25),_transparent_60%)] animate-pulse opacity-50" />
      <div className="absolute top-0 right-0 h-80 w-80 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 left-1/4 h-96 w-96 bg-cyan-500/5 rounded-full blur-3xl" />
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-14">
        <header className="rounded-3xl border border-white/10 bg-white/10 p-8 text-white backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-200">Payments</p>
          <h1 className="mt-3 text-3xl font-semibold">Unlock full AI reports</h1>
          <p className="mt-2 text-sm text-slate-200 max-w-2xl">
            Purchase an unlock to reveal the full strengths, improvements, and remediation plan for a submitted task.
            Stripe Checkout handles payment; successful transactions instantly flip the report to unlocked state.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/95 p-8 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Pricing</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Single report unlock</h2>
            <p className="mt-2 text-sm text-slate-600">Includes the full AI narrative, rationale, and prioritized fixes.</p>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-5xl font-semibold text-slate-900">{priceDisplay}</span>
              <span className="text-sm text-slate-500">one-time · per report</span>
            </div>

            <ul className="mt-6 space-y-3 text-sm text-slate-600">
              <li>✓ Unlimited task submissions</li>
              <li>✓ Pay only for the reports you need</li>
              <li>✓ Instant unlock after payment confirmation</li>
            </ul>

            <Link
              href="/dashboard"
              className="mt-8 inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to dashboard
            </Link>
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/80 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Locked reports</h3>
            <p className="text-sm text-slate-600">Pick a report below to start checkout.</p>

            {lockedReports.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white/70 p-5 text-sm text-slate-500">
                All of your reports are unlocked. Submit a new task from the dashboard to generate more evaluations.
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {lockedReports.map((report) => (
                  <form
                    key={report.id}
                    action="/api/payments/checkout"
                    method="post"
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold text-slate-900">Report {report.id.slice(0, 8)}</p>
                        <p className="text-xs text-slate-500">
                          {report.short_feedback ?? 'Awaiting detailed feedback'}
                        </p>
                      </div>
                      <button
                        type="submit"
                        className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-indigo-500"
                      >
                        Unlock
                      </button>
                    </div>
                    <input type="hidden" name="evaluationId" value={report.id} />
                  </form>
                ))}
              </div>
            )}

            <details className="mt-6 rounded-2xl border border-slate-200 bg-white/60 p-4 text-sm text-slate-600">
              <summary className="cursor-pointer font-semibold text-slate-800">How payments work</summary>
              <p className="mt-2 text-xs text-slate-500">
                You will be redirected to Stripe Checkout. Upon completion we store a payment row and mark the
                report as unlocked via the webhook at <code>/api/stripe/webhook</code>.
              </p>
            </details>
          </aside>
        </section>
      </div>
    </main>
  );
}
