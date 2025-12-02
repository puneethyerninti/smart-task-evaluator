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

type IncomingPayload = {
  task_id?: string;
  taskId?: string;
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

const updateTaskStatus = async (taskId: string, status: string) => {
  const { error } = await supabase.from("tasks").update({ status }).eq("id", taskId);
  if (error) {
    console.error("Failed to update task status", { taskId, status, error });
  }
};

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
  let taskIdForStatus: string | null = null;
  try {
    const body = await req.json().catch(() => ({})) as IncomingPayload;
    const task_id = body.task_id ?? body.taskId;

    if (!task_id) {
      return new Response(JSON.stringify({ error: "Missing task_id" }), {
        status: 400,
      });
    }

    taskIdForStatus = task_id;

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

    const taskRecord = task as TaskRecord;

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

Language: ${taskRecord.language ?? "unknown"}
Title: ${taskRecord.title ?? "Untitled"}
Description: ${taskRecord.description ?? "No description"}
Code:
${taskRecord.code ?? ""}
`;

    await updateTaskStatus(taskRecord.id, "in_review");

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

    if (!aiResp.ok) {
      await updateTaskStatus(taskRecord.id, "error");
      return new Response(JSON.stringify({ error: "OpenAI request failed", status: aiResp.status }), {
        status: 502,
      });
    }

    const aiJson = await aiResp.json() as ChatCompletionResponse;
    const content = aiJson.choices?.[0]?.message?.content ?? "{}";
    const parsed = parseEvaluation(content);

    const { data: report, error: insertError } = await supabase
      .from("reports")
      .insert({
        task_id: taskRecord.id,
        user_id: taskRecord.user_id,
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
      await updateTaskStatus(taskRecord.id, "error");
      return new Response(JSON.stringify(insertError), { status: 500 });
    }

    await updateTaskStatus(taskRecord.id, "done");

    return new Response(JSON.stringify({ report }), { status: 200 });

  } catch (err: unknown) {
    if (taskIdForStatus) {
      await updateTaskStatus(taskIdForStatus, "error");
    }
    console.error("run-evaluation edge error", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
    });
  }
});
