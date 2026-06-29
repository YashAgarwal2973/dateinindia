
-- Add privacy and discoverability columns
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_discoverable BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS allow_messages_from_strangers BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_users_discoverable ON users(is_discoverable) WHERE is_discoverable = TRUE;
