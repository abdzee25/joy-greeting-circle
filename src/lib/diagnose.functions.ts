import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const InputSchema = z.object({
  sessionId: z.string().min(1).max(64),
  symptoms: z.string().min(3).max(2000),
  ageGroup: z.string().max(20).optional(),
});

async function fetchCSV(filename: string): Promise<string> {
  const baseUrl = "https://raw.githubusercontent.com/abdzee25/joy-greeting-circle/main/public";
  const res = await fetch(`${baseUrl}/${filename}`);
  if (!res.ok) return "";
  return res.text();
}

function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim().replace(/"/g, ""));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => obj[h] = values[i] || "");
    return obj;
  });
}

function findDisease(rows: Record<string, string>[], disease: string) {
  return rows.find(r => 
    Object.values(r)[0]?.toLowerCase().includes(disease.toLowerCase())
  );
}

const tool = {
  type: "function",
  function: {
    name: "diagnose",
    description: "Return the most likely disease name based on symptoms.",
    parameters: {
      type: "object",
      properties: {
        disease: { type: "string", description: "Most likely condition name" },
        severity: { type: "string", enum: ["low", "medium", "high"] },
      },
      required: ["disease", "severity"],
      additionalProperties: false,
    },
  },
};

export const diagnoseSymptoms = createServerFn({ method: "POST" })
  .inputValidator((d) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("API key not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are HealthGuard AI. Identify the most likely disease from symptoms. You MUST return ONE specific disease name from this exact list: AIDS, Acne, Allergy, Arthritis, Bronchial Asthma, Chicken pox, Common Cold, Dengue, Diabetes, Drug Reaction, Fungal infection, GERD, Gastroenteritis, Heart attack, Hepatitis B, Hepatitis C, Hepatitis D, Hepatitis E, Hypertension, Hyperthyroidism, Hypoglycemia, Hypothyroidism, Impetigo, Jaundice, Malaria, Migraine, Osteoarthritis, Paralysis (brain hemorrhage), Peptic ulcer disease, Pneumonia, Psoriasis, Tuberculosis, Typhoid, Urinary tract infection, Varicose veins. Call the diagnose tool with the exact disease name.",,
          },
          { role: "user", content: `Symptoms: ${data.symptoms}` },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "diagnose" } },
      }),
    });

    if (!res.ok) throw new Error("AI service unavailable");

    const json = await res.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) throw new Error("Invalid AI response");
    
    const aiResult = JSON.parse(call.function.arguments) as {
      disease: string;
      severity: "low" | "medium" | "high";
    };

    // Now fetch from YOUR CSV dataset!
    const [descRows, precRows] = await Promise.all([
      fetchCSV("symptom_Description.csv").then(parseCSV),
      fetchCSV("symptom_precaution.csv").then(parseCSV),
    ]);

    const descRow = findDisease(descRows, aiResult.disease);
    const precRow = findDisease(precRows, aiResult.disease);

    const description = descRow?.Description || 
      `${aiResult.disease} is a medical condition identified based on your symptoms.`;

    const precautions = precRow 
      ? [precRow.Precaution_1, precRow.Precaution_2, precRow.Precaution_3, precRow.Precaution_4].filter(Boolean)
      : ["Consult a doctor", "Rest and stay hydrated", "Monitor your symptoms", "Seek medical attention if symptoms worsen"];

    const parsed = {
      disease: aiResult.disease,
      description,
      severity: aiResult.severity,
      precautions,
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
