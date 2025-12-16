-- scripts/database/kyc-fraud-tables.sql
-- Sprint 3 - KYC and Fraud Detection Tables

-- Create KYC Review Notes table
CREATE TABLE IF NOT EXISTS kyc_review_notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  admin_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kyc_note_user ON kyc_review_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_note_admin ON kyc_review_notes(admin_id);

-- Create KYC Action Log table
CREATE TABLE IF NOT EXISTS kyc_action_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  admin_id INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL,
  reason TEXT,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kyc_action_user ON kyc_action_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_action_admin ON kyc_action_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_kyc_action_type ON kyc_action_logs(action);

-- Create Fraud Matches table
CREATE TABLE IF NOT EXISTS fraud_matches (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  matched_user_id INTEGER NOT NULL REFERENCES users(id),
  match_type VARCHAR(50) NOT NULL,
  match_value VARCHAR(500),
  score INTEGER NOT NULL,
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by INTEGER,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_match_user ON fraud_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_match_matched ON fraud_matches(matched_user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_match_type ON fraud_matches(match_type);
CREATE INDEX IF NOT EXISTS idx_fraud_match_resolved ON fraud_matches(is_resolved);

-- Verify tables were created
SELECT 'kyc_review_notes' as table_name, COUNT(*) as row_count FROM kyc_review_notes
UNION ALL
SELECT 'kyc_action_logs', COUNT(*) FROM kyc_action_logs
UNION ALL
SELECT 'fraud_matches', COUNT(*) FROM fraud_matches;
