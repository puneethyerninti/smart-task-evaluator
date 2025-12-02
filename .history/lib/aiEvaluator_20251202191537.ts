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

const withTimeout = async <T>(promise: Promise<T>, ms = 5000): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    const response = await promise;
    return response;
  } finally {
    clearTimeout(timeout);
  }
};

export async function requestEvaluation(payload: EvaluationPayload) {
  const endpoint = process.env.NEXT_PUBLIC_EVALUATION_FUNCTION_URL;

  if (!endpoint) {
    console.warn('Missing NEXT_PUBLIC_EVALUATION_FUNCTION_URL env variable.');
    return;
  }

  const body = {
    task_id: payload.taskId,
    taskId: payload.taskId,
    user_id: payload.userId,
    title: payload.title,
    description: payload.description,
    code: payload.code,
    language: payload.language,
  };

  try {
    const response = await withTimeout(
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_EVALUATION_FUNCTION_KEY ?? ''}`,
        },
        body: JSON.stringify(body),
      })
    );

    if (!response.ok) {
      const message = await response.text().catch(() => 'Unknown error');
      console.error('Evaluation trigger failed:', response.status, message);
    }
  } catch (error) {
    console.error('Failed to trigger evaluation', error);
  }
}
