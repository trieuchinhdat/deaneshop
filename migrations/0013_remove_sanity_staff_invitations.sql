-- Sanity project membership now grants entry with a default sales role.
-- Keep the migration history, remove the retired invitation mechanism.
DROP TRIGGER IF EXISTS consume_sanity_staff_invitation;
DROP TABLE IF EXISTS admin_staff_invitations;
