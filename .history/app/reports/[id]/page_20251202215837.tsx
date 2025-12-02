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

  const checkoutState = searchParams?.checkout;
  const successMessage = checkoutState === 'success'
    ? 'Payment received. Your report will unlock once the webhook confirms the charge (usually a few seconds).'
    : null;
  const canceledMessage = checkoutState === 'cancelled'
    ? 'Checkout was canceled. You can try again anytime.'
    : null;

  return (
    <main className="relative min-h-screen bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.15),_transparent_60%)]" />
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-14">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">AI Evaluation</p>
            <h1 className="text-4xl font-bold leading-tight text-white">
              Report #{report.id.slice(0, 8)}
            </h1>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-2 text-sm font-bold text-indigo-300">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Score: {report.score ?? "Pending"}
              </span>
            </div>
            {report.short_feedback && (
              <p className="text-base text-slate-300">{report.short_feedback}</p>
            )}
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-5 py-3 font-semibold text-white/90 backdrop-blur transition hover:bg-white/10"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Dashboard
          </Link>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <h2 className="text-2xl font-bold text-white">Highlights</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
              <div className="mb-4 flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-bold uppercase tracking-wide text-emerald-400">Strengths</p>
              </div>
              <ul className="space-y-3 text-sm text-slate-200">
                {strengths.map((item, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
                {strengths.length === 0 && <li className="text-slate-400">No strengths recorded yet.</li>}
              </ul>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
              <div className="mb-4 flex items-center gap-2">
                <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Improvements</p>
              </div>
              <ul className="space-y-3 text-sm text-slate-200">
                {improvements.map((item, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-amber-400">→</span>
                    <span>{item}</span>
                  </li>
                ))}
                {improvements.length === 0 && <li className="text-slate-400">No improvements noted.</li>}
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <h2 className="text-2xl font-bold text-white">Full Report</h2>
          {successMessage && (
            <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{successMessage}</span>
              </div>
            </div>
          )}
          {canceledMessage && (
            <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-300">
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{canceledMessage}</span>
              </div>
            </div>
          )}
          {report.unlocked ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/50 p-6">
              <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-200">
                {report.full_report ?? "Full report will appear here once generated."}
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/20">
                  <svg className="h-8 w-8 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-bold text-white">Full Report Locked</h3>
                <p className="mb-6 text-sm text-slate-300">Unlock complete AI insights, detailed code analysis, and actionable recommendations.</p>
                
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <form action="/api/payments/checkout" method="post">
                    <input type="hidden" name="evaluationId" value={report.id} />
                    <button
                      type="submit"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/40 sm:w-auto"
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
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-amber-400/50 bg-amber-500/10 px-6 py-3.5 font-bold text-amber-300 transition hover:bg-amber-500/20 sm:w-auto"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Demo Unlock (Free)
                    </button>
                  </form>
                </div>
                
                <p className="mt-4 text-xs text-slate-400">
                  💡 <strong>Stripe unavailable in your region?</strong> Use Demo Unlock for assignment/testing purposes.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
