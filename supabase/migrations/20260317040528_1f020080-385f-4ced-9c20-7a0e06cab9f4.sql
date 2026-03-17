
-- Fix invoice-files bucket: replace permissive policies with company-isolated ones
DROP POLICY IF EXISTS "Authenticated users can read invoice files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload invoice files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own invoice files" ON storage.objects;

CREATE POLICY "Company-isolated view invoice files" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'invoice-files'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (
    SELECT p.company_id::text FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1
  )
);

CREATE POLICY "Company-isolated upload invoice files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'invoice-files'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (
    SELECT p.company_id::text FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1
  )
);

CREATE POLICY "Company-isolated delete invoice files" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'invoice-files'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (
    SELECT p.company_id::text FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1
  )
);

-- Fix greeting-cards bucket: add company isolation
DROP POLICY IF EXISTS "Public read access for greeting cards" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload greeting cards" ON storage.objects;

CREATE POLICY "Company-isolated view greeting cards" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'greeting-cards'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (
    SELECT p.company_id::text FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1
  )
);

CREATE POLICY "Company-isolated upload greeting cards" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'greeting-cards'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (
    SELECT p.company_id::text FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1
  )
);

CREATE POLICY "Company-isolated delete greeting cards" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'greeting-cards'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (
    SELECT p.company_id::text FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1
  )
);
