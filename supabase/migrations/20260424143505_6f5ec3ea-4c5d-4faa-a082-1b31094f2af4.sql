-- 1. Create new "Purchases" account (5113) for restaurant company
INSERT INTO public.account_categories (id, company_id, code, name, type, parent_id, is_system)
SELECT gen_random_uuid(), 'e42e2978-014c-4f23-8f95-8ef482648cdc', '5113', 'مشتريات مواد غذائية', 'expense',
       (SELECT id FROM public.account_categories WHERE company_id='e42e2978-014c-4f23-8f95-8ef482648cdc' AND code='51' LIMIT 1),
       false
WHERE NOT EXISTS (
  SELECT 1 FROM public.account_categories WHERE company_id='e42e2978-014c-4f23-8f95-8ef482648cdc' AND code='5113'
);

-- 2. Update purchase_expense mapping to point to the new account
UPDATE public.account_mappings
   SET account_id = (SELECT id FROM public.account_categories WHERE company_id='e42e2978-014c-4f23-8f95-8ef482648cdc' AND code='5113' LIMIT 1),
       updated_at = now()
 WHERE company_id='e42e2978-014c-4f23-8f95-8ef482648cdc'
   AND mapping_key='purchase_expense';