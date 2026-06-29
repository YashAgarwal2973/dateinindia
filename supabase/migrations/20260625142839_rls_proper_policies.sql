
-- ============================================================
-- Drop all open "allow_all" policies and replace with proper
-- per-table RLS policies keyed on auth.uid() (JWT sub claim).
-- ============================================================

-- ── users ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all_users" ON users;

-- Any authenticated user can read non-suspended profiles (browse/search).
-- A suspended user can still read their own row.
CREATE POLICY "users_select" ON users
  FOR SELECT TO authenticated
  USING (is_suspended = false OR auth.uid() = id);

-- No direct INSERT from client — handled via service-role edge function.
-- UPDATE own row only.
CREATE POLICY "users_update_own" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- No DELETE — use is_suspended instead.


-- ── photos ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all_photos" ON photos;

-- Photos are public (needed for browse, profile pages, landing).
CREATE POLICY "photos_select_public" ON photos
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "photos_insert_own" ON photos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "photos_update_own" ON photos
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "photos_delete_own" ON photos
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);


-- ── verifications ────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all_verifications" ON verifications;

CREATE POLICY "verifications_select_own" ON verifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "verifications_insert_own" ON verifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "verifications_update_own" ON verifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ── likes ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all_likes" ON likes;

-- A user can see likes they sent or received (needed for match detection).
CREATE POLICY "likes_select_participant" ON likes
  FOR SELECT TO authenticated
  USING (auth.uid() = liker_id OR auth.uid() = liked_id);

CREATE POLICY "likes_insert_own" ON likes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = liker_id);

CREATE POLICY "likes_delete_own" ON likes
  FOR DELETE TO authenticated
  USING (auth.uid() = liker_id);


-- ── matches ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all_matches" ON matches;

CREATE POLICY "matches_select_participant" ON matches
  FOR SELECT TO authenticated
  USING (auth.uid() = user_1_id OR auth.uid() = user_2_id);

-- Client creates matches on mutual like (browse page upsert).
CREATE POLICY "matches_insert_participant" ON matches
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_1_id OR auth.uid() = user_2_id);

CREATE POLICY "matches_update_participant" ON matches
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_1_id OR auth.uid() = user_2_id)
  WITH CHECK (auth.uid() = user_1_id OR auth.uid() = user_2_id);


-- ── messages ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all_messages" ON messages;

-- Must be a participant in the match to read messages.
CREATE POLICY "messages_select_participant" ON messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = messages.match_id
        AND (m.user_1_id = auth.uid() OR m.user_2_id = auth.uid())
    )
  );

-- Must be participant and sender.
CREATE POLICY "messages_insert_participant" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = messages.match_id
        AND (m.user_1_id = auth.uid() OR m.user_2_id = auth.uid())
    )
  );

-- Participants can update (mark read, block flag) — not delete.
CREATE POLICY "messages_update_participant" ON messages
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = messages.match_id
        AND (m.user_1_id = auth.uid() OR m.user_2_id = auth.uid())
    )
  );


-- ── reports ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all_reports" ON reports;

CREATE POLICY "reports_select_own" ON reports
  FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "reports_insert_own" ON reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);


-- ── blocks ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all_blocks" ON blocks;

CREATE POLICY "blocks_select_own" ON blocks
  FOR SELECT TO authenticated
  USING (auth.uid() = blocker_id);

CREATE POLICY "blocks_insert_own" ON blocks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "blocks_delete_own" ON blocks
  FOR DELETE TO authenticated
  USING (auth.uid() = blocker_id);


-- ── subscriptions ────────────────────────────────────────────
-- Only service role writes (payment webhooks). Clients read own.
DROP POLICY IF EXISTS "allow_all_subscriptions" ON subscriptions;

CREATE POLICY "subscriptions_select_own" ON subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);


-- ── otp_codes ────────────────────────────────────────────────
-- Fully locked — only the verify-otp edge function (service role) touches this.
DROP POLICY IF EXISTS "allow_all_otp" ON otp_codes;


-- ── sessions ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all_sessions" ON sessions;

CREATE POLICY "sessions_select_own" ON sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "sessions_delete_own" ON sessions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);


-- ── boosts ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all_boosts" ON boosts;

CREATE POLICY "boosts_select_own" ON boosts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);


-- ── transparency_reports ─────────────────────────────────────
-- Public read (published only). No client writes.
DROP POLICY IF EXISTS "allow_all_transparency" ON transparency_reports;

CREATE POLICY "transparency_select_published" ON transparency_reports
  FOR SELECT TO anon, authenticated
  USING (published_at IS NOT NULL AND published_at <= NOW());
