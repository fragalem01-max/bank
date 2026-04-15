-- ============================================
-- MIGRATION: Add structured address, transaction refs, language
-- Run this AFTER the initial schema
-- ============================================

-- Structured address fields
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS country VARCHAR(100);

-- ID photo data for admin review
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS id_photo_data TEXT;

-- Language preference
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'en';

-- Transaction reference ID (bank-style)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transaction_ref VARCHAR(30);

-- Generate refs for existing transactions
UPDATE transactions SET transaction_ref = 'TXN-' || TO_CHAR(created_at, 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0') WHERE transaction_ref IS NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_transactions_ref ON transactions(transaction_ref);
