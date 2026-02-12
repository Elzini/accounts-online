
-- Drop the text overload that causes ambiguity
DROP FUNCTION IF EXISTS public.strict_company_check(text);
