
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE IF NOT EXISTS users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone                 VARCHAR(15) UNIQUE NOT NULL,
  email                 VARCHAR(255) UNIQUE,
  name                  VARCHAR(100) NOT NULL,
  date_of_birth         DATE NOT NULL CHECK (date_of_birth <= CURRENT_DATE - INTERVAL '18 years'),
  gender                VARCHAR(20) NOT NULL CHECK (gender IN ('man', 'woman', 'non_binary')),
  looking_for           VARCHAR(20) NOT NULL CHECK (looking_for IN ('men', 'women', 'everyone')),
  city                  VARCHAR(100) NOT NULL DEFAULT '',
  state                 VARCHAR(100) NOT NULL DEFAULT '',
  bio                   TEXT CHECK (char_length(bio) <= 500),
  occupation            VARCHAR(200),
  education             VARCHAR(50),
  income_range          VARCHAR(50),
  religion              VARCHAR(50),
  caste                 VARCHAR(100),
  mother_tongue         VARCHAR(50),
  height_cm             INTEGER CHECK (height_cm BETWEEN 100 AND 250),
  smoking               VARCHAR(20),
  drinking              VARCHAR(20),
  children              VARCHAR(50),
  relationship_goal     VARCHAR(50) NOT NULL DEFAULT 'not_sure' CHECK (relationship_goal IN ('serious', 'marriage', 'friendship', 'casual', 'not_sure')),
  want_children         VARCHAR(50),
  meeting_timeline      VARCHAR(50),
  interests             TEXT[] DEFAULT '{}',
  prompt_1_question     VARCHAR(200),
  prompt_1_answer       TEXT,
  prompt_2_question     VARCHAR(200),
  prompt_2_answer       TEXT,
  personality_answers   JSONB DEFAULT '{}',
  trust_score           INTEGER DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
  phone_verified        BOOLEAN DEFAULT FALSE,
  aadhaar_verified      BOOLEAN DEFAULT FALSE,
  selfie_verified       BOOLEAN DEFAULT FALSE,
  is_premium            BOOLEAN DEFAULT FALSE,
  premium_tier          VARCHAR(20),
  premium_expires_at    TIMESTAMPTZ,
  profile_complete_pct  INTEGER DEFAULT 0 CHECK (profile_complete_pct BETWEEN 0 AND 100),
  is_suspended          BOOLEAN DEFAULT FALSE,
  suspension_reason     TEXT,
  suspension_expires_at TIMESTAMPTZ,
  strike_count          INTEGER DEFAULT 0,
  is_admin              BOOLEAN DEFAULT FALSE,
  onboarding_step       INTEGER DEFAULT 1,
  onboarding_complete   BOOLEAN DEFAULT FALSE,
  last_active_at        TIMESTAMPTZ DEFAULT NOW(),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_users_state ON users(state);
