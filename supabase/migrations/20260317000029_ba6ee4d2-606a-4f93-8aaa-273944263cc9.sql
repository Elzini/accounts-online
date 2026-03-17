
-- Add file_url column to invoices table for storing PDF reference
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Create storage bucket for invoice PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('invoice-files', 'invoice-files', true, 20971520, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- RLS for invoice files bucket
CREATE POLICY "Authenticated users can upload invoice files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoice-files');

CREATE POLICY "Authenticated users can read invoice files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'invoice-files');

CREATE POLICY "Authenticated users can delete own invoice files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'invoice-files');
