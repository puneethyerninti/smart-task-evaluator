import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const parseList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ checkout?: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: report, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!report || error) {
    notFound();
  }

  const strengths = parseList(report.strengths);
  const improvements = parseList(report.improvements);

  const resolvedSearchParams = await searchParams;
  const checkoutState = resolvedSearchParams?.checkout;
  const successMessage = checkoutState === 'success'
    ? 'Payment received. Your report will unlock once the webhook confirms the charge (usually a few seconds).'
    : null;
  const canceledMessage = checkoutState === 'cancelled'
    ? 'Checkout was canceled. You can try again anytime.'
    : null;

  const scoreNum = parseInt(String(report.score), 10);
  const scoreColor = scoreNum >= 80 ? 'emerald' : scoreNum >= 60 ? 'amber' : 'rose';
  const scoreGradient = scoreNum >= 80 ? 'from-emerald-500 to-emerald-600' : scoreNum >= 60 ? 'from-amber-500 to-amber-600' : 'from-rose-500 to-rose-600';

  return (
    <main className="relative min-h-screen bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.2),_transparent_70%)] pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/10 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
              AI Evaluation Report
            </div>
            <h1 className="text-5xl font-bold leading-tight text-white">
              Evaluation Results
            </h1>
            <p className="text-slate-400 text-sm">ID: <code className="text-indigo-300 font-mono bg-white/5 px-2 py-1 rounded">{report.id.slice(0, 12)}...</code></p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 hover:bg-white/10 px-6 py-3 font-semibold text-white/90 backdrop-blur transition hover:border-white/40"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className={`rounded-2xl border border-${scoreColor}-500/30 bg-${scoreColor}-500/5 p-6 backdrop-blur`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Overall Score</p>
            <div className={`mt-3 inline-block bg-gradient-to-r ${scoreGradient} bg-clip-text text-4xl font-bold text-transparent`}>
              {report.score ?? "—"}
            </div>
            <p className="mt-2 text-xs text-slate-400">{scoreNum >= 80 ? '🎉 Excellent' : scoreNum >= 60 ? '✨ Good' : '📈 Needs Work'}</p>
          </div>
          {report.short_feedback && (
            <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Summary</p>
              <p className="text-base text-slate-100 leading-relaxed">{report.short_feedback}</p>
            </div>
          )}
        </div>

        <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] p-8 backdrop-blur-xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/30 to-indigo-600/20">
              <svg className="h-5 w-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Key Insights</h2>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="group rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-6 backdrop-blur transition hover:border-emerald-500/40 hover:bg-emerald-500/15">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                  <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm font-bold uppercase tracking-wide text-emerald-400">Strengths</p>
              </div>
              <ul className="space-y-3 text-sm text-slate-200">
                {strengths.map((item, idx) => (
                  <li key={idx} className="flex gap-3 items-start">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
                {strengths.length === 0 && <li className="text-slate-500 italic">No strengths recorded yet.</li>}
              </ul>
            </div>
            <div className="group rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-6 backdrop-blur transition hover:border-amber-500/40 hover:bg-amber-500/15">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20">
                  <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Improvements</p>
              </div>
              <ul className="space-y-3 text-sm text-slate-200">
                {improvements.map((item, idx) => (
                  <li key={idx} className="flex gap-3 items-start">
                    <span className="text-amber-400 font-bold mt-0.5">→</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
                {improvements.length === 0 && <li className="text-slate-500 italic">No improvements noted.</li>}
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] p-8 backdrop-blur-xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/30 to-indigo-600/20">
              <svg className="h-5 w-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Detailed Feedback</h2>
          </div>
          {successMessage && (
            <div className="mb-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200 animate-in fade-in slide-in-from-top">
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold">Payment Successful!</p>
                  <p className="mt-1 text-sm text-emerald-100">{successMessage}</p>
                </div>
              </div>
            </div>
          )}
          {canceledMessage && (
            <div className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-200">
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold">Checkout Cancelled</p>
                  <p className="mt-1 text-sm text-amber-100">{canceledMessage}</p>
                </div>
              </div>
            </div>
          )}
          {report.unlocked ? (
            <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-slate-900/50 to-slate-900/30 p-8 backdrop-blur">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300">
                <span className="h-2 w-2 rounded-full bg-indigo-400" />
                Unlocked
              </div>
              <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-200 text-opacity-90">
                {report.full_report ?? "Full report will appear here once generated."}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 p-8 text-center backdrop-blur">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-indigo-600/10">
                <svg className="h-10 w-10 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="mb-2 text-2xl font-bold text-white">Full Report Locked</h3>
              <p className="mb-8 text-slate-300">Unlock your complete AI-powered code analysis with detailed recommendations and actionable insights.</p>
              
              <div className="flex flex-col gap-3 justify-center sm:flex-row">
                <form action="/api/payments/checkout" method="post">
                  <input type="hidden" name="evaluationId" value={report.id} />
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-8 py-4 font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/50 sm:w-auto whitespace-nowrap"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    Unlock with Stripe
                  </button>
                </form>

                <form action="/api/payments/mock" method="post">
                  <input type="hidden" name="evaluationId" value={report.id} />
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-amber-400/50 bg-gradient-to-r from-amber-500/10 to-amber-600/5 px-8 py-4 font-bold text-amber-300 transition hover:border-amber-400/80 hover:bg-amber-500/15 sm:w-auto whitespace-nowrap"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Demo Unlock (Free)
                  </button>
                </form>
              </div>
              
              <p className="mt-6 text-xs text-slate-500">
                ✨ <strong>Region restrictions?</strong> Use Demo Unlock to test the full report experience instantly.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
