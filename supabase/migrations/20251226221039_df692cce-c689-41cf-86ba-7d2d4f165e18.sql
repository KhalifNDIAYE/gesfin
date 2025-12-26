-- Fix: Restrict avatar storage bucket access to authenticated users only
-- This addresses STORAGE_EXPOSURE security finding

-- Drop the public policy that allows unauthenticated access
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Create new policy that restricts viewing to authenticated users only
CREATE POLICY "Authenticated users can view avatars"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars');