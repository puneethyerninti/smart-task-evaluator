import Link from "next/link";

const highlights = [
  {
    title: "AI eval in seconds",
    content: "Scores, strengths, and risks generated on every submission.",
  },
  {
    title: "Human-ready reports",
    content: "Share premium PDFs or unlock deeper insights for your team.",
  },
  {
    title: "Secure Stripe checkout",
    content: "Paywalls are handled with verified webhooks and audit logs.",
  },
];

const featureList = [
  {
    label: "Multiple languages",
    detail: "JavaScript, Python, Go, Rust, and more with rubric awareness.",
  },
  {
    label: "Consistent scoring",
    detail: "Transparent scoring bands keep reviewers aligned across cohorts.",
  },
  {
    label: "Actionable roadmap",
    detail: "Every report ships with prioritized improvements you can assign.",
  },
];

export default function Home() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-indigo-500/40 via-slate-900 to-transparent blur-3xl" />

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-20 lg:flex-row lg:items-center">
        <div className="space-y-8 lg:w-1/2">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
            Live preview
          </span>
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Evaluate coding assignments with <span className="text-indigo-300">production-grade</span> automation.
            </h1>
            <p className="text-lg text-slate-200">
              Smart Task Evaluator pairs Supabase auth, Stripe payments, and AI feedback into a single workflow so you can review student or candidate work in minutes instead of days.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5"
            >
              Go to dashboard
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/90 hover:border-white/40"
            >
              Log in
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {highlights.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-sm font-semibold text-indigo-200">{item.title}</p>
                <p className="mt-2 text-sm text-slate-200">{item.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative w-full flex-1 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/80 to-indigo-900/40 p-8 shadow-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Evaluation Pipeline</span>
            <span>~3 mins avg</span>
          </div>
          <div className="mt-6 space-y-5 text-sm">
            {featureList.map((feature) => (
              <div key={feature.label} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">{feature.label}</p>
                <p className="mt-1 text-slate-300">{feature.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 rounded-2xl border border-indigo-500/40 bg-indigo-500/10 p-5 text-sm">
            <p className="text-xs uppercase tracking-wide text-indigo-200">Live signal</p>
            <p className="mt-2 text-base font-semibold text-white">97% of reviewers saved 4+ hours per cohort this week.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 w-full max-w-6xl px-6 pb-20">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center">
            <div className="space-y-4 lg:w-1/2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200">Why teams switch</p>
              <h2 className="text-3xl font-semibold text-white">One workspace for submissions, evaluations, and payouts.</h2>
              <p className="text-slate-200">
                API-first foundations mean you can connect Smart Task Evaluator to your LMS, hiring pipeline, or internal dashboards without rewrites.
              </p>
            </div>
            <dl className="grid flex-1 gap-6 sm:grid-cols-2">
              {["<2 min setup", "SOC2-ready infra", "Supabase auth", "Stripe verified"].map((stat) => (
                <div key={stat} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-center">
                  <dt className="text-sm font-semibold text-white">{stat}</dt>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </main>
  );
}
