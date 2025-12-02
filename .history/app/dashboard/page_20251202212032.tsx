import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// NavBar rendered in layout

type ReportSummary = {
  id: string;
  task_id: string | null;
  score: number | null;
  unlocked: boolean;
  created_at: string | null;
};

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: evaluations } = await supabase
    .from("reports")
    .select("id, task_id, score, unlocked, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const totalTasks = tasks?.length ?? 0;
  const pendingTasks = (tasks ?? []).filter((task) => (task.status ?? "pending") !== "done").length;
  const unlockedReports = (evaluations ?? []).filter((report) => report.unlocked).length;
  const latestScore = (evaluations ?? [])[0]?.score ?? "—";
  const friendlyName =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email?.split("@")[0] ?? "there";

  const dateFormatter = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.22),_transparent_60%)] animate-pulse opacity-50" />
      <div className="absolute top-1/3 -right-1/4 h-96 w-96 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-1/4 -left-1/4 h-96 w-96 bg-purple-500/5 rounded-full blur-3xl" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-14">
        <header className="rounded-3xl border border-white/10 bg-white/10 p-8 text-white backdrop-blur">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-200">Dashboard</p>
              <h1 className="text-3xl font-semibold leading-tight">
                Welcome back, {friendlyName}. Your evaluations are up to date.
              </h1>
              <p className="text-sm text-slate-200">
                Submit new code, unlock AI reports, and monitor payout events all from one pane of glass.
              </p>
            </div>
            <div className="flex flex-col gap-3 text-sm text-slate-200 sm:flex-row">
              <Link
                href="/tasks/new"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 font-semibold text-slate-900 shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5"
              >
                New evaluation
              </Link>
              <Link
                href="#reports"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-5 py-3 font-semibold text-white/90"
              >
                View reports
              </Link>
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total submissions", value: totalTasks, hint: "All-time" },
              { label: "Pending reviews", value: pendingTasks, hint: "Queued" },
              { label: "Unlocked reports", value: unlockedReports, hint: "Available" },
              { label: "Latest score", value: latestScore, hint: "Most recent" },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-wide text-indigo-200">{card.label}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
                <p className="text-xs text-slate-400">{card.hint}</p>
              </div>
            ))}
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-white/10 bg-white p-6 shadow-2xl">
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Recent submissions</h2>
                <p className="text-sm text-slate-500">Monitor status across the latest six tasks.</p>
              </div>
              <Link href="/tasks/new" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
                Submit task
              </Link>
            </div>

            {totalTasks === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
                You have not sent any tasks yet. Upload your first snippet to unlock AI feedback.
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {(tasks ?? []).slice(0, 6).map((task) => {
                  const status = (task.status ?? "pending").toLowerCase();
                  const isDone = status === "done";
                  const badge = isDone ? { label: "Completed", style: "bg-emerald-50 text-emerald-700" } : { label: "In review", style: "bg-amber-50 text-amber-700" };

                  return (
                    <article
                      key={task.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-sm shadow-sm"
                    >
                      <div>
                        <p className="text-base font-semibold text-slate-900">{task.title}</p>
                        <p className="text-xs text-slate-500">
                          {task.created_at ? dateFormatter.format(new Date(task.created_at)) : "Pending timestamp"}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.style}`}>{badge.label}</span>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 text-white backdrop-blur">
              <h3 className="text-lg font-semibold">Need faster reviews?</h3>
              <p className="mt-1 text-sm text-slate-200">
                Upgrade to real-time scoring and webhook callbacks when evaluations finish.
              </p>
              <Link
                href="/billing"
                className="mt-4 inline-flex items-center rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900"
              >
                View plans
              </Link>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-slate-900">Next steps</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li className="rounded-2xl border border-slate-100 px-4 py-3">Connect Stripe to capture unlock payments.</li>
                <li className="rounded-2xl border border-slate-100 px-4 py-3">Invite collaborators with reviewer-only access.</li>
                <li className="rounded-2xl border border-slate-100 px-4 py-3">Configure Slack alerts for completed reports.</li>
              </ul>
            </div>
          </aside>
        </section>

        <section id="reports" className="rounded-3xl border border-white/10 bg-white p-6 shadow-2xl">
          <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Latest reports</h2>
              <p className="text-sm text-slate-500">Unlock to read full strengths, improvements, and payment receipts.</p>
            </div>
            <span className="text-sm font-semibold text-slate-400">{evaluations?.length ?? 0} total</span>
          </div>

          {(evaluations ?? []).length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
              Evaluations will appear once AI finishes processing your first submission.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {(evaluations ?? []).slice(0, 6).map((evaluation: ReportSummary) => (
                <Link
                  key={evaluation.id}
                  href={`/reports/${evaluation.id}`}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 px-5 py-4 text-sm shadow-sm transition hover:bg-slate-50"
                >
                  <div>
                    <p className="text-base font-semibold text-slate-900">Report {evaluation.id.slice(0, 8)}</p>
                    <p className="text-xs text-slate-500">
                      Score: {evaluation.score ?? "Pending"} · {evaluation.unlocked ? "Unlocked" : "Locked"}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {evaluation.created_at ? dateFormatter.format(new Date(evaluation.created_at)) : "Processing"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
