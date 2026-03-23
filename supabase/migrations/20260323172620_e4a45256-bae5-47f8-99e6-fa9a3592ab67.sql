
-- Fix expense_categories policies
DROP POLICY "Users can delete own company expense categories" ON public.expense_categories;
DROP POLICY "Users can insert own company expense categories" ON public.expense_categories;
DROP POLICY "Users can update own company expense categories" ON public.expense_categories;
DROP POLICY "Users can view own company expense categories" ON public.expense_categories;

CREATE POLICY "Users can view own company expense categories" ON public.expense_categories FOR SELECT TO authenticated
  USING (company_id IN (SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()));
CREATE POLICY "Users can insert own company expense categories" ON public.expense_categories FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()));
CREATE POLICY "Users can update own company expense categories" ON public.expense_categories FOR UPDATE TO authenticated
  USING (company_id IN (SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()));
CREATE POLICY "Users can delete own company expense categories" ON public.expense_categories FOR DELETE TO authenticated
  USING (company_id IN (SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()));

-- Fix expenses policies
DROP POLICY "Users can delete own company expenses" ON public.expenses;
DROP POLICY "Users can insert own company expenses" ON public.expenses;
DROP POLICY "Users can update own company expenses" ON public.expenses;
DROP POLICY "Users can view own company expenses" ON public.expenses;

CREATE POLICY "Users can view own company expenses" ON public.expenses FOR SELECT TO authenticated
  USING (company_id IN (SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()));
CREATE POLICY "Users can insert own company expenses" ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()));
CREATE POLICY "Users can update own company expenses" ON public.expenses FOR UPDATE TO authenticated
  USING (company_id IN (SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()));
CREATE POLICY "Users can delete own company expenses" ON public.expenses FOR DELETE TO authenticated
  USING (company_id IN (SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()));
