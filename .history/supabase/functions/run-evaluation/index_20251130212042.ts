// @ts-nocheck: Supabase Edge Functions depend on Deno APIs lacking TypeScript typings in this context
// supabase/functions/run-evaluation/index.ts

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req: Request) => {
  try {

    if (!task_id) {
      return new Response(JSON.stringify({ error: "Missing task_id" }), {
        status: 400,
      });
    }

    // Fetch task
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
Return ONLY valid JSON in this format:

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

    const aiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1500,
        }),
      }
    );

    const aiJson = await aiResponse.json();
    const content = aiJson.choices?.[0]?.message?.content ?? "{}";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        score: 50,
        short_feedback: "AI response did not return valid JSON.",
        strengths: [],
        improvements: [],
        full_report: content,
      };
    }

    const { data: report, error: insertError } = await supabase
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

    if (insertError) {
      return new Response(JSON.stringify(insertError), { status: 500 });
    }

    return new Response(JSON.stringify({ report }), {
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
});
