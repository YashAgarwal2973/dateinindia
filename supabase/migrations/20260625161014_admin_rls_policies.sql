-- Security-definer helper avoids recursive RLS when checking admin status
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM users WHERE id = auth.uid() LIMIT 1),
    FALSE
  );
$$;

-- Admin can read ALL users (including suspended)
CREATE POLICY "users_select_admin" ON users
  FOR SELECT TO authenticated
  USING (is_current_user_admin());

-- Admin can update any user (ban, unban, trust score)
CREATE POLICY "users_update_admin" ON users
  FOR UPDATE TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Admin can read all reports
CREATE POLICY "reports_select_admin" ON reports
  FOR SELECT TO authenticated
  USING (is_current_user_admin());

-- Admin can update reports (resolve/dismiss + set moderator fields)
CREATE POLICY "reports_update_admin" ON reports
  FOR UPDATE TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Admin can read all verifications
CREATE POLICY "verifications_select_admin" ON verifications
  FOR SELECT TO authenticated
  USING (is_current_user_admin());

-- Admin can update verifications (approve/fail)
CREATE POLICY "verifications_update_admin" ON verifications
  FOR UPDATE TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());
