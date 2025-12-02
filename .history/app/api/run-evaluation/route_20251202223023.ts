import { NextResponse } from "next/server";
import OpenAI from "openai";
// import helper removed — using createClient directly for fallback/admin flows

type OpenAIResponse = Awaited<ReturnType<OpenAI["responses"]["create"]>>;

type EvaluationResult = {
  score: number | null;
  strengths: string[];
  improvements: string[];
  short_feedback: string;
  full_report: string;
};

type TaskRecord = {
  id: string;
  user_id: string;
  language?: string | null;
  title?: string | null;
  description?: string | null;
  code?: string | null;
};

const isTextContent = (content: unknown): content is { text: string } =>
  typeof content === "object" && content !== null &&
  "text" in content && typeof (content as { text: unknown }).text === "string";

const getOutputText = (completion: OpenAIResponse): string | undefined => {
  if (typeof completion !== "object" || completion === null || !("output_text" in completion)) {
    return undefined;
  }

  const value = (completion as { output_text?: unknown }).output_text;
  if (typeof value === "string") {
    return value.trim();
  }
  if (Array.isArray(value)) {
    const joined = value
      .filter((item): item is string => typeof item === "string")
      .join("\n")
      .trim();
    return joined.length > 0 ? joined : undefined;
  }
  return undefined;
};

type OutputChunk = {
  content?: Array<{ text?: string }> | null;
};

const getOutputChunks = (completion: OpenAIResponse): OutputChunk[] => {
  if (typeof completion !== "object" || completion === null || !("output" in completion)) {
    return [];
  }

  const value = (completion as { output?: unknown }).output;
  if (Array.isArray(value)) {
    return value.filter((chunk): chunk is OutputChunk => typeof chunk === "object" && chunk !== null);
  }
  return [];
};

const toList = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    return value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const extractResponseText = (completion: OpenAIResponse): string => {
  const preferredText = getOutputText(completion);

  if (preferredText) {
    return preferredText;
  }

  const chunks = getOutputChunks(completion);
  for (const chunk of chunks) {
    for (const content of chunk.content ?? []) {
      if (isTextContent(content) && content.text.trim().length > 0) {
        return content.text;
      }
    }
  }

  return "{}";
};

const stripCodeFence = (raw: string): string => {
  if (!raw) return raw;
  const fenceMatch = raw.match(/```[a-zA-Z]*\n?([\s\S]*?)```/);
  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim();
  }
  return raw.trim();
};

const extractJsonObject = (raw: string): string => {
  if (!raw) return raw;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return raw.slice(start, end + 1);
  }
  return raw;
};

const sanitizeJsonLikeString = (raw: string): string => extractJsonObject(stripCodeFence(raw));

const parseEvaluation = (raw: string): EvaluationResult => {
  try {
    const sanitized = sanitizeJsonLikeString(raw);
    const parsed = JSON.parse(sanitized) as {
      score?: unknown;
      short_feedback?: unknown;
      strengths?: unknown;
      improvements?: unknown;
      full_report?: unknown;
    };

    const shortFeedback = typeof parsed.short_feedback === "string"
      ? parsed.short_feedback
      : "Report ready";

    const fullReport = typeof parsed.full_report === "string" && parsed.full_report.trim().length > 0
      ? parsed.full_report
      : sanitized;

    return {
      score: typeof parsed.score === "number" ? parsed.score : null,
      strengths: toList(parsed.strengths),
      improvements: toList(parsed.improvements),
      short_feedback: shortFeedback,
      full_report: fullReport,
    };
  } catch {
    return {
      score: null,
      strengths: [],
      improvements: [],
      short_feedback: "Invalid JSON response",
      full_report: raw,
    };
  }
};

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null;

    let user = null;
    let isAdmin = false;
    const { createClient } = await import('@supabase/supabase-js');

    if (token) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: authData } = await supabase.auth.getUser();
      user = authData?.user ?? null;
    }

    // If no user token, try using service role (server-only) to fetch task for demo/fallback
    let supabase: ReturnType<typeof createClient>;
    if (!user && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
      isAdmin = true;
    } else if (token) {
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
    } else {
      return NextResponse.json({ error: "Unauthorized - missing token and no service role" }, { status: 401 });
    }

    const body = await request.json();
    const task_id = body?.task_id;
    if (!task_id) return NextResponse.json({ error: "Missing task_id" }, { status: 400 });

    // fetch task (owner-only unless admin)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let taskQuery = (supabase as any).from("tasks").select("*").eq("id", task_id).limit(1);
    if (!isAdmin) {
      taskQuery = taskQuery.eq("user_id", user?.id ?? "");
    }
    const taskRes = await taskQuery.single();
    const task = taskRes.data as TaskRecord | null;
    const taskErr = taskRes.error;

    if (taskErr || !task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    // Build prompt
    const prompt = `You are an expert code reviewer. Return STRICT JSON only with keys:
{
  "score": <integer 0-100>,
  "short_feedback": "<one-line>",
  "strengths": ["..."],
  "improvements": ["..."],
  "full_report": "<detailed feedback>"
}
Language: ${task.language ?? "unknown"}
Title: ${task.title}
Description: ${task.description}
Code:
${task.code}
`;

    // call OpenAI (responses api)
    let parsed: EvaluationResult;
    try {
      const completion = await openai.responses.create({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        input: prompt,
        max_output_tokens: 1200,
      });
      const text = extractResponseText(completion);
      parsed = parseEvaluation(text);
    } catch (err: unknown) {
      console.error('run-eval OpenAI error:', err);
      // Fallback: insert a mock evaluation so the flow completes during demos/tests
      parsed = {
        score: 70,
        strengths: ['Clear structure', 'Handles edge cases well'],
        improvements: ['Add more tests', 'Optimize inner loop'],
        short_feedback: 'Mock evaluation (OpenAI unavailable)',
        full_report: `Mock report generated because OpenAI API call failed. Error: ${err instanceof Error ? err.message : String(err)}`,
      } as const;
    }

    // insert report row (use any cast to avoid strict generics issues)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reportInsert = await (supabase as any)
      .from("reports")
      .insert({
        task_id: task.id,
        user_id: (isAdmin ? task.user_id : user?.id) ?? null,
        score: parsed.score,
        strengths: parsed.strengths,
        improvements: parsed.improvements,
        short_feedback: parsed.short_feedback,
        full_report: parsed.full_report,
        unlocked: false,
      })
      .select()
      .single();

    const report = reportInsert.data ?? null;
    const insertErr = reportInsert.error ?? null;

    if (insertErr) return NextResponse.json({ error: insertErr.message ?? String(insertErr) }, { status: 500 });

    // update task status to done
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("tasks").update({ status: "done" }).eq("id", task.id);

    return NextResponse.json({ report });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("run-eval error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
