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
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-90"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_50%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 sm:py-28 text-primary-foreground">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Aligned with SDG 3 · Vision 2030
            </div>
            <h1 className="mt-5 text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
              Your AI Health Companion
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-white/90 max-w-2xl">
              Describe your symptoms and get an instant preliminary assessment, severity score, and
              precautions — backed by AI and built for everyone.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/user"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary shadow-[var(--shadow-elegant)] transition-transform hover:scale-[1.02]"
              >
                <Stethoscope className="h-4 w-4" /> Start Symptom Check
              </Link>
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                <BarChart3 className="h-4 w-4" /> Admin Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
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
              className="group rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-card-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              <span className="mt-4 inline-flex text-sm font-medium text-primary group-hover:underline">
                {f.label} →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
