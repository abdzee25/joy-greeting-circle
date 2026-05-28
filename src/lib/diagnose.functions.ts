import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const InputSchema = z.object({
  sessionId: z.string().min(1).max(64),
  symptoms: z.string().min(3).max(2000),
  ageGroup: z.string().max(20).optional(),
});

async function getDatasetInfo(disease: string) {
  try {
    const base = "https://raw.githubusercontent.com/abdzee25/joy-greeting-circle/main/public";
    
    const [descRes, precRes] = await Promise.all([
      fetch(`${base}/symptom_Description.csv`),
      fetch(`${base}/symptom_precaution.csv`),
    ]);

    const [descText, precText] = await Promise.all([
      descRes.text(),
      precRes.text(),
    ]);

    const findRow = (csv: string, disease: string) => {
      const lines = csv.trim().split("\n");
      return lines.find(line => 
        line.toLowerCase().includes(disease.toLowerCase())
      );
    };

    const descRow = findRow(descText, disease);
    const precRow = findRow(precText, disease);

    let description = null;
    let precautions = null;

    if (descRow) {
      const parts = descRow.split(",");
      description = parts.slice(1).join(",").replace(/"/g, "").trim();
    }

    if (precRow) {
      const parts = precRow.split(",");
      precautions = [
        parts[1]?.replace(/"/g, "").trim(),
        parts[2]?.replace(/"/g, "").trim(),
        parts[3]?.replace(/"/g, "").trim(),
        parts[4]?.replace(/"/g, "").trim(),
      ].filter(Boolean);
    }

    return { description, precautions };
  } catch (e) {
    return { description: null, precautions: null };
  }
}

export const diagnoseSymptoms = createServerFn({ method: "POST" })
  .inputValidator((d) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = "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";

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://joy-greeting-circle.lovable.app",
        "X-Title": "HealthGuard AI",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          {
            role: "system",
            content: `You are HealthGuard AI aligned with SDG 3 and Pakistan Vision 2030. 
Respond with ONLY a JSON object:
{
  "disease": "one disease from: AIDS, Acne, Allergy, Arthritis, Bronchial Asthma, Chicken pox, Common Cold, Dengue, Diabetes, Drug Reaction, Fungal infection, GERD, Gastroenteritis, Heart attack, Hepatitis B, Hepatitis C, Hepatitis D, Hepatitis E, Hypertension, Hyperthyroidism, Hypoglycemia, Hypothyroidism, Impetigo, Jaundice, Malaria, Migraine, Osteoarthritis, Paralysis (brain hemorrhage), Peptic ulcer disease, Pneumonia, Psoriasis, Tuberculosis, Typhoid, Urinary tract infection, Varicose veins",
  "severity": "low or medium or high"
}
No other text.`,
          },
          { role: "user", content: `Symptoms: ${data.symptoms}` },
        ],
      }),
    });

    if (!res.ok) throw new Error("AI service unavailable");

    const json = await res.json();
    const text = json.choices?.[0]?.message?.content;
    if (!text) throw new Error("Invalid AI response");

    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
    const aiResult = JSON.parse(cleanText) as {
      disease: string;
      severity: "low" | "medium" | "high";
    };

    // Get data from YOUR dataset!
    const { description: csvDesc, precautions: csvPrec } = await getDatasetInfo(aiResult.disease);

    const parsed = {
      disease: aiResult.disease,
      description: csvDesc || `${aiResult.disease} is a medical condition identified based on your reported symptoms. Please consult a healthcare professional for proper diagnosis.`,
      severity: aiResult.severity,
      precautions: csvPrec || ["Consult a qualified doctor immediately", "Rest and stay hydrated", "Monitor your symptoms closely", "Avoid self-medication"],
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
