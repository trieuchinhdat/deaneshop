-- Project each wholesale quote into one lead. The order insert and lead insert
-- share a SQLite transaction, so a successful RFQ always appears in the inbox.
CREATE VIEW IF NOT EXISTS wholesale_rfq_lead_projection AS
SELECT o.id AS order_id,
  'lead_rfq:' || o.id AS lead_id,
  o.customer_name AS name,
  NULLIF(o.customer_email, '') AS email,
  NULLIF(o.customer_phone, '') AS phone,
  o.shipping_country AS country,
  NULLIF(json_extract(o.commerce_json, '$.company'), '') AS company_name,
  'wholesale_rfq' AS source,
  'Wholesale quote ' || o.order_number || char(10) ||
    'Products: ' || COALESCE((SELECT group_concat(
      COALESCE(NULLIF(json_extract(j.value, '$.title'), ''), NULLIF(json_extract(j.value, '$.sku'), ''), 'Product') ||
      ' x ' || json_extract(j.value, '$.quantity'), ', '
    ) FROM json_each(o.items_json) AS j), 'Not specified') ||
    CASE WHEN NULLIF(o.customer_note, '') IS NOT NULL THEN char(10) || 'Requirements: ' || o.customer_note ELSE '' END ||
    CASE WHEN NULLIF(json_extract(o.commerce_json, '$.customization'), '') IS NOT NULL THEN char(10) || 'Customization: ' || json_extract(o.commerce_json, '$.customization') ELSE '' END ||
    CASE WHEN NULLIF(json_extract(o.commerce_json, '$.port'), '') IS NOT NULL THEN char(10) || 'Destination port: ' || json_extract(o.commerce_json, '$.port') ELSE '' END AS message,
  CASE WHEN o.customer_email != '' AND instr(o.customer_email, '@') > 0
    AND lower(substr(o.customer_email, instr(o.customer_email, '@') + 1)) NOT IN
      ('gmail.com','googlemail.com','yahoo.com','ymail.com','yahoo.com.vn','hotmail.com','outlook.com','live.com','msn.com','icloud.com','me.com','mac.com','aol.com','proton.me','protonmail.com','zoho.com','mail.com','gmx.com','yandex.com','qq.com','163.com')
    THEN 1 ELSE 0 END AS is_corporate_email,
  o.utm_source, o.utm_medium, o.utm_campaign, o.utm_term, o.utm_content, o.click_id,
  o.created_at, o.updated_at
FROM orders o
WHERE o.order_intent = 'wholesale_rfq' AND o.deleted_at IS NULL;

CREATE TRIGGER IF NOT EXISTS wholesale_rfq_to_lead AFTER INSERT ON orders
WHEN NEW.order_intent = 'wholesale_rfq'
BEGIN
  INSERT INTO leads (id,name,email,phone,country,company_name,source,message,status,
    is_corporate_email,ai_score,ai_summary,assigned_to,utm_source,utm_medium,
    utm_campaign,utm_term,utm_content,click_id,enqueue_notify,created_at,updated_at)
  SELECT p.lead_id,p.name,p.email,p.phone,p.country,p.company_name,p.source,p.message,'new',
    p.is_corporate_email,
    MIN(100,45 + p.is_corporate_email * 25 + CASE WHEN p.phone IS NOT NULL THEN 15 ELSE 0 END + CASE WHEN p.company_name IS NOT NULL THEN 15 ELSE 0 END),
    'Wholesale quote request received. Company and contact details are buyer supplied; verify before qualifying.',
    (SELECT u.id FROM admin_users u WHERE u.role = 'sales' AND u.status = 'active'
      ORDER BY (SELECT COUNT(*) FROM leads l WHERE l.assigned_to = u.id AND l.status NOT IN ('won','lost','closed')),u.id LIMIT 1),
    p.utm_source,p.utm_medium,p.utm_campaign,p.utm_term,p.utm_content,p.click_id,1,p.created_at,p.updated_at
  FROM wholesale_rfq_lead_projection p WHERE p.order_id = NEW.id;
END;

-- Existing RFQs were previously stored only as orders. Import them once,
-- without replaying customer or staff notification emails.
INSERT OR IGNORE INTO leads (id,name,email,phone,country,company_name,source,message,status,
  is_corporate_email,ai_score,ai_summary,assigned_to,utm_source,utm_medium,
  utm_campaign,utm_term,utm_content,click_id,enqueue_notify,created_at,updated_at)
SELECT p.lead_id,p.name,p.email,p.phone,p.country,p.company_name,p.source,p.message,'new',
  p.is_corporate_email,
  MIN(100,45 + p.is_corporate_email * 25 + CASE WHEN p.phone IS NOT NULL THEN 15 ELSE 0 END + CASE WHEN p.company_name IS NOT NULL THEN 15 ELSE 0 END),
  'Wholesale quote request received. Company and contact details are buyer supplied; verify before qualifying.',
  NULL,p.utm_source,p.utm_medium,p.utm_campaign,p.utm_term,p.utm_content,p.click_id,0,p.created_at,p.updated_at
FROM wholesale_rfq_lead_projection p;

-- Priority is automated, while qualification remains a staff decision.
CREATE TRIGGER IF NOT EXISTS wholesale_rfq_lead_priority AFTER INSERT ON leads
WHEN NEW.source = 'wholesale_rfq'
BEGIN
  INSERT OR IGNORE INTO lead_assessments
    (lead_id,qualification,priority,next_action,reason,updated_at,updated_by)
  VALUES (NEW.id,'not_assessed',CASE WHEN NEW.ai_score >= 80 THEN 'high' ELSE 'normal' END,
    'Review quote request and contact buyer',
    'Wholesale RFQ submitted; automated priority uses buyer supplied contact details.',
    NEW.created_at,'system');
END;

-- Backfilled rows were inserted before the priority trigger existed.
INSERT OR IGNORE INTO lead_assessments
  (lead_id,qualification,priority,next_action,reason,updated_at,updated_by)
SELECT l.id,'not_assessed',CASE WHEN l.ai_score >= 80 THEN 'high' ELSE 'normal' END,
  'Review quote request and contact buyer',
  'Wholesale RFQ submitted; automated priority uses buyer supplied contact details.',
  l.created_at,'system'
FROM leads l WHERE l.source = 'wholesale_rfq';
