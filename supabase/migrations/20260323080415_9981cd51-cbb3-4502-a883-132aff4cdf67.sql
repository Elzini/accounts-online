
CREATE OR REPLACE FUNCTION public.get_all_company_stats()
RETURNS TABLE(
  company_id uuid,
  users_count bigint,
  cars_count bigint,
  sales_count bigint,
  customers_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id AS company_id,
    (SELECT count(*) FROM profiles p WHERE p.company_id = c.id) AS users_count,
    (SELECT count(*) FROM cars ca WHERE ca.company_id = c.id) AS cars_count,
    (SELECT count(*) FROM sales s WHERE s.company_id = c.id) AS sales_count,
    (SELECT count(*) FROM customers cu WHERE cu.company_id = c.id) AS customers_count
  FROM companies c;
$$;
