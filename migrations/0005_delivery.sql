CREATE TRIGGER IF NOT EXISTS order_email_job AFTER INSERT ON orders WHEN NEW.customer_email != '' BEGIN
 INSERT INTO outbox(id,event_type,payload,available_at) VALUES('order-email:' || NEW.id,'order.email',json_object('orderId',NEW.id),NEW.created_at);
END;
CREATE TRIGGER IF NOT EXISTS quote_email_job AFTER INSERT ON quote_versions BEGIN
 INSERT INTO outbox(id,event_type,payload,available_at) VALUES('quote-email:' || NEW.order_id || ':' || NEW.version,'quote.email',json_object('orderId',NEW.order_id,'version',NEW.version),NEW.created_at);
END;
CREATE TRIGGER IF NOT EXISTS lock_issued_commercial_terms BEFORE UPDATE OF items_json,subtotal,total,discount,shipping_fee,currency,payment_terms,commerce_json ON orders
WHEN OLD.quote_status IN ('sent','viewed','negotiating','approved') AND (
 NEW.items_json IS NOT OLD.items_json OR NEW.subtotal IS NOT OLD.subtotal OR NEW.total IS NOT OLD.total OR
 NEW.discount IS NOT OLD.discount OR NEW.shipping_fee IS NOT OLD.shipping_fee OR NEW.currency IS NOT OLD.currency OR
 NEW.payment_terms IS NOT OLD.payment_terms OR NEW.commerce_json IS NOT OLD.commerce_json)
BEGIN SELECT RAISE(ABORT, 'Move an unapproved quote to draft before revising commercial terms'); END;
CREATE TRIGGER IF NOT EXISTS lock_approved_quote BEFORE UPDATE OF quote_status ON orders
WHEN OLD.quote_status = 'approved' AND NEW.quote_status IS NOT OLD.quote_status
BEGIN SELECT RAISE(ABORT, 'Approved quote status is immutable'); END;
