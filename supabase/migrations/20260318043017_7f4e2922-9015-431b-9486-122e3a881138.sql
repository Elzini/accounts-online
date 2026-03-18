
-- Fix storage RLS for journal-attachments to support super_admin
DROP POLICY IF EXISTS "Company-isolated upload journal attachments" ON storage.objects;
CREATE POLICY "Company-isolated upload journal attachments" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'journal-attachments' AND auth.uid() IS NOT NULL AND (
    (storage.foldername(name))[1] = (SELECT p.company_id::text FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1)
    OR public.is_super_admin(auth.uid())
  )
);

DROP POLICY IF EXISTS "Company-isolated view journal attachments" ON storage.objects;
CREATE POLICY "Company-isolated view journal attachments" ON storage.objects FOR SELECT
USING (
  bucket_id = 'journal-attachments' AND auth.uid() IS NOT NULL AND (
    (storage.foldername(name))[1] = (SELECT p.company_id::text FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1)
    OR public.is_super_admin(auth.uid())
  )
);

DROP POLICY IF EXISTS "Company-isolated delete journal attachments" ON storage.objects;
CREATE POLICY "Company-isolated delete journal attachments" ON storage.objects FOR DELETE
USING (
  bucket_id = 'journal-attachments' AND auth.uid() IS NOT NULL AND (
    (storage.foldername(name))[1] = (SELECT p.company_id::text FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1)
    OR public.is_super_admin(auth.uid())
  )
);
