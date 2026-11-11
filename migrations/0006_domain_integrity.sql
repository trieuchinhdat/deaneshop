-- Domain integrity: order intent discriminator, optimistic concurrency, payment ledger,
-- append-only notes, quote expiry locking, durable lead outbox, and last-superadmin protection.

ALTER TABLE orders ADD COLUMN order_intent TEXT NOT NULL DEFAULT 'direct';
ALTER TABLE orders ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE orders ADD COLUMN paid_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN receipt_token_hash TEXT;

UPDATE orders
SET order_intent = 'wholesale_rfq'
WHERE order_intent = 'direct' AND (order_number LIKE 'RFQ-%' OR quote_status IS NOT NULL);

UPDATE orders
SET paid_cents = CAST(ROUND(total * 100) AS INTEGER)
WHERE payment_status = 'paid' AND paid_cents = 0 AND total > 0;

CREATE TABLE IF NOT EXISTS order_payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  method TEXT NOT NULL,
  reference TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'payment' CHECK(kind IN ('payment', 'refund')),
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_payments_order ON order_payments(order_id, created_at);

CREATE TABLE IF NOT EXISTS order_notes (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_notes_order ON order_notes(order_id, created_at);

CREATE TABLE IF NOT EXISTS lead_notes (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead ON lead_notes(lead_id, created_at);

CREATE TABLE IF NOT EXISTS import_batches (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  import_type TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  result_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

ALTER TABLE leads ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE leads ADD COLUMN enqueue_notify INTEGER NOT NULL DEFAULT 0;
ALTER TABLE leads ADD COLUMN dossier_asset_id TEXT;

CREATE TRIGGER IF NOT EXISTS lead_notify_job AFTER INSERT ON leads
WHEN NEW.enqueue_notify = 1
BEGIN
  INSERT INTO outbox(id, event_type, payload, available_at)
  VALUES('lead-notify:' || NEW.id, 'lead.notify', json_object('leadId', NEW.id), NEW.created_at);
END;

CREATE TRIGGER IF NOT EXISTS lead_dossier_job AFTER INSERT ON leads
WHEN NEW.dossier_asset_id IS NOT NULL AND NEW.email IS NOT NULL AND NEW.email != ''
BEGIN
  INSERT INTO outbox(id, event_type, payload, available_at)
  VALUES('lead-dossier:' || NEW.id, 'lead.dossier', json_object('leadId', NEW.id, 'assetId', NEW.dossier_asset_id), NEW.created_at);
END;

ALTER TABLE outbox ADD COLUMN delivery_envelope TEXT;
ALTER TABLE outbox ADD COLUMN failure_kind TEXT;
ALTER TABLE outbox ADD COLUMN dead_lettered_at TEXT;
ALTER TABLE outbox ADD COLUMN max_attempts INTEGER NOT NULL DEFAULT 8;
ALTER TABLE outbox ADD COLUMN provider_message_id TEXT;

CREATE TRIGGER IF NOT EXISTS validate_order_financials_insert BEFORE INSERT ON orders
BEGIN
  SELECT RAISE(ABORT, 'Invalid order financial values')
  WHERE NEW.subtotal < 0 OR NEW.discount < 0 OR NEW.shipping_fee < 0 OR NEW.total < 0 OR NEW.paid_cents < 0;
  SELECT RAISE(ABORT, 'Invalid order intent')
  WHERE NEW.order_intent NOT IN ('direct', 'sample', 'wholesale_rfq');
  SELECT RAISE(ABORT, 'Invalid payment status')
  WHERE NEW.payment_status NOT IN ('unpaid', 'partial', 'paid', 'refunded');
  SELECT RAISE(ABORT, 'Invalid fulfillment status')
  WHERE NEW.fulfillment_status NOT IN ('pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled');
END;

CREATE TRIGGER IF NOT EXISTS validate_order_financials_update BEFORE UPDATE OF subtotal, discount, shipping_fee, total, paid_cents, payment_status, fulfillment_status, order_intent ON orders
BEGIN
  SELECT RAISE(ABORT, 'Invalid order financial values')
  WHERE NEW.subtotal < 0 OR NEW.discount < 0 OR NEW.shipping_fee < 0 OR NEW.total < 0 OR NEW.paid_cents < 0;
  SELECT RAISE(ABORT, 'Invalid order intent')
  WHERE NEW.order_intent NOT IN ('direct', 'sample', 'wholesale_rfq');
  SELECT RAISE(ABORT, 'Invalid payment status')
  WHERE NEW.payment_status NOT IN ('unpaid', 'partial', 'paid', 'refunded');
  SELECT RAISE(ABORT, 'Invalid fulfillment status')
  WHERE NEW.fulfillment_status NOT IN ('pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled');
END;

DROP TRIGGER IF EXISTS lock_issued_commercial_terms;
CREATE TRIGGER lock_issued_commercial_terms BEFORE UPDATE OF items_json,subtotal,total,discount,shipping_fee,currency,payment_terms,commerce_json,quote_valid_until ON orders
WHEN OLD.quote_status IN ('sent','viewed','negotiating','approved') AND (
  NEW.items_json IS NOT OLD.items_json OR NEW.subtotal IS NOT OLD.subtotal OR NEW.total IS NOT OLD.total OR
  NEW.discount IS NOT OLD.discount OR NEW.shipping_fee IS NOT OLD.shipping_fee OR NEW.currency IS NOT OLD.currency OR
  NEW.payment_terms IS NOT OLD.payment_terms OR NEW.commerce_json IS NOT OLD.commerce_json OR
  NEW.quote_valid_until IS NOT OLD.quote_valid_until
)
BEGIN SELECT RAISE(ABORT, 'Move an unapproved quote to draft before revising commercial terms'); END;

CREATE TRIGGER IF NOT EXISTS prevent_last_superadmin_demotion BEFORE UPDATE OF role, status ON admin_users
WHEN OLD.role = 'superadmin' AND OLD.status = 'active' AND (NEW.role != 'superadmin' OR NEW.status != 'active')
  AND (SELECT COUNT(*) FROM admin_users WHERE role = 'superadmin' AND status = 'active' AND id != OLD.id) = 0
BEGIN
  SELECT RAISE(ABORT, 'Cannot disable or demote the last active superadmin');
END;

CREATE TRIGGER IF NOT EXISTS prevent_last_superadmin_delete BEFORE DELETE ON admin_users
WHEN OLD.role = 'superadmin' AND OLD.status = 'active'
  AND (SELECT COUNT(*) FROM admin_users WHERE role = 'superadmin' AND status = 'active' AND id != OLD.id) = 0
BEGIN
  SELECT RAISE(ABORT, 'Cannot delete the last active superadmin');
END;

CREATE INDEX IF NOT EXISTS idx_reviews_product_approved ON reviews(product_id, is_approved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email_lower ON orders(lower(customer_email), created_at DESC);

