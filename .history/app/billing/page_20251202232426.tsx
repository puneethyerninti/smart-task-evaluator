import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseKeys } from '@/lib/env';

const priceCents = Number(process.env.NEXT_PUBLIC_REPORT_PRICE_CENTS ?? '1500');
const priceDisplay = priceCents > 0 ? `$${(priceCents / 100).toFixed(2)}` : '—';

export default async function BillingPage() {
  const { url: supabaseUrl, anon: supabaseAnon } = getSupabaseKeys();

  // If env vars are missing, render a configuration helper instead of crashing build.
  if (!supabaseUrl || !supabaseAnon) {
    return (
      <main className="min-h-screen flex items-center justify-center p-10 text-center bg-slate-950 text-white">
        <div className="max-w-lg space-y-6">
          <h1 className="text-4xl font-bold">Configure Environment</h1>
          <p className="text-slate-300 text-sm">
            Supabase environment variables are not set. Add <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in Vercel Project Settings → Environment Variables, then redeploy.
          </p>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-left text-xs space-y-2">
            <p className="font-semibold">Required variables:</p>
            <ul className="space-y-1 list-disc pl-4">
              <li>NEXT_PUBLIC_SUPABASE_URL = https://YOUR-PROJECT.ref.supabase.co</li>
              <li>NEXT_PUBLIC_SUPABASE_ANON_KEY = (Anon public API key)</li>
            </ul>
            <p>Optional (server features): SUPABASE_SERVICE_ROLE_KEY</p>
          </div>
        </div>
      </main>
    );
  }

  // Safe client usage only when env vars are present.
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: reports } = await supabase
    .from('reports')
    .select('id, unlocked, short_feedback, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  type ReportRow = { id: string; unlocked: boolean; short_feedback: string | null; created_at: string };
  const lockedReports: ReportRow[] = ((reports ?? []) as ReportRow[]).filter((r: ReportRow) => !r.unlocked);

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
            <p className="text-sm text-slate-400 mb-6">Select a report and choose your payment method below.</p>

            {lockedReports.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-center">
                <svg className="mx-auto h-8 w-8 text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-slate-400">All reports unlocked!</p>
                <p className="text-xs text-slate-500 mt-2">Submit new tasks to generate more evaluations.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                  {lockedReports.map((report) => (
                    <div
                      key={report.id}
                      className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-500/40 p-4 transition group cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-white text-sm">Report ID</p>
                          <p className="text-xs text-slate-400 font-mono">{report.id.slice(0, 8)}...{report.id.slice(-4)}</p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-1 text-xs font-semibold text-amber-300">
                          <span className="h-2 w-2 rounded-full bg-amber-400" />
                          Locked
                        </span>
                      </div>
                      {report.short_feedback ? (
                        <p className="text-xs text-slate-300 mb-3 line-clamp-2">
                          {report.short_feedback}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 italic mb-3">
                          Evaluation complete • Awaiting unlock
                        </p>
                      )}
                      <div className="flex gap-2">
                        <form
                          action="/api/payments/checkout"
                          method="post"
                          className="flex-1"
                        >
                          <input type="hidden" name="evaluationId" value={report.id} />
                          <button
                            type="submit"
                            className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white hover:from-blue-600 hover:to-blue-700 transition"
                            title="Stripe Checkout (Not available in India)"
                          >
                            Stripe
                          </button>
                        </form>
                        <form
                          action="/api/payments/mock"
                          method="post"
                          className="flex-1"
                        >
                          <input type="hidden" name="evaluationId" value={report.id} />
                          <button
                            type="submit"
                            className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white hover:from-emerald-600 hover:to-emerald-700 transition"
                            title="Instant unlock - No payment needed for testing"
                          >
                            Demo
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-4">
                  <div className="flex gap-3">
                    <svg className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-amber-300">Stripe not available in your region?</p>
                      <p className="text-xs text-amber-200 mt-1">Use the <strong>Demo</strong> button to instantly unlock reports for testing and evaluation purposes.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <details className="mt-6 group">
              <summary className="cursor-pointer flex items-center gap-2 font-semibold text-white hover:text-indigo-300 transition">
                <svg className="h-4 w-4 transition group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                Payment Options
              </summary>
              <div className="mt-4 rounded-lg bg-white/5 border border-white/10 p-4 text-xs text-slate-300 space-y-3">
                <div>
                  <p className="font-semibold text-slate-200">💳 Stripe Checkout</p>
                  <p className="text-slate-400 mt-1">Secure card payments. Available globally except select regions (including India).</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-200">✨ Demo Unlock</p>
                  <p className="text-slate-400 mt-1">Instant unlock with no payment required. Perfect for testing, assignments, and regions without Stripe support.</p>
                </div>
              </div>
            </details>
          </aside>
        </section>
      </div>
    </main>
  );
}
