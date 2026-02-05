-- Create storage bucket for session photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('session-photos', 'session-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to session-photos bucket
CREATE POLICY "Ambassadors can upload session photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'session-photos');

-- Allow public read access to session photos
CREATE POLICY "Public can view session photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'session-photos');