CREATE INDEX IF NOT EXISTS idx_users_gender ON users(gender);
CREATE INDEX IF NOT EXISTS idx_users_looking_for ON users(looking_for);
CREATE INDEX IF NOT EXISTS idx_users_trust_score ON users(trust_score DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_phone_verified ON users(phone_verified);

-- Photos
CREATE TABLE IF NOT EXISTS photos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  storage_url     TEXT NOT NULL,
  cloudinary_id   TEXT,
  is_primary      BOOLEAN DEFAULT FALSE,
  ai_approved     BOOLEAN DEFAULT TRUE,
  ai_rejection_reason TEXT,
  display_order   INTEGER NOT NULL CHECK (display_order BETWEEN 1 AND 6),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_photos_primary ON photos(user_id) WHERE is_primary = TRUE;

-- Verifications
CREATE TABLE IF NOT EXISTS verifications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verification_type     VARCHAR(30) NOT NULL CHECK (verification_type IN ('phone', 'aadhaar', 'selfie')),
  status                VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'failed', 'expired')),
  provider              VARCHAR(50),
  provider_reference_id VARCHAR(200),
  failure_reason        TEXT,
  verified_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verifications_user_id ON verifications(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_verifications_type ON verifications(user_id, verification_type);

-- Likes
CREATE TABLE IF NOT EXISTS likes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  liked_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_super_like BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(liker_id, liked_id),
  CHECK (liker_id != liked_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_liker ON likes(liker_id);
CREATE INDEX IF NOT EXISTS idx_likes_liked ON likes(liked_id);

-- Matches
CREATE TABLE IF NOT EXISTS matches (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_1_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_2_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  compatibility_score       INTEGER,
  compatibility_explanation TEXT,
  icebreakers               TEXT[] DEFAULT '{}',
  is_active                 BOOLEAN DEFAULT TRUE,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_1_id, user_2_id),
  CHECK (user_1_id < user_2_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_user_1 ON matches(user_1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_2 ON matches(user_2_id);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id         UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content          TEXT,
  message_type     VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'voice', 'gif')),
  media_url        TEXT,
  is_read          BOOLEAN DEFAULT FALSE,
  is_blocked       BOOLEAN DEFAULT FALSE,
  block_reason     VARCHAR(100),
  toxicity_score   DECIMAL(4,3),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages(match_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id    UUID NOT NULL REFERENCES users(id),
  reported_id    UUID NOT NULL REFERENCES users(id),
  reason         VARCHAR(100) NOT NULL CHECK (reason IN (
                   'fake_profile', 'scam_fraud', 'harassment',
                   'explicit_photos', 'underage', 'escort_commercial',
                   'spam', 'other'
                 )),
  details        TEXT,
  evidence_urls  TEXT[] DEFAULT '{}',
  status         VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  moderator_id   UUID REFERENCES users(id),
  action_taken   VARCHAR(100),
  moderator_note TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  resolved_at    TIMESTAMPTZ,
  CHECK (reporter_id != reported_id)
);

CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at DESC);

-- Blocks
CREATE TABLE IF NOT EXISTS blocks (
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier                     VARCHAR(20) NOT NULL CHECK (tier IN ('basic', 'standard', 'trust')),
  billing_period           VARCHAR(10) NOT NULL CHECK (billing_period IN ('weekly', 'monthly')),
  amount_paise             INTEGER NOT NULL,
  razorpay_subscription_id VARCHAR(100),
  razorpay_payment_id      VARCHAR(100),
  status                   VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'failed')),
  starts_at                TIMESTAMPTZ NOT NULL,
  expires_at               TIMESTAMPTZ NOT NULL,
  auto_renew               BOOLEAN DEFAULT TRUE,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id, status);

-- Boosts
CREATE TABLE IF NOT EXISTS boosts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_boosts_expires ON boosts(user_id, expires_at);

-- Transparency Reports
CREATE TABLE IF NOT EXISTS transparency_reports (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_month           DATE NOT NULL UNIQUE,
  total_messages_scanned INTEGER DEFAULT 0,
  fake_profiles_removed  INTEGER DEFAULT 0,
  scam_accounts_banned   INTEGER DEFAULT 0,
  harassment_warnings    INTEGER DEFAULT 0,
  reports_assisted_law   INTEGER DEFAULT 0,
  avg_resolution_hours   DECIMAL(5,2),
  new_users              INTEGER DEFAULT 0,
  aadhaar_verified_count INTEGER DEFAULT 0,
  published_at           TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

-- OTP codes
CREATE TABLE IF NOT EXISTS otp_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       VARCHAR(15) NOT NULL,
  code        VARCHAR(6) NOT NULL,
  otp_id      UUID NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone);
CREATE INDEX IF NOT EXISTS idx_otp_otp_id ON otp_codes(otp_id);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token   TEXT NOT NULL UNIQUE,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(refresh_token);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transparency_reports ENABLE ROW LEVEL SECURITY;

-- Open RLS policies (app-layer auth handles authorization)
CREATE POLICY "allow_all_users" ON users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_photos" ON photos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_verifications" ON verifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_likes" ON likes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_matches" ON matches FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_messages" ON messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_reports" ON reports FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_blocks" ON blocks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_subscriptions" ON subscriptions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_otp" ON otp_codes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_sessions" ON sessions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_boosts" ON boosts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_transparency" ON transparency_reports FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
