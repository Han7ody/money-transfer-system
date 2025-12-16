-- Sprint 5: Admin & Agent Management System
-- Role-based permissions and credential management

-- ============================================
-- PART 1: Role Permissions Table
-- ============================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role VARCHAR(50) NOT NULL,
  permission VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role, permission)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission);

-- ============================================
-- PART 2: Agent Login Credentials
-- ============================================
CREATE TABLE IF NOT EXISTS agent_credentials (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(agent_id)
);

CREATE INDEX idx_agent_credentials_agent ON agent_credentials(agent_id);
CREATE INDEX idx_agent_credentials_username ON agent_credentials(username);
CREATE INDEX idx_agent_credentials_active ON agent_credentials(is_active);

-- ============================================
-- PART 3: Password Reset History
-- ============================================
CREATE TABLE IF NOT EXISTS password_reset_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reset_by INTEGER REFERENCES users(id),
  reason TEXT,
  reset_type VARCHAR(50), -- ADMIN_RESET, AGENT_RESET, SELF_RESET
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_password_reset_user ON password_reset_history(user_id);
CREATE INDEX idx_password_reset_created ON password_reset_history(created_at DESC);

-- ============================================
-- PART 4: Seed Default Role Permissions
-- ============================================
INSERT INTO role_permissions (role, permission, enabled) VALUES
-- SUPER_ADMIN permissions
('SUPER_ADMIN', 'KYC_REVIEW', true),
('SUPER_ADMIN', 'TRANSACTION_APPROVAL', true),
('SUPER_ADMIN', 'COMPLIANCE_DASHBOARD', true),
('SUPER_ADMIN', 'MANAGE_ADMINS', true),
('SUPER_ADMIN', 'MANAGE_AGENTS', true),
('SUPER_ADMIN', 'BLOCK_USERS', true),
('SUPER_ADMIN', 'VIEW_REPORTS', true),
('SUPER_ADMIN', 'SUPPORT_ESCALATION', true),
('SUPER_ADMIN', 'MANAGE_ROLES', true),
('SUPER_ADMIN', 'SYSTEM_SETTINGS', true),

-- ADMIN permissions
('ADMIN', 'KYC_REVIEW', true),
('ADMIN', 'TRANSACTION_APPROVAL', true),
('ADMIN', 'COMPLIANCE_DASHBOARD', true),
('ADMIN', 'MANAGE_AGENTS', true),
('ADMIN', 'BLOCK_USERS', true),
('ADMIN', 'VIEW_REPORTS', true),
('ADMIN', 'SUPPORT_ESCALATION', true),

-- COMPLIANCE permissions
('COMPLIANCE', 'KYC_REVIEW', true),
('COMPLIANCE', 'COMPLIANCE_DASHBOARD', true),
('COMPLIANCE', 'VIEW_REPORTS', true),
('COMPLIANCE', 'BLOCK_USERS', true),

-- SUPPORT permissions
('SUPPORT', 'SUPPORT_ESCALATION', true),
('SUPPORT', 'VIEW_REPORTS', false),

-- CASH_AGENT permissions
('CASH_AGENT', 'TRANSACTION_APPROVAL', false),
('CASH_AGENT', 'VIEW_REPORTS', false)

ON CONFLICT (role, permission) DO NOTHING;

-- ============================================
-- Update Trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_role_permissions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS role_permissions_update_trigger ON role_permissions;
CREATE TRIGGER role_permissions_update_trigger
  BEFORE UPDATE ON role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_role_permissions_timestamp();

DROP TRIGGER IF EXISTS agent_credentials_update_trigger ON agent_credentials;
CREATE TRIGGER agent_credentials_update_trigger
  BEFORE UPDATE ON agent_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_role_permissions_timestamp();

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE role_permissions IS 'Role-based permission mappings';
COMMENT ON TABLE agent_credentials IS 'Agent login credentials for cash agents';
COMMENT ON TABLE password_reset_history IS 'Audit trail for password resets';

SELECT 'Sprint 5 Admin Management tables created successfully!' AS status;
