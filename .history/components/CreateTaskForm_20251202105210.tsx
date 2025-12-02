// components/CreateTaskForm.tsx
import React, { useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function CreateTaskForm() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        setError('You must be signed in to create a task.');
        setLoading(false);
        return;
      }

      const payload = {
        user_id: user.id,
        title,
        description,
        code,
        language,
      };

      const { data, error: insertError } = await supabase.from('tasks').insert([payload]).select('*').single();

      if (insertError) {
        console.error('Supabase insert error', insertError);
        setError(insertError.message || 'Failed to create task');
        setLoading(false);
        return;
      }

      setSuccess('Task created — evaluation queued');
      setTitle('');
      setDescription('');
      setCode('');
      setLanguage('javascript');
      // Optionally: trigger a refetch in parent via callback or event
    } catch (err) {
      console.error('Create task failed', err);
      setError((err as Error)?.message ?? 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label htmlFor="title" className="sr-only">Title</label>
        <input
          id="title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title"
          className="input"
          required
        />
      </div>

      <div>
        <label htmlFor="language" className="sr-only">Language</label>
        <select id="language" value={language} onChange={e => setLanguage(e.target.value)} className="select">
          {['javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'rust'].map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="sr-only">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description"
          className="textarea"
          required
        />
      </div>

      <div>
        <label htmlFor="code" className="sr-only">Code</label>
        <textarea
          id="code"
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Code snippet"
          className="textarea font-mono"
        />
      </div>

      {error && <div className="text-sm text-red-400">{error}</div>}
      {success && <div className="text-sm text-emerald-300">{success}</div>}

      <div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating…' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}
