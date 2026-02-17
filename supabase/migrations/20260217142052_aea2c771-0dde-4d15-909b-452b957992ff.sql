
INSERT INTO storage.buckets (id, name, public) 
VALUES ('greeting-cards', 'greeting-cards', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for greeting cards"
ON storage.objects FOR SELECT
USING (bucket_id = 'greeting-cards');

CREATE POLICY "Authenticated users can upload greeting cards"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'greeting-cards' AND auth.role() = 'authenticated');
