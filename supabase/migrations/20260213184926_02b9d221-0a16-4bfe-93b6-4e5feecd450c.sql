
-- Enable RLS on employees table
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company employees"
ON public.employees FOR SELECT TO authenticated
USING (
  company_id IN (SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid())
);

CREATE POLICY "Users can insert own company employees"
ON public.employees FOR INSERT TO authenticated
WITH CHECK (
  company_id IN (SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid())
);

CREATE POLICY "Users can update own company employees"
ON public.employees FOR UPDATE TO authenticated
USING (
  company_id IN (SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid())
);

CREATE POLICY "Users can delete own company employees"
ON public.employees FOR DELETE TO authenticated
USING (
  company_id IN (SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid())
);
