CREATE TABLE IF NOT EXISTS magic_links (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  name       TEXT,
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token) WHERE used = FALSE;
CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email);

ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;
-- Only service role (edge functions) can touch this table — no client policies needed.
