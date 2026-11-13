-- Explicit immutable identity mapping; email/Sanity project role never grants app access.
ALTER TABLE admin_users ADD COLUMN sanity_user_id TEXT;
CREATE UNIQUE INDEX idx_admin_users_sanity_identity
ON admin_users(sanity_user_id) WHERE sanity_user_id IS NOT NULL;
