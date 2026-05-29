import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
const InputSchema = z.object({
  sessionId: z.string().min(1).max(64),
  symptoms: z.string().min(3).max(2000),
  ageGroup: z.string().max(20).optional(),
});
export const diagnoseSymptoms = createServerFn({ method: "POST" })
  .inputValidator((d) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = "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";
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are HealthGuard AI, a health assistant aligned with SDG 3 and Pakistan Vision 2030. 
Analyze symptoms and respond with ONLY a valid JSON object in this exact format:
{
  "disease": "exact disease name from: AIDS, Acne, Allergy, Arthritis, Bronchial Asthma, Chicken pox, Common Cold, Dengue, Diabetes, Drug Reaction, Fungal infection, GERD, Gastroenteritis, Heart attack, Hepatitis B, Hepatitis C, Hepatitis D, Hepatitis E, Hypertension, Hyperthyroidism, Hypoglycemia, Hypothyroidism, Impetigo, Jaundice, Malaria, Migraine, Osteoarthritis, Paralysis (brain hemorrhage), Peptic ulcer disease, Pneumonia, Psoriasis, Tuberculosis, Typhoid, Urinary tract infection, Varicose veins",
  "description": "2 sentence medical description",
  "severity": "low",
  "precautions": ["precaution 1", "precaution 2", "precaution 3", "precaution 4"]
}
severity must be exactly: low, medium, or high. No other text outside the JSON.`,
          },
          { role: "user", content: `Symptoms: ${data.symptoms}` },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("OpenRouter error", res.status, t);
      if (res.status === 429) throw new Error("Rate limit exceeded. Please try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please add credits to your OpenRouter account.");
      throw new Error(`AI error: ${res.status}`);
    }
    const json = await res.json();
    const text = json.choices?.[0]?.message?.content;
    if (!text) throw new Error("Invalid AI response");
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleanText) as {
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
