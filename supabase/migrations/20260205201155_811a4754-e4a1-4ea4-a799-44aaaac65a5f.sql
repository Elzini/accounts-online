-- Drop any conflicting policies and recreate a clean public read policy
DROP POLICY IF EXISTS "Public read fiscal years for login" ON fiscal_years;

-- Create a clear policy for anonymous users to read fiscal years for login
CREATE POLICY "Public read fiscal years for login" 
ON fiscal_years 
FOR SELECT 
TO anon
USING (true);