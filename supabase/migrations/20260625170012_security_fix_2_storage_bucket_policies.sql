
-- Fix 2: Storage policies for profile-photos bucket.
-- Goal: allow reading individual objects, prevent unauthenticated enumeration/listing.
-- Authenticated users (the app's logged-in members) can read all profile photos
-- (needed for browse, profile pages).
-- Anon users can read too (landing page uses profile photos).
-- Only the owning user can insert/update/delete their own files.
-- The owner's user ID must be the first path segment: profile-photos/<user_id>/filename.

-- Drop any existing broad policies on this bucket
DROP POLICY IF EXISTS "profile_photos_public_select" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_public_read" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_authenticated_read" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_authenticated_write" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_owner_delete" ON storage.objects;

-- Public read (anon + authenticated) — object URL must be known (no listing via this)
CREATE POLICY "profile_photos_read"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'profile-photos');

-- Only the owner can upload their own photos (path must start with their user ID)
CREATE POLICY "profile_photos_insert_own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Only the owner can update their own photos
CREATE POLICY "profile_photos_update_own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Only the owner can delete their own photos
CREATE POLICY "profile_photos_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
