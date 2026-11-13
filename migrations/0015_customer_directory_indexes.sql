-- Expression & composite indexes for Customer Directory aggregation and timeline queries
CREATE INDEX IF NOT EXISTS idx_leads_email_norm ON leads(LOWER(TRIM(email)));
CREATE INDEX IF NOT EXISTS idx_leads_assigned_created ON leads(assigned_to, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_email_norm ON comments(LOWER(TRIM(author_email))) WHERE COALESCE(is_author_reply, 0) = 0;
CREATE INDEX IF NOT EXISTS idx_reviews_email_norm ON reviews(LOWER(TRIM(author_email)));

