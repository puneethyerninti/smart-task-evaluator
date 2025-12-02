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
  const normalizeTextArray = (value: string[] | undefined | null) => value?.join("\n").trim();

  const preferredText = typeof completion.output_text === "string"
    ? completion.output_text.trim()
    : normalizeTextArray(Array.isArray(completion.output_text) ? completion.output_text : undefined);

  if (preferredText) {
    return preferredText;
  }

  for (const chunk of completion.output ?? []) {
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
    const supabase = await createSupabaseRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const task_id = body?.task_id;
    if (!task_id) return NextResponse.json({ error: "Missing task_id" }, { status: 400 });

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
