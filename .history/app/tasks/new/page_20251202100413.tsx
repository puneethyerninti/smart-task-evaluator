'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewTaskPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, code, language }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? 'Failed to create task');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <div className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-100">
        <p className="text-sm uppercase tracking-wide text-slate-500">Submit task</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Request a fresh AI review</h1>
        <p className="mt-1 text-sm text-slate-600">
          Provide as much context as possible. The evaluator scores your solution, highlights strengths, and suggests improvements.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="flex flex-col text-sm font-medium text-slate-700">
            Title
            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 rounded-xl border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none"
            />
            <span className="mt-1 text-xs font-normal text-slate-500">Give the task a memorable label.</span>
          </label>

          <label className="flex flex-col text-sm font-medium text-slate-700">
            Language
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 focus:border-indigo-500 focus:outline-none"
            >
              {['javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'rust'].map((lang) => (
                <option key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>
            <span className="mt-1 text-xs font-normal text-slate-500">Used to tailor the AI rubric.</span>
          </label>
        </div>

        <label className="flex flex-col text-sm font-medium text-slate-700">
          Description
          <textarea
            required
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-2 rounded-xl border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none"
          />
          <span className="mt-1 text-xs font-normal text-slate-500">What was the prompt, requirements, or edge cases?</span>
        </label>

        <label className="flex flex-col text-sm font-medium text-slate-700">
          Code snippet
          <textarea
            required
            rows={10}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="mt-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-sm px-3 py-2 focus:border-indigo-500 focus:outline-none"
          />
        </label>

        {error && (
          <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Submitting…' : 'Send for evaluation'}
        </button>
      </form>
    </main>
  );
}
