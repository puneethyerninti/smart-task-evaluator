// components/CreateTaskForm.tsx
import React, { useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function CreateTaskForm() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return alert('Login first');

    const { error } = await supabase.from('tasks').insert([
      {
        user_id: user.id,
        title,
        description,
        code: ''
      },
    ]);

    if (error) return console.error(error);
    setTitle('');
    setDescription('');
    // refetch tasks...
  };

  return (
    <form onSubmit={submit}>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />
      <button type="submit">Create Task</button>
    </form>
  );
}
