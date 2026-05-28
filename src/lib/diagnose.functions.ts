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
        disease: { type: "string", description: "Most likely condition name from the provided list" },
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
  const apiKey = process.env.VITE_GEMINI_API_KEY || "AIzaSyACO4-VlYAF4P9yCajs2OLtcHFP3VZ9hGc";

    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-1.5-flash",
        messages: [
          {
            role: "system",
            content: "You are HealthGuard AI, a preliminary triage assistant aligned with SDG 3 and Pakistan Vision 2030. You MUST pick ONE disease from this exact list: AIDS, Acne, Allergy, Arthritis, Bronchial Asthma, Chicken pox, Common Cold, Dengue, Diabetes, Drug Reaction, Fungal infection, GERD, Gastroenteritis, Heart attack, Hepatitis B, Hepatitis C, Hepatitis D, Hepatitis E, Hypertension, Hyperthyroidism, Hypoglycemia, Hypothyroidism, Impetigo, Jaundice, Malaria, Migraine, Osteoarthritis, Paralysis (brain hemorrhage), Peptic ulcer disease, Pneumonia, Psoriasis, Tuberculosis, Typhoid, Urinary tract infection, Varicose veins. Always call the diagnose tool with the exact disease name from this list.",
          },
          { role: "user", content: `Symptoms: ${data.symptoms}` },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "diagnose" } },
      }),
    });

    if (res.status === 429) throw new Error("Too many requests. Please wait a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted.");
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
