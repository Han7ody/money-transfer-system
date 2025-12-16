-- Sprint 3 Enhanced - Additional Compliance Tables
-- Run this after sprint3 base tables are created

-- ============================================
-- PART 1: Fraud Score History
-- ============================================
CREATE TABLE IF NOT EXISTS fraud_scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  factors JSONB, -- Details about what contributed to the score
  calculated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_fraud_scores_user ON fraud_scores(user_id);
CREATE INDEX idx_fraud_scores_risk ON fraud_scores(risk_level);
CREATE INDEX idx_fraud_scores_created ON fraud_scores(created_at DESC);

-- Add fraud score fields to users table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='fraud_score') THEN
    ALTER TABLE users ADD COLUMN fraud_score INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='risk_level') THEN
    ALTER TABLE users ADD COLUMN risk_level VARCHAR(20) DEFAULT 'LOW';
  END IF;
END $$;

-- ============================================
-- PART 2: Enhanced KYC Documents
-- ============================================
DO $$ 
BEGIN
  -- Add document verification fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kyc_documents' AND column_name='expiry_date') THEN
    ALTER TABLE kyc_documents ADD COLUMN expiry_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kyc_documents' AND column_name='issue_date') THEN
    ALTER TABLE kyc_documents ADD COLUMN issue_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kyc_documents' AND column_name='issuing_country') THEN
    ALTER TABLE kyc_documents ADD COLUMN issuing_country VARCHAR(2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kyc_documents' AND column_name='verification_status') THEN
    ALTER TABLE kyc_documents ADD COLUMN verification_status VARCHAR(20) DEFAULT 'PENDING';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kyc_documents' AND column_name='verification_notes') THEN
    ALTER TABLE kyc_documents ADD COLUMN verification_notes TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kyc_documents' AND column_name='verified_by') THEN
    ALTER TABLE kyc_documents ADD COLUMN verified_by INTEGER REFERENCES users(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kyc_documents' AND column_name='verified_at') THEN
    ALTER TABLE kyc_documents ADD COLUMN verified_at TIMESTAMP;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_kyc_documents_verification ON kyc_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_expiry ON kyc_documents(expiry_date);

-- ============================================
-- PART 3: AML Case Management
-- ============================================
CREATE TABLE IF NOT EXISTS aml_cases (
  id SERIAL PRIMARY KEY,
  case_number VARCHAR(50) UNIQUE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id INTEGER REFERENCES transactions(id),
  case_type VARCHAR(50) NOT NULL, -- VELOCITY, STRUCTURING, HIGH_RISK, SUSPICIOUS
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED', 'ESCALATED')),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  assigned_to INTEGER REFERENCES users(id),
  assigned_at TIMESTAMP,
  resolved_by INTEGER REFERENCES users(id),
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_aml_cases_user ON aml_cases(user_id);
CREATE INDEX idx_aml_cases_status ON aml_cases(status);
CREATE INDEX idx_aml_cases_severity ON aml_cases(severity);
CREATE INDEX idx_aml_cases_assigned ON aml_cases(assigned_to);
CREATE INDEX idx_aml_cases_created ON aml_cases(created_at DESC);

-- Link AML alerts to cases
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='aml_alerts') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='aml_alerts' AND column_name='case_id') THEN
      ALTER TABLE aml_alerts ADD COLUMN case_id INTEGER REFERENCES aml_cases(id);
      CREATE INDEX idx_aml_alerts_case ON aml_alerts(case_id);
    END IF;
  END IF;
END $$;

-- ============================================
-- PART 4: Case Activity Log
-- ============================================
CREATE TABLE IF NOT EXISTS aml_case_activities (
  id SERIAL PRIMARY KEY,
  case_id INTEGER NOT NULL REFERENCES aml_cases(id) ON DELETE CASCADE,
  admin_id INTEGER REFERENCES users(id),
  activity_type VARCHAR(50) NOT NULL, -- CREATED, ASSIGNED, STATUS_CHANGED, NOTE_ADDED, RESOLVED
  old_value VARCHAR(500),
  new_value VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_case_activities_case ON aml_case_activities(case_id);
CREATE INDEX idx_case_activities_created ON aml_case_activities(created_at DESC);

-- ============================================
-- PART 5: Compliance Reports
-- ============================================
CREATE TABLE IF NOT EXISTS compliance_reports (
  id SERIAL PRIMARY KEY,
  report_type VARCHAR(50) NOT NULL, -- DAILY_SUMMARY, KYC_COMPLIANCE, FRAUD_DETECTION, AML_ALERTS
  report_name VARCHAR(255) NOT NULL,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  generated_by INTEGER REFERENCES users(id),
  report_data JSONB NOT NULL,
  file_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_compliance_reports_type ON compliance_reports(report_type);
CREATE INDEX idx_compliance_reports_created ON compliance_reports(created_at DESC);
CREATE INDEX idx_compliance_reports_generated_by ON compliance_reports(generated_by);

-- ============================================
-- Helper Functions
-- ============================================

-- Function to generate case number
CREATE OR REPLACE FUNCTION generate_case_number() RETURNS VARCHAR AS $$
DECLARE
  new_number VARCHAR;
  year_month VARCHAR;
BEGIN
  year_month := TO_CHAR(NOW(), 'YYYYMM');
  SELECT 'AML-' || year_month || '-' || LPAD((COUNT(*) + 1)::TEXT, 4, '0')
  INTO new_number
  FROM aml_cases
  WHERE case_number LIKE 'AML-' || year_month || '%';
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================

-- Insert sample fraud scores for existing users
-- INSERT INTO fraud_scores (user_id, score, risk_level, factors)
-- SELECT id, 0, 'LOW', '{}'::jsonb FROM users WHERE fraud_score IS NULL LIMIT 10;

COMMENT ON TABLE fraud_scores IS 'Historical fraud scores for users';
COMMENT ON TABLE aml_cases IS 'AML investigation cases';
COMMENT ON TABLE aml_case_activities IS 'Activity log for AML cases';
COMMENT ON TABLE compliance_reports IS 'Generated compliance reports';

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE ON fraud_scores TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE ON aml_cases TO your_app_user;
-- GRANT SELECT, INSERT ON aml_case_activities TO your_app_user;
-- GRANT SELECT, INSERT ON compliance_reports TO your_app_user;

SELECT 'Sprint 3 Enhanced tables created successfully!' AS status;
