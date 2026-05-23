import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const InputSchema = z.object({
  sessionId: z.string().min(1).max(64),
  symptoms: z.string().min(3).max(2000),
  ageGroup: z.string().max(20).optional(),
});

const tool = {
  type: "function",
  function: {
    name: "diagnose",
    description: "Return a structured preliminary health assessment based on the user's symptoms.",
    parameters: {
      type: "object",
      properties: {
        disease: { type: "string", description: "Most likely condition name" },
        description: { type: "string", description: "Brief 1-2 sentence explanation of the condition" },
        severity: { type: "string", enum: ["low", "medium", "high"] },
        precautions: {
          type: "array",
          items: { type: "string" },
          minItems: 4,
          maxItems: 4,
          description: "Exactly 4 actionable precautions",
        },
      },
      required: ["disease", "description", "severity", "precautions"],
      additionalProperties: false,
    },
  },
};

export const diagnoseSymptoms = createServerFn({ method: "POST" })
  .inputValidator((d) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are HealthGuard AI, a preliminary triage assistant. Always respond by calling the diagnose tool. Be concise, clinically grounded, and conservative. Severity: 'low' for self-care issues, 'medium' for symptoms warranting a clinic visit within days, 'high' for symptoms requiring urgent/emergency care.",
          },
          { role: "user", content: `Symptoms: ${data.symptoms}` },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "diagnose" } },
      }),
    });

    if (res.status === 429) throw new Error("Too many requests. Please wait a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please top up your workspace.");
    if (!res.ok) {
      const t = await res.text();
      console.error("AI gateway error", res.status, t);
      throw new Error("AI service unavailable");
    }

    const json = await res.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) throw new Error("Invalid AI response");
    const parsed = JSON.parse(call.function.arguments) as {
      disease: string;
      description: string;
      severity: "low" | "medium" | "high";
      precautions: string[];
    };

    const { error } = await supabaseAdmin.from("diagnoses").insert({
      session_id: data.sessionId,
      symptoms: data.symptoms,
      disease: parsed.disease,
      description: parsed.description,
      severity: parsed.severity,
      precautions: parsed.precautions,
      age_group: data.ageGroup ?? null,
    });
    if (error) console.error("Insert diagnosis error:", error);

    return parsed;
  });