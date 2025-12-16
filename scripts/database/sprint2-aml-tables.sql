-- Sprint 2: AML Monitoring Tables
-- Run this migration to add AML alert tracking

-- AML Alerts Table
CREATE TABLE IF NOT EXISTS aml_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- VELOCITY, STRUCTURING, HIGH_RISK_COUNTRY, UNUSUAL_PATTERN
  severity VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH
  details JSONB,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, UNDER_REVIEW, RESOLVED, FALSE_POSITIVE
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_aml_alerts_user ON aml_alerts(user_id);
CREATE INDEX idx_aml_alerts_transaction ON aml_alerts(transaction_id);
CREATE INDEX idx_aml_alerts_status ON aml_alerts(status);
CREATE INDEX idx_aml_alerts_severity ON aml_alerts(severity);
CREATE INDEX idx_aml_alerts_created ON aml_alerts(created_at DESC);

COMMENT ON TABLE aml_alerts IS 'AML monitoring alerts for suspicious activity detection';
COMMENT ON COLUMN aml_alerts.type IS 'Type of AML alert (velocity, structuring, etc.)';
COMMENT ON COLUMN aml_alerts.severity IS 'Alert severity level';
COMMENT ON COLUMN aml_alerts.details IS 'JSON details about the alert trigger';
