"use client";

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/Toast';

export default function NewTaskPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

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

    setSuccess('Task submitted — evaluation queued.');
    setTitle('');
    setDescription('');
    setCode('');
    setLanguage('javascript');
    setLoading(false);

    setTimeout(() => {
      router.push('/dashboard');
      router.refresh();
    }, 900);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <NavBar />
      <div className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-100">
        <p className="text-sm uppercase tracking-wide text-slate-500">Submit task</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Request a fresh AI review</h1>
        <p className="mt-1 text-sm text-slate-600">
          Provide as much context as possible. The evaluator scores your solution, highlights strengths, and suggests improvements.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 card">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="flex flex-col text-sm font-medium text-slate-700">
            Title
            <input required value={title} onChange={(e) => setTitle(e.target.value)} className="input mt-2" />
            <span className="mt-1 text-xs font-normal text-slate-500">Give the task a memorable label.</span>
          </label>

          <label className="flex flex-col text-sm font-medium text-slate-700">
            Language
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="select mt-2">
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
          <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="textarea mt-2" />
          <span className="mt-1 text-xs font-normal text-slate-500">What was the prompt, requirements, or edge cases?</span>
        </label>

        <label className="flex flex-col text-sm font-medium text-slate-700">
          Code snippet
          <textarea required rows={10} value={code} onChange={(e) => setCode(e.target.value)} className="textarea mt-2" />
        </label>

        {error && <div className="rounded p-3 bg-red-600/10 text-red-200">{error}</div>}
        {success && <Toast message={success} open={!!success} onClose={() => setSuccess(null)} />}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? 'Submitting…' : 'Send for evaluation'}
        </button>
      </form>
    </main>
  );
}
