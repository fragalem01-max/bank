-- ============================================
-- BANK SYSTEM - SUPABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Accounts table
CREATE TABLE accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id VARCHAR(11) UNIQUE NOT NULL,        -- 11-digit login ID
  account_number VARCHAR(10) UNIQUE NOT NULL,     -- starts at 0002532
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  iban VARCHAR(34),                               -- assigned by admin later
  balance_available DECIMAL(15,2) DEFAULT 0.00,
  balance_reserve DECIMAL(15,2) DEFAULT 0.00,
  is_verified BOOLEAN DEFAULT FALSE,
  address TEXT,
  id_photo_url TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit', 'transfer_in', 'transfer_out')),
  amount DECIMAL(15,2) NOT NULL,
  balance_type VARCHAR(20) DEFAULT 'available' CHECK (balance_type IN ('available', 'reserve')),
  reference VARCHAR(255),
  description VARCHAR(500),
  counterparty_name VARCHAR(255),
  counterparty_iban VARCHAR(34),
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  visible BOOLEAN DEFAULT TRUE,                    -- admin can hide balance additions
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(30) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'transfer', 'security')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_notifications_account ON notifications(account_id);
CREATE INDEX idx_notifications_read ON notifications(account_id, is_read);
CREATE INDEX idx_accounts_account_id ON accounts(account_id);
CREATE INDEX idx_accounts_account_number ON accounts(account_number);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SEED: Create admin account
-- Password: admin123 (change in production!)
-- Account ID: 00000000001
-- ============================================
-- The password hash below is for "admin123" using bcrypt
-- You should generate a new one for production
INSERT INTO accounts (account_id, account_number, full_name, email, password_hash, role, iban, is_verified, status)
VALUES (
  '00000000001',
  '0002532',
  'System Administrator',
  'admin@bank.com',
  '$2a$12$LJ3N4EMVxUBqOSLYE2Mz4eV9RI5gLkZ8kS5qHfJ7YXzGQj4v6dXHi',
  'admin',
  'XX00000000000000000001',
  TRUE,
  'active'
);

-- Disable RLS for service role access (API routes use service key)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies allowing service role full access
CREATE POLICY "Service role full access" ON accounts FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Service role full access" ON transactions FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Service role full access" ON notifications FOR ALL USING (TRUE) WITH CHECK (TRUE);
