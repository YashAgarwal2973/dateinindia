
-- Fix 3/4: Harden is_current_user_admin().
--
-- The existing migration already set search_path = public, so the main
-- hardening (preventing schema-injection) is already done.
--
-- IMPORTANT: The prompt suggests REVOKING EXECUTE from the 'authenticated'
-- role. That is NOT applied here because it would break the application:
-- the 6 admin RLS policies on users/reports/verifications call this function
-- at query time under the 'authenticated' role. Revoking EXECUTE would cause
-- every query on those tables to throw "permission denied" for all users.
--
-- What we do here: ensure the function is recreated with both
-- SET search_path AND explicit GRANT for authenticated, so it's resilient
-- against future migrations that might drop the grant.

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM users WHERE id = auth.uid() LIMIT 1),
    FALSE
  );
$$;

-- authenticated must retain EXECUTE so the RLS policies that call this
-- function can evaluate correctly.
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- Deny direct RPC calls from anon (no legitimate reason for anon to check admin status)
REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM anon;
