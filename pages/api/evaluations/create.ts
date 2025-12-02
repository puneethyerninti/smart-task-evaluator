// pages/api/evaluations/create.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type EvaluationPayload = {
  task_id: string;
  user_id: string;
  score?: number | null;
  strengths?: string[] | null;
  improvements?: string[] | null;
  full_report?: string | null;
  short_feedback?: string | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const payload = (typeof req.body === 'object' && req.body !== null ? req.body : {}) as EvaluationPayload;
  const { task_id, user_id, score, strengths, improvements, full_report, short_feedback } = payload;

  try {
    const { data, error } = await sbAdmin.from('reports').insert([
      {
        task_id,
        user_id,
        score,
        strengths,
        improvements,
        short_feedback,
        full_report,
        unlocked: false
      },
    ]);
    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(err);
    return res.status(500).json({ error: message });
  }
}
