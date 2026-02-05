-- Add fields for member approval workflow
-- Ambassadors need to upload a screenshot of conversation and add notes when approving members

ALTER TABLE club_members
ADD COLUMN IF NOT EXISTS approval_screenshot_url TEXT,
ADD COLUMN IF NOT EXISTS approval_notes TEXT,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);

-- Create storage bucket for member approval screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('member-approvals', 'member-approvals', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to member-approvals bucket
CREATE POLICY "Ambassadors can upload approval screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'member-approvals');

-- Allow public read access to approval screenshots
CREATE POLICY "Public can view approval screenshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'member-approvals');
