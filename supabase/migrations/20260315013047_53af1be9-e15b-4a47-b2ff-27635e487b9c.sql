
-- Remove the overly permissive policies on backups table
DROP POLICY IF EXISTS "strict_isolation" ON backups;
DROP POLICY IF EXISTS "Company isolation select" ON backups;
