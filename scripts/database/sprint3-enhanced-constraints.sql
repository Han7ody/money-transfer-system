-- Sprint 3 Enhanced - Additional Constraints and Indexes
-- Run this after sprint3-enhanced-tables.sql

-- ============================================
-- PART 1: Add Check Constraints
-- ============================================

-- Add check constraint on fraud_score range
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_fraud_score_range'
  ) THEN
    ALTER TABLE users 
    ADD CONSTRAINT check_fraud_score_range 
    CHECK (fraud_score IS NULL OR (fraud_score >= 0 AND fraud_score <= 100));
  END IF;
END $$;

-- Ensure case_number is unique (should already be, but verify)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'aml_cases_case_number_key'
  ) THEN
    ALTER TABLE aml_cases ADD CONSTRAINT aml_cases_case_number_key UNIQUE (case_number);
  END IF;
END $$;

-- ============================================
-- PART 2: Add Performance Indexes
-- ============================================

-- Add composite index for fraud score history queries
CREATE INDEX IF NOT EXISTS idx_fraud_scores_user_created 
ON fraud_scores(user_id, created_at DESC);

-- Add index on aml_cases.created_at for sorting
CREATE INDEX IF NOT EXISTS idx_aml_cases_created_desc 
ON aml_cases(created_at DESC);

-- Add index on compliance_reports.created_at
CREATE INDEX IF NOT EXISTS idx_compliance_reports_created_desc 
ON compliance_reports(created_at DESC);

-- Add composite index for case filtering
CREATE INDEX IF NOT EXISTS idx_aml_cases_status_severity 
ON aml_cases(status, severity);

-- ============================================
-- PART 3: Add Foreign Key Constraints (if missing)
-- ============================================

-- Ensure fraud_scores has proper FK
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fraud_scores_user_id_fkey'
  ) THEN
    ALTER TABLE fraud_scores 
    ADD CONSTRAINT fraud_scores_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure aml_cases has proper FKs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'aml_cases_user_id_fkey'
  ) THEN
    ALTER TABLE aml_cases 
    ADD CONSTRAINT aml_cases_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- PART 4: Add NOT NULL Constraints
-- ============================================

-- Ensure critical fields are NOT NULL
DO $$ 
BEGIN
  -- aml_cases.case_number should not be null
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'aml_cases' 
    AND column_name = 'case_number' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE aml_cases ALTER COLUMN case_number SET NOT NULL;
  END IF;

  -- aml_cases.status should not be null
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'aml_cases' 
    AND column_name = 'status' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE aml_cases ALTER COLUMN status SET NOT NULL;
  END IF;
END $$;

-- ============================================
-- PART 5: Verify Constraints
-- ============================================

SELECT 'Constraints and indexes added successfully!' AS status;

-- Show added constraints
SELECT 
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'users'::regclass
  AND conname LIKE '%fraud%'
UNION ALL
SELECT 
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'aml_cases'::regclass
  AND conname LIKE '%case_number%';

-- Show added indexes
SELECT 
  indexname,
  tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    indexname LIKE '%fraud_scores%'
    OR indexname LIKE '%aml_cases%'
    OR indexname LIKE '%compliance_reports%'
  )
ORDER BY tablename, indexname;
