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
  params: { id: string };
  searchParams?: { checkout?: string };
}) {
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
    .eq("id", params.id)
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

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Highlights</h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold text-emerald-600">Strengths</p>
            <ul className="space-y-2 text-sm text-zinc-600">
              {strengths.map((item) => (
                <li key={item}>• {item}</li>
              ))}
              {strengths.length === 0 && <li>No strengths provided yet.</li>}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-amber-600">Improvements</p>
            <ul className="space-y-2 text-sm text-zinc-600">
              {improvements.map((item) => (
                <li key={item}>• {item}</li>
              ))}
              {improvements.length === 0 && <li>No improvements logged.</li>}
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Full report</h2>
        {successMessage && (
          <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}
        {canceledMessage && (
          <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm text-amber-700">
            {canceledMessage}
          </div>
        )}
        {report.unlocked ? (
          <p className="mt-4 whitespace-pre-wrap text-sm text-zinc-700">
            {report.full_report ?? "Full report will appear here once generated."}
          </p>
        ) : (
          <div className="mt-4 space-y-4 text-sm text-zinc-600">
            <p>The full report is locked. Purchase access to view detailed feedback.</p>
            <div className="space-y-3">
              <form action="/api/payments/checkout" method="post" className="inline">
                <input type="hidden" name="evaluationId" value={report.id} />
                <button
                  type="submit"
                  className="rounded bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500"
                >
                  Unlock full report (Stripe)
                </button>
              </form>

              <form action="/api/payments/mock" method="post" className="inline">
                <input type="hidden" name="evaluationId" value={report.id} />
                <button
                  type="submit"
                  className="rounded border border-amber-400 px-4 py-2 font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100"
                >
                  Mock pay (demo)
                </button>
              </form>
              <p className="text-xs text-slate-400">If Stripe is unavailable in your region, use <strong>Mock pay</strong> to unlock the report for demo purposes.</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
