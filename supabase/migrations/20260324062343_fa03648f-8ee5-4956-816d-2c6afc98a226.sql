
DROP POLICY IF EXISTS "Users can view tax rules for their company" ON public.tax_rules;
DROP POLICY IF EXISTS "Users can manage tax rules for their company" ON public.tax_rules;

CREATE POLICY "Users can view tax rules for their company"
ON public.tax_rules FOR SELECT TO authenticated
USING (
  company_id IN (
    SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage tax rules for their company"
ON public.tax_rules FOR ALL TO authenticated
USING (
  company_id IN (
    SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid()
  )
)
WITH CHECK (
  company_id IN (
    SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid()
  )
);
