-- Remove dangerous anon SELECT policy on supplier_portal_tokens
DROP POLICY IF EXISTS "supplier_portal_tokens_public_read" ON public.supplier_portal_tokens;

-- Fix customer_portal_tokens: replace 'public' role policies with 'authenticated' + strict_company_check
DROP POLICY IF EXISTS "portal_tokens_select" ON public.customer_portal_tokens;
DROP POLICY IF EXISTS "portal_tokens_insert" ON public.customer_portal_tokens;
DROP POLICY IF EXISTS "portal_tokens_update" ON public.customer_portal_tokens;
DROP POLICY IF EXISTS "portal_tokens_delete" ON public.customer_portal_tokens;

CREATE POLICY "customer_portal_tokens_select" ON public.customer_portal_tokens
  FOR SELECT TO authenticated USING (strict_company_check(company_id));

CREATE POLICY "customer_portal_tokens_insert" ON public.customer_portal_tokens
  FOR INSERT TO authenticated WITH CHECK (strict_company_check(company_id));

CREATE POLICY "customer_portal_tokens_update" ON public.customer_portal_tokens
  FOR UPDATE TO authenticated USING (strict_company_check(company_id)) WITH CHECK (strict_company_check(company_id));

CREATE POLICY "customer_portal_tokens_delete" ON public.customer_portal_tokens
  FOR DELETE TO authenticated USING (strict_company_check(company_id));

-- Create a secure function to validate portal tokens server-side
CREATE OR REPLACE FUNCTION public.validate_portal_token(p_token text, p_type text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF p_type = 'supplier' THEN
    SELECT jsonb_build_object(
      'valid', true,
      'company_id', t.company_id,
      'supplier_id', t.supplier_id,
      'supplier_name', t.supplier_name
    ) INTO result
    FROM supplier_portal_tokens t
    WHERE t.token = p_token AND t.is_active = true;
    
    IF result IS NOT NULL THEN
      UPDATE supplier_portal_tokens SET last_accessed_at = now() WHERE token = p_token;
    END IF;
  ELSIF p_type = 'customer' THEN
    SELECT jsonb_build_object(
      'valid', true,
      'company_id', t.company_id,
      'customer_id', t.customer_id
    ) INTO result
    FROM customer_portal_tokens t
    WHERE t.token = p_token AND t.is_active = true;
    
    IF result IS NOT NULL THEN
      UPDATE customer_portal_tokens SET last_accessed_at = now() WHERE token = p_token;
    END IF;
  END IF;
  
  RETURN COALESCE(result, jsonb_build_object('valid', false));
END;
$$;