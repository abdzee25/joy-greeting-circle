DROP POLICY IF EXISTS "Anyone can insert diagnoses" ON public.diagnoses;
DROP POLICY IF EXISTS "Anyone can read diagnoses" ON public.diagnoses;

REVOKE ALL ON public.diagnoses FROM anon;
REVOKE ALL ON public.diagnoses FROM authenticated;
GRANT ALL ON public.diagnoses TO service_role;

ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;