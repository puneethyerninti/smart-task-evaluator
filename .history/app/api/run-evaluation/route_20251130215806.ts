import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/api";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseRouteHandlerClient();
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

    // Extract text
    const text =
      completion.output_text ??
      completion.output?.[0]?.content?.[0]?.text ??
      "{}";
    let parsed;
    try { parsed = JSON.parse(text); }
    catch (e) { parsed = { score: 50, strengths: [], improvements: [], short_feedback: "Invalid JSON response", full_report: text }; }

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
  } catch (err: any) {
    console.error("run-eval error:", err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
