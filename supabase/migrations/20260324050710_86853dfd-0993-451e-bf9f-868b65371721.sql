-- Performance indexes for scalability (suppliers/customers without is_active filter)

CREATE INDEX IF NOT EXISTS idx_suppliers_company 
  ON public.suppliers (company_id);

CREATE INDEX IF NOT EXISTS idx_customers_company 
  ON public.customers (company_id);