'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const NavBar = dynamic(() => import('@/components/NavBar'), { ssr: false });
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <main className="relative min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.35),_transparent_55%)]" />
      <NavBar />
      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <section className="hidden flex-col justify-between border-r border-white/10 p-10 lg:flex">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200">
              Smart Task Evaluator
            </p>
            <h1 className="mt-6 text-4xl font-semibold leading-tight">
              Human-friendly dashboards for every code submission.
            </h1>
            <p className="mt-4 text-slate-300">
              Single sign-on backed by Supabase, with Stripe-powered upgrades and AI evaluations you can trust.
            </p>
          </div>
          <div className="space-y-4">
            {["Role-based access", "Audit-ready logs", "SOC2-friendly stack"].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-slate-200">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-indigo-200">
                  *
                </span>
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md space-y-6 card p-8"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Sign in to continue</h2>
              <p className="text-sm text-slate-300">Secure access with Supabase auth and MFA-ready policies.</p>
            </div>

            <label className="flex flex-col text-sm font-medium text-slate-200">
              Email address
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input mt-2"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

            <label className="flex flex-col text-sm font-medium text-slate-200">
              Password
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input mt-2"
                placeholder="********"
                autoComplete="current-password"
              />
            </label>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-white/30 bg-transparent" />
                Remember device
              </label>
              <Link href="/forgot-password" className="font-semibold text-indigo-200 hover:text-indigo-100">
                Forgot password?
              </Link>
            </div>

            {error && <div className="rounded p-3 bg-red-600/10 text-red-200">{error}</div>}

            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? 'Checking credentials…' : 'Access dashboard'}
            </button>

            <p className="text-center text-sm text-slate-300">
              New reviewer?{' '}
              <Link href="/signup" className="font-semibold text-indigo-200 hover:text-indigo-100">
                Create an account
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
