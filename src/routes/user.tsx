import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Send, Loader2, AlertTriangle, ShieldCheck, MessageSquare, Database } from "lucide-react";
import { diagnoseSymptoms } from "@/lib/diagnose.functions";

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
  source?: "kaggle" | "ai";
};

type ChatItem =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "ai"; data: Diagnosis };

const severityStyles: Record<Diagnosis["severity"], string> = {
  low: "bg-emerald-500/15 text-emerald-300 border-emerald-400/40 shadow-[0_0_18px_-4px_rgba(16,185,129,0.6)]",
  medium: "bg-amber-500/15 text-amber-300 border-amber-400/40 shadow-[0_0_18px_-4px_rgba(245,158,11,0.6)]",
  high: "bg-rose-500/15 text-rose-300 border-rose-400/40 shadow-[0_0_18px_-4px_rgba(244,63,94,0.7)]",
};

function genId() {
  return Math.random().toString(36).slice(2);
}

function UserDashboard() {
  const diagnose = useServerFn(diagnoseSymptoms);
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
      const data = await diagnose({ data: { sessionId: genId(), symptoms: text } });
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
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 animate-fade-up">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full glass-panel px-3 py-1 text-xs font-medium text-primary-glow">
          <ShieldCheck className="h-3.5 w-3.5" /> AI-Powered Triage
        </div>
        <h1 className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight text-gradient">
          Your AI Health Companion
        </h1>
        <p className="mt-3 text-foreground/70">
          Describe your symptoms below. Get a preliminary assessment in seconds.
        </p>
      </div>

      <div className="glass-panel glow-border rounded-2xl overflow-hidden">
        <div ref={scrollRef} className="h-[480px] overflow-y-auto p-6 space-y-4">
          {history.length === 0 && !loading && (
            <div className="flex h-full flex-col items-center justify-center text-center text-foreground/60">
              <MessageSquare className="h-12 w-12 mb-3 text-primary-glow/70 animate-glow-pulse" />
              <p className="font-medium text-foreground/80">Start your conversation</p>
              <p className="text-sm">
                Try: "I have a sore throat, mild fever and headache for 2 days."
              </p>
            </div>
          )}

          {history.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end animate-fade-up">
                <div
                  className="max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white shadow-[0_8px_24px_-8px_rgba(59,130,246,0.55)]"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex justify-start animate-fade-up">
                <div className="max-w-[90%] w-full rounded-2xl rounded-tl-sm glass-panel p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-primary-glow/80">
                        Likely condition
                      </p>
                      <h3 className="text-xl font-bold text-gradient mt-0.5">
                        {m.data.disease}
                      </h3>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${severityStyles[m.data.severity]}`}
                    >
                      {m.data.severity} severity
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-foreground/85 leading-relaxed">{m.data.description}</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary-glow">
                    <Database className="h-3 w-3" />
                    Data source: {m.data.source === "kaggle" ? "Kaggle Medical Dataset" : "AI Fallback"}
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary-glow/80 mb-2">
                      Recommended precautions
                    </p>
                    <ul className="grid sm:grid-cols-2 gap-2">
                      {m.data.precautions.map((p, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-sm text-foreground/90"
                        >
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: "var(--gradient-primary)" }}>
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
            <div className="flex justify-start animate-fade-up">
              <div className="rounded-2xl rounded-tl-sm glass-panel px-4 py-3 text-sm flex items-center gap-2 text-primary-glow">
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing your symptoms against medical database...
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={submit}
          className="border-t border-primary/20 bg-[#0A1628]/60 backdrop-blur-xl p-3 flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Describe your symptoms…"
            className="flex-1 rounded-xl border border-primary/30 bg-[#0A1628]/70 text-foreground placeholder:text-foreground/40 px-4 py-3 text-sm outline-none focus:border-primary-glow focus:ring-2 focus:ring-primary/40 focus:shadow-[0_0_18px_-2px_rgba(96,165,250,0.6)] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-glow inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.03] disabled:opacity-60 disabled:hover:scale-100"
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

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-500/10 backdrop-blur p-4 text-sm text-amber-200">
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
