-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view system and company variables" ON public.formula_variables;

-- Create a new policy that requires authentication for ALL access
-- System variables are shared templates, but still require login
CREATE POLICY "Authenticated users can view system and company variables"
ON public.formula_variables
FOR SELECT
TO authenticated
USING (
  -- System variables are visible to all authenticated users (shared templates)
  is_system = true
  OR
  -- Company-specific variables only visible to company members
  company_id = get_user_company_id(auth.uid())
);