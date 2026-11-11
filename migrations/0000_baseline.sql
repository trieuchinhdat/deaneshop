-- Baseline schema for fresh Cloudflare D1 databases managed by `wrangler d1 migrations apply`.
-- Idempotent so existing databases bootstrapped from schema.sql remain compatible.

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  country TEXT,
  company_name TEXT,
  company_size TEXT,
  budget_range TEXT,
  source TEXT DEFAULT 'landing_page',
  landing_page_url TEXT,
  message TEXT,
  status TEXT DEFAULT 'new',
  is_corporate_email INTEGER DEFAULT 0,
  ai_score INTEGER DEFAULT 0,
  ai_summary TEXT,
  ai_pitch_draft TEXT,
  journey_json TEXT,
  ip_country TEXT,
  ip_city TEXT,
  assigned_to TEXT,
  last_contacted_at DATETIME,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  click_id TEXT,
  internal_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_ai_score ON leads(ai_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT CHECK(role IN ('superadmin', 'admin', 'sales', 'cskh', 'marketing')) NOT NULL DEFAULT 'sales',
  avatar_url TEXT,
  status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active',
  assigned_leads_count INTEGER DEFAULT 0,
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_country TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT,
  shipping_state TEXT,
  shipping_postal_code TEXT,
  items_json TEXT NOT NULL,
  subtotal REAL NOT NULL,
  discount REAL DEFAULT 0,
  shipping_fee REAL DEFAULT 0,
  total REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT DEFAULT 'manual',
  payment_status TEXT DEFAULT 'unpaid',
  fulfillment_status TEXT DEFAULT 'pending',
  tracking_code TEXT,
  payment_terms TEXT,
  quote_status TEXT DEFAULT 'pending',
  quote_approved_at DATETIME,
  quote_approved_by TEXT,
  quote_valid_until DATETIME,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  click_id TEXT,
  customer_note TEXT,
  internal_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  product_title TEXT,
  product_slug TEXT,
  author TEXT NOT NULL,
  author_email TEXT,
  rating INTEGER NOT NULL DEFAULT 5,
  comment TEXT NOT NULL,
  media_urls_json TEXT,
  is_approved INTEGER DEFAULT 0,
  response TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  post_title TEXT,
  post_slug TEXT,
  parent_comment_id TEXT,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  is_author_reply INTEGER DEFAULT 0,
  is_approved INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_is_approved ON comments(is_approved);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

