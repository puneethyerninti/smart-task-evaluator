'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewTaskPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, code }),
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
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <div>
        <p className="text-sm uppercase tracking-wide text-zinc-500">Task</p>
        <h1 className="text-3xl font-semibold text-zinc-900">New coding task</h1>
        <p className="text-sm text-zinc-600">Describe your task and paste the solution to evaluate.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <label className="flex flex-col text-sm font-medium text-zinc-700">
          Title
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 rounded border border-zinc-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col text-sm font-medium text-zinc-700">
          Description
          <textarea
            required
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-2 rounded border border-zinc-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col text-sm font-medium text-zinc-700">
          Code snippet
          <textarea
            required
            rows={8}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="mt-2 rounded border border-zinc-300 font-mono text-sm px-3 py-2"
          />
        </label>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Submitting…' : 'Submit task'}
        </button>
      </form>
    </main>
  );
}
