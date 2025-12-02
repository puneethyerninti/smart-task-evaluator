// lib/aiEvaluator.ts
// Wrapper to talk to an Edge Function or OpenAI for task evaluations.
// TODO: set NEXT_PUBLIC_EVALUATION_FUNCTION_URL to your Supabase Edge Function endpoint
// TODO: set NEXT_PUBLIC_EVALUATION_FUNCTION_KEY to the function auth key (if required)

type EvaluationPayload = {
  taskId: string;
  userId: string;
  title: string;
  description: string;
  code: string;
  language: string;
};

export async function requestEvaluation(payload: EvaluationPayload) {
  const endpoint = process.env.NEXT_PUBLIC_EVALUATION_FUNCTION_URL;

  if (!endpoint) {
    console.warn('Missing NEXT_PUBLIC_EVALUATION_FUNCTION_URL env variable.');
    return;
  }

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_EVALUATION_FUNCTION_KEY ?? ''}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Failed to trigger evaluation', error);
  }
}
