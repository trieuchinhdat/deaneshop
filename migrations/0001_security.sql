-- Apply once after the baseline schema.sql. Never run migrations from public requests.
CREATE TABLE IF NOT EXISTS request_limits (
  key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS quote_access (
  token_hash TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_quote_access_order ON quote_access(order_id);
CREATE TABLE IF NOT EXISTS quote_events (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  details TEXT,
  created_at TEXT NOT NULL
);
CREATE TRIGGER IF NOT EXISTS record_quote_transition AFTER UPDATE OF quote_status ON orders
WHEN NEW.quote_status IS NOT OLD.quote_status
BEGIN
  INSERT INTO quote_events(id, order_id, action, actor, details, created_at)
  VALUES(lower(hex(randomblob(16))), NEW.id, NEW.quote_status, COALESCE(NEW.quote_approved_by, 'staff'), NEW.internal_notes, NEW.updated_at);
END;
