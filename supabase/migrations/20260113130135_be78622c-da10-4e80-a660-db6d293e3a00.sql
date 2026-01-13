-- Create a public bucket for app logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('app-logos', 'app-logos', true);

-- Allow anyone to view logos (public bucket)
CREATE POLICY "Anyone can view app logos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'app-logos');

-- Allow authenticated users to upload logos
CREATE POLICY "Authenticated users can upload logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'app-logos' AND auth.role() = 'authenticated');

-- Allow authenticated users to update logos
CREATE POLICY "Authenticated users can update logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'app-logos' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete logos
CREATE POLICY "Authenticated users can delete logos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'app-logos' AND auth.role() = 'authenticated');