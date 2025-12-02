// pages/dashboard.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/components/useUser';

export default function Dashboard() {
  const user = useUser();
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) console.error(error);
      else setTasks(data ?? []);
    };
    load();
  }, [user]);

  return (
    <div>
      <h1>My Tasks</h1>
      {tasks.map(t => (
        <div key={t.id}>
          <h3>{t.title}</h3>
          <p>{t.description}</p>
        </div>
      ))}
    </div>
  );
}
