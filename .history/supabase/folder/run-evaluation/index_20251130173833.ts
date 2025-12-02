// supabase/functions/run-evaluation/index.ts
import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    const { task_id } = await req.json();
    if (!task_id) {
      return new Response(JSON.stringify({ error: "task_id required" }), { status: 400 });
    }

    // fetch task
    const { data: task, error: taskErr } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", task_id)
      .single();

    if (taskErr || !task) {
      return new Response(JSON.stringify({ error: "Task not found" }), { status: 404 });
    }

    const prompt = `You are a code reviewer. Output ONLY JSON:
{
  "score":0-100,
  "short_feedback":"string",
  "strengths":["..."],
  "improvements":["..."],
  "full_report":"detailed..."
}

TITLE: ${task.title}
LANGUAGE: ${task.language}
DESCRIPTION: ${task.description}
CODE:
${task.code}
`;

    // Call OpenAI
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Respond only with JSON" },
          { role: "user", content: prompt },
        ],
      }),
    });

    const aiJson = await aiRes.json();
    const raw = aiJson.choices?.[0]?.message?.content ?? "{}";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      parsed = {
        score: 50,
        strengths: [],
        improvements: [],
        short_feedback: raw.substring(0, 200),
        full_report: raw,
      };
    }

    // Insert into reports table
    const { data: report, error: repErr } = await supabase
      .from("reports")
      .insert([
        {
          task_id: task.id,
          user_id: task.user_id,
          score: parsed.score,
          strengths: parsed.strengths,
          improvements: parsed.improvements,
          short_feedback: parsed.short_feedback,
          full_report: parsed.full_report,
          unlocked: false,
        },
      ])
      .select()
      .single();

    if (repErr) {
      return new Response(JSON.stringify({ error: repErr.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ report }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
