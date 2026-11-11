-- ==============================================================================
-- Cloudflare D1 Database Schema for DeanFlow / DeanCore
-- High-Converting Lead Generation & Manual Order Fulfillment System
-- Target: SQLite (Cloudflare Edge SQL)
-- ==============================================================================

-- 1. Leads Table (Lead-Gen Landing Pages, Contact Forms, Popups, Newsletters, B2B CRM)
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
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'discovery', 'proposal', 'won', 'lost', 'closed'
  is_corporate_email INTEGER DEFAULT 0, -- 1: Business email, 0: Personal/Free email
  ai_score INTEGER DEFAULT 0, -- 0 to 100 Lead Intent & Quality Score
  ai_summary TEXT, -- LLM / Algorithmic 2-bullet summary of intent & pain points
  ai_pitch_draft TEXT, -- Personalized draft pitch for speed-to-lead response
  journey_json TEXT, -- JSON array of session breadcrumbs [{ path, title, timestamp }]
  ip_country TEXT, -- Cloudflare CF-IPCountry
  ip_city TEXT, -- Cloudflare CF-IPCity
  assigned_to TEXT, -- Staff User ID or Name
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

-- 1.1 Admin Users Table (Internal Staff & Role-Based Access Control)
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

-- 2. Orders Table (Manual Fulfillment & Checkout)
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
  items_json TEXT NOT NULL, -- JSON array of line items [{ productId, title, sku, price, quantity, total, image }]
  subtotal REAL NOT NULL,
  discount REAL DEFAULT 0,
  shipping_fee REAL DEFAULT 0,
  total REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT DEFAULT 'manual', -- 'cod', 'bank_transfer', 'manual'
  payment_status TEXT DEFAULT 'unpaid', -- 'unpaid', 'paid', 'refunded'
  fulfillment_status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'shipping', 'delivered', 'cancelled'
  tracking_code TEXT,
  payment_terms TEXT, -- e.g. 'T/T 30% advance, 70% before shipment', '100% L/C at sight'
  quote_status TEXT DEFAULT 'pending', -- 'draft', 'pending', 'sent', 'negotiating', 'approved', 'rejected'
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

-- 3. Reviews Table (User-Generated Content with Moderation)
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  product_title TEXT,
  product_slug TEXT,
  author TEXT NOT NULL,
  author_email TEXT,
  rating INTEGER NOT NULL DEFAULT 5,
  comment TEXT NOT NULL,
  media_urls_json TEXT, -- JSON array of media URLs [{ url, type }]
  is_approved INTEGER DEFAULT 0, -- 0: Pending, 1: Approved
  response TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- 4. Comments Table (Blog Post Discussion & UGC)
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  post_title TEXT,
  post_slug TEXT,
  parent_comment_id TEXT,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  is_author_reply INTEGER DEFAULT 0, -- 0: User, 1: Specialist/Author
  is_approved INTEGER DEFAULT 0, -- 0: Pending, 1: Approved
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_is_approved ON comments(is_approved);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
