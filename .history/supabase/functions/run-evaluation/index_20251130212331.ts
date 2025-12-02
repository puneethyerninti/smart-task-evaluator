// @ts-nocheck: Supabase Edge Functions use Deno APIs that lack TypeScript typings

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req: Request) => {
  try {
    const { task_id } = await req.json();

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

Language: ${task.language}
Title: ${task.title}
Description: ${task.description}
Code:
${task.code}
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

    const aiJson = await aiResp.json();
    const content = aiJson.choices?.[0]?.message?.content ?? "{}";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        score: 50,
        strengths: [],
        improvements: [],
        short_feedback: "Invalid JSON",
        full_report: content,
      };
    }

    const { data: report, error: insertError } = await supabase
      .from("reports")
      .insert({
        task_id: task.id,
        user_id: task.user_id,
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
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
});
