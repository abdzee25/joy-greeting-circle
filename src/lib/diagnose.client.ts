import { supabase } from "@/integrations/supabase/client";
import {
  getDataset,
  lookupDescription,
  lookupPrecautions,
  computeSeverity,
} from "./dataset.client";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyCzRk5vwV88Y6EPxeVo8_KXq1SH42Ea8w8";

const DISEASES = "AIDS, Acne, Allergy, Arthritis, Bronchial Asthma, Chicken pox, Common Cold, Dengue, Diabetes, Drug Reaction, Fungal infection, GERD, Gastroenteritis, Heart attack, Hepatitis B, Hepatitis C, Hepatitis D, Hepatitis E, Hypertension, Hyperthyroidism, Hypoglycemia, Hypothyroidism, Impetigo, Jaundice, Malaria, Migraine, Osteoarthritis, Paralysis (brain hemorrhage), Peptic ulcer disease, Pneumonia, Psoriasis, Tuberculosis, Typhoid, Urinary tract infection, Varicose veins";

const SYSTEM_PROMPT = `You are HealthGuard AI, a health assistant aligned with SDG 3 and Pakistan Vision 2030.
Analyze symptoms and respond with ONLY a valid JSON object (no markdown, no code fences) in this exact format:
{
  "disease": "exact disease name from: ${DISEASES}",
  "description": "2 sentence medical description",
  "severity": "low",
  "precautions": ["precaution 1", "precaution 2", "precaution 3", "precaution 4"]
}
severity must be exactly: low, medium, or high. No other text outside the JSON.`;

export type Diagnosis = {
  disease: string;
  description: string;
  severity: "low" | "medium" | "high";
  precautions: string[];
  source: "kaggle" | "ai";
};

export async function diagnoseSymptoms(input: {
  sessionId: string;
  symptoms: string;
  ageGroup?: string;
}): Promise<Diagnosis> {
  let parsed: {
    disease: string;
    description: string;
    severity: "low" | "medium" | "high";
    precautions: string[];
  };
  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${SYSTEM_PROMPT}\n\nSymptoms: ${input.symptoms}` }],
          },
        ],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });
    if (!res.ok) throw new Error("Please try again");
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Please try again");
    const clean = String(text).replace(/```json\n?|\n?```/g, "").trim();
    parsed = JSON.parse(clean);
  } catch {
    throw new Error("Please try again");
  }

  let source: "kaggle" | "ai" = "ai";
  let description = parsed.description;
  let precautions = parsed.precautions;
  let severity = parsed.severity;
  try {
    const ds = await getDataset();
    const csvDesc = lookupDescription(ds, parsed.disease);
    const csvPrec = lookupPrecautions(ds, parsed.disease);
    const sev = computeSeverity(ds, input.symptoms);
    if (csvDesc) { description = csvDesc; source = "kaggle"; }
    if (csvPrec && csvPrec.length) { precautions = csvPrec; source = "kaggle"; }
    if (sev.matched.length > 0) severity = sev.level;
  } catch (e) {
    console.error("Dataset lookup failed:", e);
  }

  const result: Diagnosis = { disease: parsed.disease, description, severity, precautions, source };

  try {
    await supabase.from("diagnoses").insert({
      session_id: input.sessionId,
      symptoms: input.symptoms,
      disease: result.disease,
      description: result.description,
      severity: result.severity,
      precautions: result.precautions,
      age_group: input.ageGroup ?? null,
    });
  } catch (e) {
    console.error("Insert diagnosis error:", e);
  }

  return result;
}