-- Create storage bucket for event photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-photos', 'event-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to event-photos bucket
CREATE POLICY "Organizers and collaborators can upload event photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-photos');

-- Allow public read access to event photos
CREATE POLICY "Public can view event photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-photos');

-- Allow users to delete their own event photos
CREATE POLICY "Organizers can delete event photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'event-photos');
