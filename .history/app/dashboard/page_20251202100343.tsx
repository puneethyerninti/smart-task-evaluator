import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";


export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  // Types
  type TaskSummary = {
    id: string;
    title: string;
    status: string | null;
    created_at: string | null;
  };

  type ReportSummary = {
    id: string;
    task_id: string | null;
    score: number | null;
    unlocked: boolean;
    created_at: string | null;
  };

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch tasks
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch reports (formerly evaluations)
  const { data: evaluations } = await supabase
    .from("reports")
    .select("id, task_id, score, unlocked, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-12">
      {/* Header */}
      <header className="flex flex-col gap-3 border-b border-zinc-200 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-zinc-500">
            Welcome back
          </p>
          <h1 className="text-3xl font-semibold text-zinc-900">Dashboard</h1>
        </div>
        <div className="flex gap-3">
          <Link
            href="/tasks/new"
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Create task
          </Link>
        </div>
      </header>

      {/* Tasks Section */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">Your tasks</h2>
          <span className="text-sm text-zinc-500">
            {tasks?.length ?? 0} total
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {(tasks ?? []).map((task: TaskSummary) => (

      const totalTasks = tasks?.length ?? 0;
      const pendingTasks = (tasks ?? []).filter(
        (task) => (task.status ?? "pending") !== "done"
      ).length;
      const unlockedReports = (evaluations ?? []).filter(
        (report) => report.unlocked
      ).length;

      const dateFormatter = new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      });
            <article
              key={task.id}
        <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-12">
          {/* Header */}
          <header className="rounded-2xl bg-white/70 p-6 shadow-sm ring-1 ring-slate-100">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                  Welcome back
                </p>
                <h1 className="text-3xl font-semibold text-slate-900">
                  Smart Task Evaluator
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Track submissions, review AI feedback, and unlock full reports in one place.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/reports"
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                >
                  Browse reports
                </Link>
                <Link
                  href="/tasks/new"
                  className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500"
                >
                  + New Task
                </Link>
              </div>
            </div>
          </header>

          {/* KPIs */}
          <section className="grid gap-4 md:grid-cols-3">
            {[{
              label: "Total tasks",
              value: totalTasks,
              sub: "All submissions so far",
            }, {
              label: "Pending reviews",
              value: pendingTasks,
              sub: "Awaiting AI feedback",
            }, {
              label: "Unlocked reports",
              value: unlockedReports,
              sub: "Ready to read in full",
            }].map((card) => (
              <div key={card.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{card.sub}</p>
              </div>
            ))}
          </section>

          {/* Tasks Section */}
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Your tasks</h2>
                <p className="text-sm text-slate-500">Latest submissions appear first</p>
              </div>
              <Link href="/tasks/new" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
                Submit another
              </Link>
            </div>

            {totalTasks === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                <p className="text-sm text-slate-600">
                  No tasks yet. Ship your first evaluation to see insights roll in.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {(tasks ?? []).slice(0, 6).map((task: TaskSummary) => {
                  const status = (task.status ?? "pending").toLowerCase();
                  const isDone = status === "done";
                  const badgeClasses = isDone
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700";

                  return (
                    <article key={task.id} className="rounded-xl border border-slate-100 p-4 shadow-sm">
                      <h3 className="text-base font-semibold text-slate-900">{task.title}</h3>
                      <p className="text-xs text-slate-500">
                        {task.created_at ? dateFormatter.format(new Date(task.created_at)) : "—"}
                      </p>
                      <span className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeClasses}`}>
                        {isDone ? "Evaluation complete" : "Awaiting evaluation"}
                      </span>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Evaluations Section */}
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Recent evaluations</h2>
                <p className="text-sm text-slate-500">Pay to unlock full insights and download assets.</p>
              </div>
              <span className="text-sm font-medium text-slate-400">
                {evaluations?.length ?? 0} total
              </span>
            </div>

            {(evaluations ?? []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
                Evaluations will appear here once AI finishes processing your tasks.
              </div>
            ) : (
              <div className="space-y-3">
                {(evaluations ?? []).slice(0, 6).map((evaluation: ReportSummary) => (
                  <Link
                    key={evaluation.id}
                    href={`/reports/${evaluation.id}`}
                    className="flex items-center justify-between rounded-xl border border-slate-100 px-5 py-4 text-sm shadow-sm transition hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Report #{evaluation.id.slice(0, 8)}</p>
                      <p className="text-xs text-slate-500">
                        Score: {evaluation.score ?? "—"} · {evaluation.unlocked ? "Unlocked" : "Locked"}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {evaluation.created_at ? dateFormatter.format(new Date(evaluation.created_at)) : "—"}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </main>
