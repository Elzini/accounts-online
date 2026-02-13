
-- Make journal-attachments bucket private
UPDATE storage.buckets SET public = false WHERE id = 'journal-attachments';

-- Drop the permissive public select policy
DROP POLICY IF EXISTS "Anyone can view journal attachments" ON storage.objects;

-- Create authenticated company-scoped select policy
CREATE POLICY "Authenticated users can view journal attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'journal-attachments'
  AND auth.uid() IS NOT NULL
);
