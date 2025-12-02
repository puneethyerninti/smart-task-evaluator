import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabaseClient';

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id,title,status,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const { data: evaluations } = await supabase
    .from('evaluations')
    .select('id,task_id,score,full_report_unlocked,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-3 border-b border-zinc-200 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-zinc-500">Welcome back</p>
          <h1 className="text-3xl font-semibold text-zinc-900">Dashboard</h1>
        </div>
        <div className="flex gap-3">
          <Link
            href="/tasks/new"
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Create task
          </Link>
          <Link
            href="/reports/placeholder"
            className="rounded border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Latest report
          </Link>
        </div>
      </header>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">Your tasks</h2>
          <span className="text-sm text-zinc-500">{tasks?.length ?? 0} total</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {(tasks ?? []).map((task) => (
            <article
              key={task.id}
              className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-zinc-900">{task.title}</h3>
              <p className="text-sm text-zinc-500">
                {new Date(task.created_at ?? '').toLocaleString()}
              </p>
              <p className="mt-2 text-sm capitalize text-emerald-600">
                {task.status ?? 'pending'}
              </p>
            </article>
          ))}
          {(tasks ?? []).length === 0 && (
            <p className="text-sm text-zinc-500">No tasks yet. Create one to begin.</p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">Recent evaluations</h2>
          <span className="text-sm text-zinc-500">{evaluations?.length ?? 0} total</span>
        </div>
        <div className="space-y-3">
          {(evaluations ?? []).map((evaluation) => (
            <Link
              key={evaluation.id}
              href={`/reports/${evaluation.id}`}
              className="flex items-center justify-between rounded border border-zinc-200 bg-white px-4 py-3 text-left text-sm shadow-sm hover:bg-zinc-50"
            >
              <div>
                <p className="font-semibold text-zinc-900">Evaluation #{evaluation.id}</p>
                <p className="text-zinc-500">
                  Score: {evaluation.score ?? '—'} · {evaluation.full_report_unlocked ? 'Full access' : 'Locked'}
                </p>
              </div>
              <span className="text-xs uppercase tracking-wide text-zinc-400">
                {new Date(evaluation.created_at ?? '').toLocaleDateString()}
              </span>
            </Link>
          ))}
          {(evaluations ?? []).length === 0 && (
            <p className="text-sm text-zinc-500">Evaluations will appear here once tasks are processed.</p>
          )}
        </div>
      </section>
    </main>
  );
}
