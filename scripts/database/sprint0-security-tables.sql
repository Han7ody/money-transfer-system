-- Sprint 0 & Sprint 1: Security and State Machine Tables
-- Run this migration to add required tables for security hardening

-- 1. Admin Sessions Table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(500) NOT NULL UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  last_activity TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX idx_admin_sessions_active ON admin_sessions(is_active, expires_at);

-- 2. IP Whitelist Table
CREATE TABLE IF NOT EXISTS ip_whitelist (
  id SERIAL PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL UNIQUE,
  description TEXT,
  added_by INTEGER REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ip_whitelist_active ON ip_whitelist(is_active);

-- 3. Failed Login Attempts Table
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reason VARCHAR(100)
);

CREATE INDEX idx_failed_login_email ON failed_login_attempts(email, attempt_time);
CREATE INDEX idx_failed_login_ip ON failed_login_attempts(ip_address, attempt_time);

-- 4. Transaction State Transitions Table
CREATE TABLE IF NOT EXISTS transaction_state_transitions (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  from_status VARCHAR(50) NOT NULL,
  to_status VARCHAR(50) NOT NULL,
  changed_by INTEGER REFERENCES users(id),
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transaction_transitions_txn ON transaction_state_transitions(transaction_id);
CREATE INDEX idx_transaction_transitions_time ON transaction_state_transitions(created_at);

-- 5. KYC State Transitions Table
CREATE TABLE IF NOT EXISTS kyc_state_transitions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_status VARCHAR(50) NOT NULL,
  to_status VARCHAR(50) NOT NULL,
  changed_by INTEGER REFERENCES users(id),
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kyc_transitions_user ON kyc_state_transitions(user_id);
CREATE INDEX idx_kyc_transitions_time ON kyc_state_transitions(created_at);

-- 6. Transaction Approvals Table (for maker-checker)
CREATE TABLE IF NOT EXISTS transaction_approvals (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  approver_id INTEGER NOT NULL REFERENCES users(id),
  approval_level INTEGER NOT NULL DEFAULT 1,
  approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(transaction_id, approver_id)
);

CREATE INDEX idx_transaction_approvals_txn ON transaction_approvals(transaction_id);

-- 7. Add new columns to transactions table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='transactions' AND column_name='approval_required_by') THEN
    ALTER TABLE transactions ADD COLUMN approval_required_by INTEGER DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='transactions' AND column_name='approval_count') THEN
    ALTER TABLE transactions ADD COLUMN approval_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- 8. Add session_id and geolocation to audit_logs if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='audit_logs' AND column_name='session_id') THEN
    ALTER TABLE audit_logs ADD COLUMN session_id VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='audit_logs' AND column_name='geolocation') THEN
    ALTER TABLE audit_logs ADD COLUMN geolocation JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='audit_logs' AND column_name='checksum') THEN
    ALTER TABLE audit_logs ADD COLUMN checksum VARCHAR(64);
  END IF;
END $$;

-- 9. Make audit_logs append-only (prevent updates and deletes)
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_immutable_update ON audit_logs;
CREATE TRIGGER audit_log_immutable_update
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_modification();

DROP TRIGGER IF EXISTS audit_log_immutable_delete ON audit_logs;
CREATE TRIGGER audit_log_immutable_delete
  BEFORE DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_modification();

-- 10. Add new transaction statuses if using ENUM
-- Note: If using VARCHAR, this is not needed
-- ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
-- ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'DISPUTED';
-- ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

-- 11. Add new KYC statuses if using ENUM
-- ALTER TYPE "KYCStatus" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';
-- ALTER TYPE "KYCStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

COMMENT ON TABLE admin_sessions IS 'Tracks active admin sessions for timeout and management';
COMMENT ON TABLE ip_whitelist IS 'Whitelisted IP addresses for admin access';
COMMENT ON TABLE failed_login_attempts IS 'Tracks failed login attempts for security monitoring';
COMMENT ON TABLE transaction_state_transitions IS 'Audit trail for transaction status changes';
COMMENT ON TABLE kyc_state_transitions IS 'Audit trail for KYC status changes';
COMMENT ON TABLE transaction_approvals IS 'Tracks multi-level approvals for transactions';
