import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { Loader2, Users, Stethoscope, TrendingUp, Download, Search } from "lucide-react";
import { toast } from "sonner";
import { PasswordGate } from "@/components/PasswordGate";
import { fetchAllDiagnoses, type DiagnosisRow } from "@/lib/diagnoses-data";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — HealthGuard AI" },
      { name: "description", content: "Analytics, top diseases, daily usage, and exportable records." },
    ],
  }),
  component: () => (
    <PasswordGate expected="admin123" title="Admin Dashboard">
      <AdminDashboard />
    </PasswordGate>
  ),
});

const COLORS = ["#1a73e8", "#4285f4", "#34a0d6", "#7eb8ff", "#a4c8ff", "#1565c0", "#0d47a1", "#5e9eff"];

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["diagnoses"],
    queryFn: fetchAllDiagnoses,
    refetchInterval: 15000,
  });
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const rows = data ?? [];
  const totals = useMemo(() => {
    const users = new Set(rows.map((r) => r.session_id)).size;
    const counts: Record<string, number> = {};
    rows.forEach((r) => (counts[r.disease] = (counts[r.disease] ?? 0) + 1));
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return { users, diagnoses: rows.length, topDisease: top?.[0] ?? "—" };
  }, [rows]);

  const topDiseases = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.forEach((r) => (counts[r.disease] = (counts[r.disease] ?? 0) + 1));
    return Object.entries(counts)
      .map(([disease, count]) => ({ disease, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [rows]);

  const symptomFreq = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.forEach((r) => {
      r.symptoms
        .toLowerCase()
        .split(/[\s,;.]+/)
        .filter((w) => w.length > 3)
        .forEach((w) => (counts[w] = (counts[w] ?? 0) + 1));
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [rows]);

  const dailyUsage = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.forEach((r) => {
      const d = new Date(r.created_at).toISOString().slice(0, 10);
      counts[d] = (counts[d] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([date, count]) => ({ date: date.slice(5), count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchesSearch = !search
        || r.disease.toLowerCase().includes(search.toLowerCase())
        || r.symptoms.toLowerCase().includes(search.toLowerCase());
      const matchesSev = severityFilter === "all" || r.severity === severityFilter;
      return matchesSearch && matchesSev;
    });
  }, [rows, search, severityFilter]);

  const exportCsv = () => {
    if (filtered.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = ["created_at", "disease", "severity", "symptoms", "description", "precautions"];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [
      headers.join(","),
      ...filtered.map((r: DiagnosisRow) =>
        [
          r.created_at,
          r.disease,
          r.severity,
          r.symptoms,
          r.description,
          (Array.isArray(r.precautions) ? r.precautions.join(" | ") : ""),
        ].map(escape).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `healthguard-diagnoses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading analytics…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform analytics and full diagnosis records.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Users" value={totals.users} icon={Users} />
        <StatCard label="Total Diagnoses" value={totals.diagnoses} icon={Stethoscope} />
        <StatCard label="Most Common Disease" value={totals.topDisease} icon={TrendingUp} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h3 className="font-semibold mb-4">Top 10 Detected Diseases</h3>
          {topDiseases.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topDiseases}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="disease" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1a73e8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h3 className="font-semibold mb-4">Symptom Frequency</h3>
          {symptomFreq.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={symptomFreq} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label>
                  {symptomFreq.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <h3 className="font-semibold mb-4">Daily Usage (last 14 days)</h3>
        {dailyUsage.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dailyUsage}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#1a73e8" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <h3 className="font-semibold">All Diagnoses</h3>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search disease or symptoms…"
                className="rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 w-64"
              />
            </div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="all">All severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>
        <div className="max-h-[500px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 sticky top-0">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Disease</th>
                <th className="px-4 py-3 font-semibold">Severity</th>
                <th className="px-4 py-3 font-semibold">Symptoms</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                    No records found.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium">{r.disease}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        r.severity === "high" ? "bg-rose-100 text-rose-700" :
                        r.severity === "medium" ? "bg-amber-100 text-amber-800" :
                        "bg-emerald-100 text-emerald-700"
                      }`}>
                        {r.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-md truncate">{r.symptoms}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
      No data yet — diagnoses will appear here.
    </div>
  );
}