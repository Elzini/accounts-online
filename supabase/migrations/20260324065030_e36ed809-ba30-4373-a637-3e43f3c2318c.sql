
-- Add security_barrier to all safe views for defense-in-depth
-- Views already have security_invoker = true, so base table RLS applies
-- security_barrier prevents optimizer from leaking data through pushed-down predicates

ALTER VIEW public.bank_accounts_safe SET (security_barrier = true);
ALTER VIEW public.customers_safe SET (security_barrier = true);
ALTER VIEW public.employees_safe SET (security_barrier = true);
ALTER VIEW public.hr_employees_safe SET (security_barrier = true);
ALTER VIEW public.financing_companies_safe SET (security_barrier = true);
ALTER VIEW public.financing_companies_admin SET (security_barrier = true);
ALTER VIEW public.invoices_safe SET (security_barrier = true);
ALTER VIEW public.suppliers_safe SET (security_barrier = true);
