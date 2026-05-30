const BASE = "https://raw.githubusercontent.com/abdzee25/joy-greeting-circle/main/public";
const URLS = {
  description: `${BASE}/symptom_Description.csv`,
  precaution: `${BASE}/symptom_precaution.csv`,
  severity: `${BASE}/Symptom-severity.csv`,
};

type Cache = {
  descriptions: Map<string, string>;
  precautions: Map<string, string[]>;
  severity: Map<string, number>;
};

let cache: Cache | null = null;
let loading: Promise<Cache> | null = null;

// Parse a single CSV line respecting double-quoted fields.
function parseLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { out.push(cur); cur = ""; }
      else cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    rows.push(parseLine(line));
  }
  return rows;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

async function loadCache(): Promise<Cache> {
  const [dRes, pRes, sRes] = await Promise.all([
    fetch(URLS.description),
    fetch(URLS.precaution),
    fetch(URLS.severity),
  ]);
  if (!dRes.ok || !pRes.ok || !sRes.ok) {
    throw new Error("Failed to fetch dataset CSVs");
  }
  const [dTxt, pTxt, sTxt] = await Promise.all([dRes.text(), pRes.text(), sRes.text()]);

  const descriptions = new Map<string, string>();
  const dRows = parseCsv(dTxt);
  for (let i = 1; i < dRows.length; i++) {
    const [disease, desc] = dRows[i];
    if (disease) descriptions.set(norm(disease), desc ?? "");
  }

  const precautions = new Map<string, string[]>();
  const pRows = parseCsv(pTxt);
  for (let i = 1; i < pRows.length; i++) {
    const [disease, p1, p2, p3, p4] = pRows[i];
    if (disease) {
      precautions.set(
        norm(disease),
        [p1, p2, p3, p4].map((x) => (x ?? "").trim()).filter(Boolean),
      );
    }
  }

  const severity = new Map<string, number>();
  const sRows = parseCsv(sTxt);
  for (let i = 1; i < sRows.length; i++) {
    const [sym, w] = sRows[i];
    if (sym) {
      const n = Number(w);
      if (!Number.isNaN(n)) severity.set(norm(sym), n);
    }
  }

  return { descriptions, precautions, severity };
}

export async function getDataset(): Promise<Cache> {
  if (cache) return cache;
  if (!loading) loading = loadCache().then((c) => (cache = c));
  return loading;
}

export function lookupDescription(c: Cache, disease: string): string | null {
  const key = norm(disease);
  if (c.descriptions.has(key)) return c.descriptions.get(key)!;
  // Fuzzy: try contains match.
  for (const [k, v] of c.descriptions) {
    if (k.includes(key) || key.includes(k)) return v;
  }
  return null;
}

export function lookupPrecautions(c: Cache, disease: string): string[] | null {
  const key = norm(disease);
  if (c.precautions.has(key)) return c.precautions.get(key)!;
  for (const [k, v] of c.precautions) {
    if (k.includes(key) || key.includes(k)) return v;
  }
  return null;
}

// Compute severity score from user symptom text by summing weights of any
// known symptom tokens that appear in the text.
export function computeSeverity(
  c: Cache,
  symptomsText: string,
): { score: number; level: "low" | "medium" | "high"; matched: string[] } {
  const text = " " + norm(symptomsText) + " ";
  let score = 0;
  const matched: string[] = [];
  for (const [sym, w] of c.severity) {
    // sym is already normalized like "high fever"
    if (text.includes(" " + sym + " ")) {
      score += w;
      matched.push(sym);
      continue;
    }
    // also try matching individual significant tokens (length > 3)
    const tokens = sym.split(" ").filter((t) => t.length > 3);
    if (tokens.length && tokens.every((t) => text.includes(" " + t + " "))) {
      score += w;
      matched.push(sym);
    }
  }
  let level: "low" | "medium" | "high" = "low";
  if (score >= 13) level = "high";
  else if (score >= 6) level = "medium";
  return { score, level, matched };
}