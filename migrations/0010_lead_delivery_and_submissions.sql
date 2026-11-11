-- A submission identity and its response commit with the lead and notification jobs.
ALTER TABLE leads ADD COLUMN submission_key TEXT;
ALTER TABLE leads ADD COLUMN submission_hash TEXT;
ALTER TABLE leads ADD COLUMN submission_result TEXT;
ALTER TABLE leads ADD COLUMN dossier_payload TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_submission_key ON leads(submission_key);

-- Make new dossier jobs complete before a concurrent cron can claim them.
DROP TRIGGER IF EXISTS lead_dossier_job;
CREATE TRIGGER lead_dossier_job AFTER INSERT ON leads
WHEN NEW.dossier_asset_id IS NOT NULL AND NEW.email IS NOT NULL AND NEW.email != ''
BEGIN
  INSERT INTO outbox(id, event_type, payload, available_at)
  VALUES('lead-dossier:' || NEW.id, 'lead.dossier',
    json_patch(COALESCE(NEW.dossier_payload, '{}'),
      json_object('leadId', NEW.id, 'assetId', NEW.dossier_asset_id)), NEW.created_at);
END;
