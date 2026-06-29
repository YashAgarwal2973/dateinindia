
-- Consent logging table for DPDP Act 2023 compliance.
-- Records explicit user consent before Aadhaar OKYC and other sensitive operations.
CREATE TABLE IF NOT EXISTS consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type text NOT NULL CHECK (consent_type IN ('aadhaar_okyc', 'terms', 'privacy')),
  consented_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consents_insert_own" ON consents
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "consents_select_own" ON consents
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
