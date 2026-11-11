-- Super Admin soft deletion for eligible unpaid, unapproved, non-shipping/delivered orders.
-- Preserves immutable quote_versions snapshots, audit logs, and idempotency history.

ALTER TABLE orders ADD COLUMN deleted_at TEXT;
ALTER TABLE orders ADD COLUMN deleted_by TEXT;
ALTER TABLE orders ADD COLUMN delete_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON orders(deleted_at);

CREATE TRIGGER IF NOT EXISTS prevent_ineligible_order_soft_delete
BEFORE UPDATE OF deleted_at ON orders
WHEN OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL AND (
  COALESCE(OLD.paid_cents, 0) > 0
  OR LOWER(COALESCE(OLD.payment_status, 'unpaid')) IN ('partial', 'paid', 'refunded')
  OR LOWER(COALESCE(OLD.quote_status, '')) = 'approved'
  OR OLD.quote_approved_at IS NOT NULL
  OR LOWER(COALESCE(OLD.fulfillment_status, 'pending')) IN ('shipping', 'delivered', 'returned')
  OR EXISTS (SELECT 1 FROM order_payments p WHERE p.order_id = OLD.id)
)
BEGIN
  SELECT RAISE(ABORT, 'Cannot delete paid, approved, or in-transit/delivered orders');
END;

CREATE TRIGGER IF NOT EXISTS prevent_deleted_order_mutation
BEFORE UPDATE ON orders
WHEN OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'Cannot modify a deleted order');
END;

CREATE TRIGGER IF NOT EXISTS cleanup_soft_deleted_order
AFTER UPDATE OF deleted_at ON orders
WHEN OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL
BEGIN
  UPDATE quote_access
  SET revoked_at = COALESCE(revoked_at, NEW.deleted_at)
  WHERE order_id = NEW.id AND revoked_at IS NULL;

  UPDATE outbox
  SET status = 'superseded',
      locked_until = NULL,
      last_error = 'Order deleted by superadmin'
  WHERE status IN ('pending', 'failed')
    AND (
      id IN ('order:' || NEW.id, 'order-email:' || NEW.id)
      OR (
        event_type = 'quote.email'
        AND json_valid(payload) = 1
        AND json_extract(payload, '$.orderId') = NEW.id
      )
    );
END;

