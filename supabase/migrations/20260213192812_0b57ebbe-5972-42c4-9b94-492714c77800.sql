
-- Fix storage buckets: Add company isolation to attachments and journal-attachments
-- Using folder-based isolation pattern (same as tenant-* buckets)
-- File path structure: {companyId}/{entityId}/{timestamp}.{ext}

-- Drop old permissive policies for 'attachments' bucket
DROP POLICY IF EXISTS "Users can view attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete attachments" ON storage.objects;

-- Create company-isolated policies for 'attachments' bucket
CREATE POLICY "Company-isolated view attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'attachments'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (
    SELECT p.company_id::text FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1
  )
);

CREATE POLICY "Company-isolated upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attachments'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (
    SELECT p.company_id::text FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1
  )
);

CREATE POLICY "Company-isolated delete attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'attachments'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (
    SELECT p.company_id::text FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1
  )
);

-- Drop old permissive policies for 'journal-attachments' bucket
DROP POLICY IF EXISTS "Authenticated users can view journal attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload journal attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete journal attachments" ON storage.objects;

-- Create company-isolated policies for 'journal-attachments' bucket
CREATE POLICY "Company-isolated view journal attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'journal-attachments'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (
    SELECT p.company_id::text FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1
  )
);

CREATE POLICY "Company-isolated upload journal attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'journal-attachments'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (
    SELECT p.company_id::text FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1
  )
);

CREATE POLICY "Company-isolated delete journal attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'journal-attachments'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (
    SELECT p.company_id::text FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1
  )
);
