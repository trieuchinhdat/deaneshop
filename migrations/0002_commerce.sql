ALTER TABLE orders ADD COLUMN request_hash TEXT;
ALTER TABLE orders ADD COLUMN commerce_json TEXT;
CREATE TABLE IF NOT EXISTS outbox (
 id TEXT PRIMARY KEY, event_type TEXT NOT NULL, payload TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0,
 available_at TEXT NOT NULL, locked_until TEXT, last_error TEXT, sent_at TEXT
);
CREATE TABLE IF NOT EXISTS admin_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, resource_id TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS quote_versions (
 order_id TEXT NOT NULL, version INTEGER NOT NULL, snapshot TEXT NOT NULL, created_at TEXT NOT NULL,
 PRIMARY KEY(order_id, version)
);
CREATE TRIGGER IF NOT EXISTS order_committed AFTER INSERT ON orders BEGIN
 INSERT INTO outbox(id,event_type,payload,available_at) VALUES('order:' || NEW.id,'order.created',json_object('orderId',NEW.id),NEW.created_at);
 INSERT INTO admin_events(type,resource_id,created_at) VALUES('NEW_ORDER',NEW.id,NEW.created_at);
END;
CREATE TRIGGER IF NOT EXISTS order_changed AFTER UPDATE ON orders BEGIN
 INSERT INTO admin_events(type,resource_id,created_at) VALUES('ORDER_UPDATED',NEW.id,NEW.updated_at);
END;
CREATE TRIGGER IF NOT EXISTS lead_committed AFTER INSERT ON leads BEGIN
 INSERT INTO admin_events(type,resource_id,created_at) VALUES('NEW_LEAD',NEW.id,NEW.created_at);
END;
CREATE TRIGGER IF NOT EXISTS lead_changed AFTER UPDATE ON leads BEGIN
 INSERT INTO admin_events(type,resource_id,created_at) VALUES('LEAD_UPDATED',NEW.id,NEW.updated_at);
END;
CREATE TRIGGER IF NOT EXISTS issued_quote_snapshot AFTER UPDATE OF quote_status ON orders
WHEN NEW.quote_status = 'sent' AND OLD.quote_status IS NOT 'sent'
BEGIN
 INSERT INTO quote_versions(order_id,version,snapshot,created_at)
 SELECT NEW.id, COALESCE(MAX(version),0)+1,
 json_object('items',json(NEW.items_json),'subtotal',NEW.subtotal,'total',NEW.total,'shipping',NEW.shipping_fee,'discount',NEW.discount,'currency',NEW.currency,'paymentTerms',NEW.payment_terms,'validUntil',NEW.quote_valid_until,'commerce',NEW.commerce_json),NEW.updated_at
 FROM quote_versions WHERE order_id=NEW.id;
END;
