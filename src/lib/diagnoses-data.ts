import { supabase } from "@/integrations/supabase/client";

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
  const { data, error } = await supabase
    .from("diagnoses")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? []) as DiagnosisRow[];
}