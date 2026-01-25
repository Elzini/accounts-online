-- Fix logo storage policies: Restrict write access to admins only
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete logos" ON storage.objects;

-- Create admin-only policies using the existing is_admin function
CREATE POLICY "Only admins can upload logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'app-logos' AND 
  is_admin(auth.uid())
);

CREATE POLICY "Only admins can update logos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'app-logos' AND 
  is_admin(auth.uid())
);

CREATE POLICY "Only admins can delete logos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'app-logos' AND 
  is_admin(auth.uid())
);