import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Brain, BarChart3, Building2, ShieldCheck, Stethoscope } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HealthGuard AI — Your AI Health Companion" },
      {
        name: "description",
        content:
          "AI-powered preliminary health assessment aligned with SDG 3 and Pakistan's Vision 2030. Symptom analysis, analytics, and reporting for users, hospitals and NGOs.",
      },
      { property: "og:title", content: "HealthGuard AI — Your AI Health Companion" },
      { property: "og:description", content: "AI-powered preliminary health assessment for everyone." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div>
      <section className="relative overflow-hidden bg-hero-gradient">
        {/* Animated radial glow */}
        <div
          className="absolute inset-0 -z-10 animate-gradient opacity-80"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.35), transparent 55%), radial-gradient(circle at 80% 80%, rgba(96,165,250,0.30), transparent 55%)",
          }}
        />
        {/* Grid pattern */}
        <div className="absolute inset-0 -z-10 bg-grid opacity-60" />
        {/* Floating particles */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          {[...Array(14)].map((_, i) => (
            <span
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full bg-primary-glow/70 animate-float"
              style={{
                left: `${(i * 7.3) % 100}%`,
                top: `${(i * 11.7) % 90}%`,
                animationDelay: `${(i % 6) * 0.7}s`,
                animationDuration: `${6 + (i % 5)}s`,
                boxShadow: "0 0 12px 2px rgba(96,165,250,0.7)",
              }}
            />
          ))}
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-24 sm:py-32 text-foreground relative">
          <div className="max-w-3xl animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full glass-panel px-3 py-1 text-xs font-medium text-primary-glow">
              <ShieldCheck className="h-3.5 w-3.5" />
              Aligned with SDG 3 · Vision 2030
            </div>
            <div className="mt-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl btn-glow animate-heartbeat">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <span className="text-sm uppercase tracking-[0.3em] text-primary-glow/80">HealthGuard AI</span>
            </div>
            <h1 className="mt-6 text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.02] text-gradient">
              Your AI Health<br />Companion
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-foreground/80 max-w-2xl">
              Describe your symptoms and get an instant preliminary assessment, severity score, and
              precautions — backed by AI and built for everyone.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/user"
                className="btn-glow inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
              >
                <Stethoscope className="h-4 w-4" /> Start Diagnosis
              </Link>
              <Link
                to="/admin"
                className="glass-panel inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-foreground transition-all hover:glow-border hover:text-primary-glow"
              >
                <BarChart3 className="h-4 w-4" /> Admin Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20 relative">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Brain,
              title: "AI Symptom Analysis",
              desc: "Chat-style symptom checker that returns disease, severity, and 4 actionable precautions.",
              to: "/user",
              label: "Open user dashboard",
            },
            {
              icon: BarChart3,
              title: "Admin Analytics",
              desc: "Track top diseases, daily usage trends, and full diagnosis records with CSV export.",
              to: "/admin",
              label: "Open admin dashboard",
            },
            {
              icon: Building2,
              title: "Client Reporting",
              desc: "Organization summaries, age distribution, and downloadable PDF reports for hospitals & NGOs.",
              to: "/client",
              label: "Open client dashboard",
            },
          ].map((f) => (
            <Link
              key={f.title}
              to={f.to}
              className="group glass-panel relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-2 hover:glow-border"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-glow/70 to-transparent" />
              <div
                className="flex h-14 w-14 items-center justify-center rounded-xl text-white shadow-[var(--shadow-glow)]"
                style={{ background: "var(--gradient-primary)" }}
              >
                <f.icon className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              <span className="mt-5 inline-flex text-sm font-medium text-primary-glow transition-transform group-hover:translate-x-1">
                {f.label} →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
