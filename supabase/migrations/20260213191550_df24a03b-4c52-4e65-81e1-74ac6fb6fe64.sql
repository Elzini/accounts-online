
-- Fix: The strict_isolation policy on app_settings allows anon to read company_id IS NULL rows
-- This exposes 11 global settings to unauthenticated users
-- The public-auth-settings edge function already handles public access to cosmetic settings safely

-- Drop the overly permissive strict_isolation policy
DROP POLICY IF EXISTS "strict_isolation" ON public.app_settings;

-- Recreate with authentication requirement
CREATE POLICY "strict_isolation_authenticated"
ON public.app_settings
FOR ALL
USING (
  auth.uid() IS NOT NULL 
  AND (
    (company_id IS NULL) 
    OR strict_company_check(company_id)
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (
    (company_id IS NULL) 
    OR strict_company_check(company_id)
  )
);

-- Also revoke direct anon access to the table
REVOKE ALL ON public.app_settings FROM anon;
