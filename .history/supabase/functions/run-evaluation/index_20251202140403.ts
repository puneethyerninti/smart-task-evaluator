import { createClient } from "@supabase/supabase-js";

type DenoLike = {
  env: { get(key: string): string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

declare const Deno: DenoLike;

type TaskRecord = {
  id: string;
  user_id: string;
  language?: string | null;
  title?: string | null;
  description?: string | null;
  code?: string | null;
};

type AIChoice = {
  message?: {
    content?: string;
  };
};

type ChatCompletionResponse = {
  choices?: AIChoice[];
};

type EvaluationResult = {
  score: number;
  strengths: string[];
  improvements: string[];
  short_feedback: string;
  full_report: string;
};

const requireEnv = (key: string): string => {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

const SUPABASE_URL = requireEnv("SUPABASE_URL");
const SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const OPENAI_KEY = requireEnv("OPENAI_API_KEY");

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const parseEvaluation = (content: string): EvaluationResult => {
  try {
    const parsed = JSON.parse(content) as Partial<EvaluationResult>;
    return {
      score: typeof parsed.score === "number" ? parsed.score : 50,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.map(String) : [],
      short_feedback: typeof parsed.short_feedback === "string" ? parsed.short_feedback : "Invalid JSON",
      full_report: typeof parsed.full_report === "string" ? parsed.full_report : content,
    };
  } catch {
    return {
      score: 50,
      strengths: [],
      improvements: [],
      short_feedback: "Invalid JSON",
      full_report: content,
    };
  }
};

Deno.serve(async (req: Request) => {
  try {
    const body = await req.json().catch(() => ({})) as { task_id?: string };
    const { task_id } = body;

    if (!task_id) {
      return new Response(JSON.stringify({ error: "Missing task_id" }), {
        status: 400,
      });
    }

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", task_id)
      .single();

    if (taskError || !task) {
      return new Response(JSON.stringify({ error: "Task not found" }), {
        status: 404,
      });
    }

    const prompt = `
You are an expert code reviewer.
Return only valid JSON:
{
  "score": 0-100,
  "short_feedback": "one sentence",
  "strengths": ["..."],
  "improvements": ["..."],
  "full_report": "long detailed text"
}

Language: ${task.language ?? "unknown"}
Title: ${task.title ?? "Untitled"}
Description: ${task.description ?? "No description"}
Code:
${task.code ?? ""}
`;

    const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500
      }),
    });

    const aiJson = await aiResp.json() as ChatCompletionResponse;
    const content = aiJson.choices?.[0]?.message?.content ?? "{}";
    const parsed = parseEvaluation(content);

    const { data: report, error: insertError } = await supabase
      .from("reports")
      .insert({
        task_id: (task as TaskRecord).id,
        user_id: (task as TaskRecord).user_id,
        score: parsed.score,
        strengths: parsed.strengths,
        improvements: parsed.improvements,
        short_feedback: parsed.short_feedback,
        full_report: parsed.full_report,
        unlocked: false,
      })
      .select()
      .single();

    if (insertError) {
      return new Response(JSON.stringify(insertError), { status: 500 });
    }

    return new Response(JSON.stringify({ report }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
    });
  }
});
