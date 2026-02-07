
-- Fix the check constraint on account_categories to accept both singular and plural forms
-- The coa_templates use singular: asset, liability, equity, revenue, expense
-- The account_categories constraint expects plural: assets, liabilities, equity, revenue, expenses
-- We need to accept BOTH to handle existing data + new template insertions

ALTER TABLE public.account_categories DROP CONSTRAINT account_categories_type_check;

ALTER TABLE public.account_categories ADD CONSTRAINT account_categories_type_check 
  CHECK (type IN ('asset', 'assets', 'liability', 'liabilities', 'equity', 'revenue', 'expense', 'expenses'));
