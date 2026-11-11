-- Separate operational assessment from legacy sales stages. Preserve all existing leads.
CREATE TABLE IF NOT EXISTS lead_assessments (
 lead_id TEXT PRIMARY KEY REFERENCES leads(id) ON DELETE CASCADE,
 qualification TEXT NOT NULL DEFAULT 'not_assessed' CHECK(qualification IN ('not_assessed','qualified','not_a_fit','spam')),
 version INTEGER NOT NULL DEFAULT 1,
 priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('high','normal','low')),
 follow_up_at TEXT,
 next_action TEXT NOT NULL DEFAULT '',
 reason TEXT NOT NULL DEFAULT '',
 updated_at TEXT NOT NULL,
 updated_by TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_lead_follow_up ON lead_assessments(follow_up_at);
