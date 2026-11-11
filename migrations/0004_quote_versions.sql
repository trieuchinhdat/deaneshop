ALTER TABLE quote_access ADD COLUMN version INTEGER NOT NULL DEFAULT 0;
CREATE TRIGGER IF NOT EXISTS quote_snapshot_immutable_update BEFORE UPDATE ON quote_versions
BEGIN SELECT RAISE(ABORT, 'Quote snapshots are immutable'); END;
CREATE TRIGGER IF NOT EXISTS quote_snapshot_immutable_delete BEFORE DELETE ON quote_versions
BEGIN SELECT RAISE(ABORT, 'Quote snapshots are immutable'); END;
