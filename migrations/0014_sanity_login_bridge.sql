-- Short-lived browser-bound transactions for standalone Studio -> CRM login.
CREATE TABLE IF NOT EXISTS sanity_login_transactions (
 state_hash TEXT PRIMARY KEY,
 verifier_hash TEXT NOT NULL,
 expires_at INTEGER NOT NULL,
 code_hash TEXT UNIQUE,
 code_expires_at INTEGER,
 staff_id TEXT,
 sanity_user_id TEXT,
 project_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_sanity_login_expiry ON sanity_login_transactions(expires_at);
