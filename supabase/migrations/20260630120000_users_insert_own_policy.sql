
-- Allow authenticated users to insert their own row in public.users.
-- Previously no INSERT policy existed; profile creation was handled exclusively
-- via service-role edge functions (verify-magic-link). With email+password
-- signup, clients now create the profile row directly after signUp using
-- their own JWT, so auth.uid() = id is sufficient to lock it to self.
CREATE POLICY "users_insert_own" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
