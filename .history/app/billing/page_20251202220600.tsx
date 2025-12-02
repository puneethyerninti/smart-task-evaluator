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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.3),_transparent_70%)]" />
      <div className="absolute top-0 right-0 h-96 w-96 bg-indigo-500/15 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/3 h-80 w-80 bg-cyan-500/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300 backdrop-blur w-fit">
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
            Premium Access
          </div>
          <h1 className="text-5xl font-bold leading-tight text-white">
            Unlock Full AI Reports
          </h1>
          <p className="text-lg text-slate-300 max-w-3xl">
            Purchase report unlocks to reveal complete AI analysis including detailed strengths, improvement areas, and actionable remediation plans for your submitted code.
          </p>
        </header>

        <section className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-10 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/30 to-emerald-600/20">
                <svg className="h-5 w-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white">Pricing</h2>
            </div>
            <p className="text-slate-300 text-base mb-8">One-time payment per report unlock. No subscriptions, no hidden fees.</p>

            <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 p-8 mb-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">Total Cost</p>
              <div className="flex items-baseline gap-3">
                <span className="text-6xl font-bold bg-gradient-to-r from-indigo-400 to-indigo-300 bg-clip-text text-transparent">{priceDisplay}</span>
                <span className="text-slate-400">per report</span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">What's included:</h3>
              <ul className="space-y-3">
                {[
                  '✓ Full AI-generated analysis and feedback',
                  '✓ Detailed strengths and weaknesses breakdown',
                  '✓ Prioritized improvement recommendations',
                  '✓ Actionable remediation roadmap',
                  '✓ Instant unlock upon payment confirmation',
                  '✓ Pay only for reports you want to review',
                ].map((item) => (
                  <li key={item} className="flex gap-3 items-center text-slate-200">
                    <span className="text-emerald-400">{item.split(' ')[0]}</span>
                    <span>{item.slice(2)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/dashboard"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 hover:bg-white/10 px-6 py-3 font-semibold text-white/90 backdrop-blur transition"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>

          <aside className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8 backdrop-blur-xl h-fit sticky top-6">
            <h3 className="text-xl font-bold text-white mb-2">Locked Reports</h3>
            <p className="text-sm text-slate-400 mb-6">Select a report to unlock it.</p>

            {lockedReports.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-center">
                <svg className="mx-auto h-8 w-8 text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-slate-400">All reports unlocked!</p>
                <p className="text-xs text-slate-500 mt-2">Submit new tasks to generate more evaluations.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {lockedReports.map((report) => (
                  <form
                    key={report.id}
                    action="/api/payments/checkout"
                    method="post"
                    className="group rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-500/40 p-4 transition"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm">Report</p>
                        <p className="text-xs text-slate-400 font-mono">{report.id.slice(0, 12)}...</p>
                      </div>
                    </div>
                    {report.short_feedback && (
                      <p className="text-xs text-slate-300 mb-3 line-clamp-2 text-opacity-80">
                        {report.short_feedback}
                      </p>
                    )}
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white hover:from-indigo-600 hover:to-indigo-700 transition"
                    >
                      Unlock Now
                    </button>
                    <input type="hidden" name="evaluationId" value={report.id} />
                  </form>
                ))}
              </div>
            )}

            <details className="mt-6 group">
              <summary className="cursor-pointer flex items-center gap-2 font-semibold text-white hover:text-indigo-300 transition">
                <svg className="h-4 w-4 transition group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                Payment Flow
              </summary>
              <div className="mt-4 rounded-lg bg-white/5 border border-white/10 p-4 text-xs text-slate-300 space-y-2">
                <p><strong className="text-slate-200">1.</strong> Choose a locked report above</p>
                <p><strong className="text-slate-200">2.</strong> Click "Unlock Now" to go to Stripe Checkout</p>
                <p><strong className="text-slate-200">3.</strong> Complete payment securely</p>
                <p><strong className="text-slate-200">4.</strong> Report unlocks instantly</p>
              </div>
            </details>
          </aside>
        </section>
      </div>
    </main>
  );
}
