
-- Enable RLS on expenses table
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Select: users can only see expenses for their company
CREATE POLICY "Users can view own company expenses"
ON public.expenses FOR SELECT TO authenticated
USING (
  company_id IN (
    SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
  )
);

-- Insert: users can only insert expenses for their company
CREATE POLICY "Users can insert own company expenses"
ON public.expenses FOR INSERT TO authenticated
WITH CHECK (
  company_id IN (
    SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
  )
);

-- Update: users can only update expenses for their company
CREATE POLICY "Users can update own company expenses"
ON public.expenses FOR UPDATE TO authenticated
USING (
  company_id IN (
    SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
  )
);

-- Delete: users can only delete expenses for their company
CREATE POLICY "Users can delete own company expenses"
ON public.expenses FOR DELETE TO authenticated
USING (
  company_id IN (
    SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
  )
);

-- Also enable RLS on expense_categories
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company expense categories"
ON public.expense_categories FOR SELECT TO authenticated
USING (
  company_id IN (
    SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
  )
);

CREATE POLICY "Users can insert own company expense categories"
ON public.expense_categories FOR INSERT TO authenticated
WITH CHECK (
  company_id IN (
    SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
  )
);

CREATE POLICY "Users can update own company expense categories"
ON public.expense_categories FOR UPDATE TO authenticated
USING (
  company_id IN (
    SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
  )
);

CREATE POLICY "Users can delete own company expense categories"
ON public.expense_categories FOR DELETE TO authenticated
USING (
  company_id IN (
    SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
  )
);
