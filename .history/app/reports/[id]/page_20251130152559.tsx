import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabaseClient';

const parseLines = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value as string[];
  }
  if (typeof value === 'string') {
    return value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

export default async function ReportPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: evaluation } = await supabase
    .from('evaluations')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!evaluation) {
    notFound();
  }

  const strengths = parseLines(evaluation.strengths);
  const improvements = parseLines(evaluation.improvements);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-zinc-500">Evaluation</p>
          <h1 className="text-3xl font-semibold text-zinc-900">
            Report #{evaluation.id}
          </h1>
          <p className="text-sm text-zinc-600">
            Score: {evaluation.score ?? '—'}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Back to dashboard
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
        {evaluation.full_report_unlocked ? (
          <p className="mt-4 whitespace-pre-wrap text-sm text-zinc-700">
            {evaluation.report ?? 'Full report will appear here once generated.'}
          </p>
        ) : (
          <div className="mt-4 space-y-4 text-sm text-zinc-600">
            <p>The full report is locked. Purchase access to view detailed feedback.</p>
            <form action="/api/payments/checkout" method="post" className="space-y-3">
              <input type="hidden" name="evaluationId" value={evaluation.id} />
              <button
                type="submit"
                className="rounded bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500"
              >
                Unlock full report
              </button>
            </form>
          </div>
        )}
      </section>
    </main>
  );
}
