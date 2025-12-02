import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/api";

type OpenAIResponse = Awaited<ReturnType<OpenAI["responses"]["create"]>>;

type EvaluationResult = {
  score: number | null;
  strengths: string[];
  improvements: string[];
  short_feedback: string;
  full_report: string;
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

const parseEvaluation = (raw: string): EvaluationResult => {
  try {
    const parsed = JSON.parse(raw) as {
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
      : raw;

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
    if (token) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: authData } = await supabase.auth.getUser();
      user = authData?.user;
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized - no valid token" }, { status: 401 });
    }

    const body = await request.json();
    const task_id = body?.task_id;
    if (!task_id) return NextResponse.json({ error: "Missing task_id" }, { status: 400 });

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // fetch task (owner-only)
    const { data: task, error: taskErr } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", task_id)
      .eq("user_id", user.id)
      .single();

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
    const completion = await openai.responses.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      input: prompt,
      max_output_tokens: 1200
    });
    const text = extractResponseText(completion);
    const parsed = parseEvaluation(text);

    // insert report row
    const { data: report, error: insertErr } = await supabase
      .from("reports")
      .insert({
        task_id: task.id,
        user_id: user.id,
        score: parsed.score,
        strengths: parsed.strengths,
        improvements: parsed.improvements,
        short_feedback: parsed.short_feedback,
        full_report: parsed.full_report,
        unlocked: false
      })
      .select()
      .single();

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    // update task status to done
    await supabase.from("tasks").update({ status: "done" }).eq("id", task.id);

    return NextResponse.json({ report });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("run-eval error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
