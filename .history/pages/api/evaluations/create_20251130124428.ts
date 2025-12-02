// pages/api/evaluations/create.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { task_id, user_id, score, strengths, improvements, report } = req.body;

  try {
    const { data, error } = await sbAdmin.from('evaluations').insert([
      {
        task_id,
        user_id,
        score,
        strengths,
        improvements,
        report,
        full_report_unlocked: false
      },
    ]);
    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message ?? err });
  }
}
