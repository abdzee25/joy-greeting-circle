import { listDiagnoses } from "./diagnoses.functions";

export type DiagnosisRow = {
  id: string;
  session_id: string;
  symptoms: string;
  disease: string;
  description: string;
  severity: "low" | "medium" | "high";
  precautions: string[];
  age_group: string | null;
  created_at: string;
};

export async function fetchAllDiagnoses(): Promise<DiagnosisRow[]> {
  const data = await listDiagnoses();
  return data as DiagnosisRow[];
}