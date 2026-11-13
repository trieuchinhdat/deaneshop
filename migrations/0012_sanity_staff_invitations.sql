-- One outstanding invitation per staff account. Store only a SHA-256 digest.
CREATE TABLE admin_staff_invitations (
  staff_user_id TEXT PRIMARY KEY REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  project_id TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

-- Consume the invitation in the same statement that links the identity.
CREATE TRIGGER consume_sanity_staff_invitation
AFTER UPDATE OF sanity_user_id ON admin_users
WHEN NEW.sanity_user_id IS NOT NULL
BEGIN
  DELETE FROM admin_staff_invitations WHERE staff_user_id = NEW.id;
END;
