-- Fix hr_employees_safe to use SECURITY INVOKER instead of default SECURITY DEFINER
ALTER VIEW public.hr_employees_safe SET (security_invoker = on);