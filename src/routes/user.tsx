import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Send, Loader2, AlertTriangle, ShieldCheck, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/user")({
  head: () => ({
    meta: [
      { title: "User Dashboard — HealthGuard AI" },
      { name: "description", content: "Chat-based AI symptom checker with severity scoring and precautions." },
    ],
  }),
  component: UserDashboard,
});

type Diagnosis = {
  disease: string;
  description: string;
  severity: "low" | "medium" | "high";
  precautions: string[];
};

type ChatItem =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "ai"; data: Diagnosis };

const severityStyles: Record<Diagnosis["severity"], string> = {
  low: "bg-emerald-100 text-emerald-700 border-emerald-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  high: "bg-rose-100 text-rose-700 border-rose-200",
};

function genId() {
  return Math.random().toString(36).slice(2);
}

async function diagnoseWithGemini(symptoms: string): Promise<Diagnosis> {
  const GEMINI_API_KEY = "AIzaSyCzRk5vwV88Y6EPxeVo8_KXq1SH42Ea8w8";
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `You are HealthGuard AI, a professional health assistant aligned with SDG 3 (Good Health) and Pakistan Vision 2030.

A patient reports these symptoms: "${symptoms}"

You MUST respond with ONLY a JSON object — no markdown, no explanation, no extra text. Just the raw JSON:

{
  "disease": "pick ONE disease name EXACTLY from this list: AIDS, Acne, Allergy, Arthritis, Bronchial Asthma, Chicken pox, Common Cold, Dengue, Diabetes, Drug Reaction, Fungal infection, GERD, Gastroenteritis, Heart attack, Hepatitis B, Hepatitis C, Hepatitis D, Hepatitis E, Hypertension, Hyperthyroidism, Hypoglycemia, Hypothyroidism, Impetigo, Jaundice, Malaria, Migraine, Osteoarthritis, Paralysis (brain hemorrhage), Peptic ulcer disease, Pneumonia, Psoriasis, Tuberculosis, Typhoid, Urinary tract infection, Varicose veins",
  "description": "Write 2 clear sentences describing this disease and why these symptoms suggest it",
  "severity": "low",
  "precautions": ["specific precaution 1", "specific precaution 2", "specific precaution 3", "specific precaution 4"]
}

Rules:
- severity must be exactly one of: low, medium, high
- precautions must have exactly 4 items
- disease must be EXACTLY from the list above
- NO text before or after the JSON`;

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 500,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini error:", response.status, errorText);
    throw new Error("AI service unavailable");
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) throw new Error("No response from AI");

  const cleaned = rawText
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const parsed = JSON.parse(cleaned) as Diagnosis;

  if (!parsed.disease || !parsed.description || !parsed.severity || !parsed.precautions) {
    throw new Error("Invalid AI response format");
  }

  return parsed;
}

function UserDashboard() {
  const [history, setHistory] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [history, loading]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (text.length < 3) {
      toast.error("Please describe your symptoms (min 3 characters).");
      return;
    }
    setHistory((h) => [...h, { id: genId(), role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const data = await diagnoseWithGemini(text);
      setHistory((h) => [...h, { id: genId(), role: "ai", data }]);
      toast.success("Assessment ready");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <ShieldCheck className="h-3.5 w-3.5" /> AI-Powered Triage
        </div>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
          Your AI Health Companion
        </h1>
        <p className="mt-2 text-muted-foreground">
          Describe your symptoms below. Get a preliminary assessment in seconds.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <div ref={scrollRef} className="h-[480px] overflow-y-auto p-6 space-y-4">
          {history.length === 0 && !loading && (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
              <MessageSquare className="h-10 w-10 mb-3 opacity-50" />
              <p className="font-medium">Start your conversation</p>
              <p className="text-sm">
                Try: "I have a sore throat, mild fever and headache for 2 days."
              </p>
            </div>
          )}

          {history.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm text-primary-foreground shadow-sm">
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex justify-start">
                <div className="max-w-[90%] w-full rounded-2xl rounded-tl-sm border border-border bg-secondary/40 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Likely condition
                      </p>
                      <h3 className="text-lg font-bold text-foreground mt-0.5">
                        {m.data.disease}
                      </h3>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${severityStyles[m.data.severity]}`}
                    >
                      {m.data.severity} severity
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-foreground/80">{m.data.description}</p>
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Recommended precautions
                    </p>
                    <ul className="grid sm:grid-cols-2 gap-2">
                      {m.data.precautions.map((p, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 rounded-lg bg-background border border-border px-3 py-2 text-sm"
                        >
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                            {i + 1}
                          </span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-tl-sm border border-border bg-secondary/40 px-4 py-3 text-sm flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing symptoms…
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={submit}
          className="border-t border-border bg-background p-3 flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Describe your symptoms…"
            className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send
          </button>
        </form>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
        <p>
          <strong>Disclaimer:</strong> This is not a substitute for professional
          medical advice. Always consult a qualified healthcare provider for
          diagnosis and treatment.
        </p>
      </div>
    </div>
  );
}
