-- Fix views missing security_invoker = true
-- This ensures RLS on underlying tables is enforced for the calling user

ALTER VIEW public.bank_accounts_safe SET (security_invoker = true);
ALTER VIEW public.customers_safe SET (security_invoker = true);
ALTER VIEW public.employees_safe SET (security_invoker = true);
ALTER VIEW public.financing_companies_admin SET (security_invoker = true);
ALTER VIEW public.financing_companies_safe SET (security_invoker = true);
ALTER VIEW public.invoices_safe SET (security_invoker = true);
ALTER VIEW public.suppliers_safe SET (security_invoker = true);