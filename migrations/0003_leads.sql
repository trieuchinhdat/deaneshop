ALTER TABLE leads ADD COLUMN attribution_json TEXT;
ALTER TABLE leads ADD COLUMN consent_json TEXT;
CREATE INDEX IF NOT EXISTS idx_outbox_due ON outbox(status, available_at);
CREATE INDEX IF NOT EXISTS idx_admin_events_resource ON admin_events(resource_id, id);
