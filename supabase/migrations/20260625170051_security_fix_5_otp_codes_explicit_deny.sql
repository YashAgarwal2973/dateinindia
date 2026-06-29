
-- Fix 5: Explicit deny-all client policy on otp_codes.
--
-- RLS is already enabled with no policies on this table (the existing migration
-- dropped the allow_all policy and added nothing), so the implicit default is
-- already deny-all for clients. This explicit policy makes the intent clear and
-- prevents any future accidental grant from opening access.
--
-- Edge functions use SUPABASE_SERVICE_ROLE_KEY which bypasses RLS entirely,
-- so OTP operations continue to work normally.

DROP POLICY IF EXISTS "otp_codes_deny_client_access" ON otp_codes;
DROP POLICY IF EXISTS "otp_codes_deny_all" ON otp_codes;

CREATE POLICY "otp_codes_no_client_access"
ON otp_codes
FOR ALL
TO authenticated, anon
USING (FALSE)
WITH CHECK (FALSE);
