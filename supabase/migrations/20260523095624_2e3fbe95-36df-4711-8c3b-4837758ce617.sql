
CREATE TABLE public.diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  symptoms TEXT NOT NULL,
  disease TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high')),
  precautions JSONB NOT NULL DEFAULT '[]'::jsonb,
  age_group TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;

-- Public can insert and read (it's an anonymous health tool; dashboards read aggregate data)
CREATE POLICY "Anyone can insert diagnoses" ON public.diagnoses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read diagnoses" ON public.diagnoses FOR SELECT USING (true);

CREATE INDEX idx_diagnoses_created_at ON public.diagnoses(created_at DESC);
CREATE INDEX idx_diagnoses_session ON public.diagnoses(session_id);
CREATE INDEX idx_diagnoses_disease ON public.diagnoses(disease);
