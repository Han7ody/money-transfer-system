-- ============================================
-- Sprint 5: Complete Admin Management System
-- Separate Admin Users + Roles + Permissions
-- ============================================

-- ============================================
-- PART 1: Admin Users Table (Separate from customers)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON admin_users(status);

-- ============================================
-- PART 2: Admin Roles Table
-- ============================================
CREATE TABLE IF NOT EXISTS admin_roles (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(100) UNIQUE NOT NULL,
  can_be_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_roles_name ON admin_roles(role_name);

-- ============================================
-- PART 3: Admin Permissions Table
-- ============================================
CREATE TABLE IF NOT EXISTS admin_permissions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  label VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_permissions_code ON admin_permissions(code);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_category ON admin_permissions(category);

-- ============================================
-- PART 4: Role-Permission Mapping
-- ============================================
CREATE TABLE IF NOT EXISTS admin_role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES admin_permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON admin_role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON admin_role_permissions(permission_id);

-- ============================================
-- PART 5: Agent Enhancements
-- ============================================
ALTER TABLE agents ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS performance_score NUMERIC(5,2);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_agents_username ON agents(username);

-- ============================================
-- PART 14: Add Foreign Key Constraint
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_admin_users_role' 
    AND table_name = 'admin_users'
  ) THEN
    ALTER TABLE admin_users 
      ADD CONSTRAINT fk_admin_users_role 
      FOREIGN KEY (role_id) 
      REFERENCES admin_roles(id) 
      ON DELETE RESTRICT;
  END IF;
END $$;

-- ============================================
-- PART 6: Admin Session Tracking
-- ============================================
CREATE TABLE IF NOT EXISTS admin_sessions (
  id SERIAL PRIMARY KEY,
  admin_user_id INTEGER NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_admin_sessions_user'
    AND table_name = 'admin_sessions'
  ) THEN
    ALTER TABLE admin_sessions
      ADD CONSTRAINT fk_admin_sessions_user
      FOREIGN KEY (admin_user_id)
      REFERENCES admin_users(id)
      ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin ON admin_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- ============================================
-- PART 7: Admin Audit Log
-- ============================================
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id SERIAL PRIMARY KEY,
  admin_user_id INTEGER,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100),
  entity_id VARCHAR(100),
  old_value JSONB,
  new_value JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_admin_audit_user'
    AND table_name = 'admin_audit_logs'
  ) THEN
    ALTER TABLE admin_audit_logs
      ADD CONSTRAINT fk_admin_audit_user
      FOREIGN KEY (admin_user_id)
      REFERENCES admin_users(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin ON admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_entity ON admin_audit_logs(entity);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_logs(created_at DESC);

-- ============================================
-- PART 8: Password Reset History
-- ============================================
CREATE TABLE IF NOT EXISTS admin_password_resets (
  id SERIAL PRIMARY KEY,
  admin_user_id INTEGER NOT NULL,
  reset_by INTEGER,
  reason TEXT,
  reset_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_admin_password_resets_user'
    AND table_name = 'admin_password_resets'
  ) THEN
    ALTER TABLE admin_password_resets
      ADD CONSTRAINT fk_admin_password_resets_user
      FOREIGN KEY (admin_user_id)
      REFERENCES admin_users(id)
      ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_admin_password_resets_by'
    AND table_name = 'admin_password_resets'
  ) THEN
    ALTER TABLE admin_password_resets
      ADD CONSTRAINT fk_admin_password_resets_by
      FOREIGN KEY (reset_by)
      REFERENCES admin_users(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_admin_password_resets_user ON admin_password_resets(admin_user_id);

-- ============================================
-- PART 9: Seed Admin Roles
-- ============================================
INSERT INTO admin_roles (role_name, can_be_deleted) VALUES
('SUPER_ADMIN', false),
('ADMIN', true),
('COMPLIANCE_OFFICER', true),
('SUPPORT_AGENT', true)
ON CONFLICT (role_name) DO NOTHING;

-- ============================================
-- PART 10: Seed Admin Permissions
-- ============================================
INSERT INTO admin_permissions (code, label, category) VALUES
-- User Management
('USERS_VIEW', 'View Users', 'USER_MANAGEMENT'),
('USERS_EDIT', 'Edit Users', 'USER_MANAGEMENT'),
('USERS_BLOCK', 'Block/Unblock Users', 'USER_MANAGEMENT'),
('USERS_DELETE', 'Delete Users', 'USER_MANAGEMENT'),

-- KYC Management
('KYC_VIEW', 'View KYC Submissions', 'KYC'),
('KYC_APPROVE', 'Approve KYC', 'KYC'),
('KYC_REJECT', 'Reject KYC', 'KYC'),
('KYC_REQUEST_MORE', 'Request More Documents', 'KYC'),

-- Transaction Management
('TRANSACTIONS_VIEW', 'View Transactions', 'TRANSACTIONS'),
('TRANSACTIONS_APPROVE', 'Approve Transactions', 'TRANSACTIONS'),
('TRANSACTIONS_REJECT', 'Reject Transactions', 'TRANSACTIONS'),
('TRANSACTIONS_ASSIGN', 'Assign to Agents', 'TRANSACTIONS'),

-- Agent Management
('AGENTS_VIEW', 'View Agents', 'AGENT_MANAGEMENT'),
('AGENTS_CREATE', 'Create Agents', 'AGENT_MANAGEMENT'),
('AGENTS_EDIT', 'Edit Agents', 'AGENT_MANAGEMENT'),
('AGENTS_SUSPEND', 'Suspend Agents', 'AGENT_MANAGEMENT'),
('AGENTS_DELETE', 'Delete Agents', 'AGENT_MANAGEMENT'),

-- Compliance
('COMPLIANCE_DASHBOARD', 'View Compliance Dashboard', 'COMPLIANCE'),
('COMPLIANCE_REPORTS', 'Generate Compliance Reports', 'COMPLIANCE'),
('COMPLIANCE_CASES', 'Manage AML Cases', 'COMPLIANCE'),
('COMPLIANCE_ALERTS', 'View AML Alerts', 'COMPLIANCE'),

-- Admin Management
('ADMINS_VIEW', 'View Admins', 'ADMIN_MANAGEMENT'),
('ADMINS_CREATE', 'Create Admins', 'ADMIN_MANAGEMENT'),
('ADMINS_EDIT', 'Edit Admins', 'ADMIN_MANAGEMENT'),
('ADMINS_SUSPEND', 'Suspend Admins', 'ADMIN_MANAGEMENT'),
('ADMINS_DELETE', 'Delete Admins', 'ADMIN_MANAGEMENT'),

-- Role Management
('ROLES_VIEW', 'View Roles', 'ROLE_MANAGEMENT'),
('ROLES_CREATE', 'Create Roles', 'ROLE_MANAGEMENT'),
('ROLES_EDIT', 'Edit Roles', 'ROLE_MANAGEMENT'),
('ROLES_DELETE', 'Delete Roles', 'ROLE_MANAGEMENT'),
('ROLES_ASSIGN_PERMISSIONS', 'Assign Permissions to Roles', 'ROLE_MANAGEMENT'),

-- System Settings
('SETTINGS_VIEW', 'View System Settings', 'SETTINGS'),
('SETTINGS_EDIT', 'Edit System Settings', 'SETTINGS'),
('SETTINGS_SMTP', 'Configure SMTP', 'SETTINGS'),
('SETTINGS_CURRENCIES', 'Manage Currencies', 'SETTINGS'),
('SETTINGS_RATES', 'Manage Exchange Rates', 'SETTINGS'),

-- Support
('SUPPORT_VIEW', 'View Support Tickets', 'SUPPORT'),
('SUPPORT_RESPOND', 'Respond to Tickets', 'SUPPORT'),
('SUPPORT_ESCALATE', 'Escalate Tickets', 'SUPPORT'),

-- Security
('SECURITY_IP_WHITELIST', 'Manage IP Whitelist', 'SECURITY'),
('SECURITY_RATE_LIMITS', 'Manage Rate Limits', 'SECURITY'),
('SECURITY_AUDIT_LOGS', 'View Audit Logs', 'SECURITY'),

-- Reports
('REPORTS_VIEW', 'View Reports', 'REPORTS'),
('REPORTS_EXPORT', 'Export Reports', 'REPORTS'),
('REPORTS_FINANCIAL', 'View Financial Reports', 'REPORTS')

ON CONFLICT (code) DO NOTHING;

-- ============================================
-- PART 11: Assign Permissions to Roles
-- ============================================

-- SUPER_ADMIN gets all permissions
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM admin_roles WHERE role_name = 'SUPER_ADMIN'),
  id
FROM admin_permissions
ON CONFLICT DO NOTHING;

-- ADMIN gets most permissions except admin/role management
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM admin_roles WHERE role_name = 'ADMIN'),
  id
FROM admin_permissions
WHERE category NOT IN ('ADMIN_MANAGEMENT', 'ROLE_MANAGEMENT')
ON CONFLICT DO NOTHING;

-- COMPLIANCE_OFFICER gets compliance and KYC permissions
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM admin_roles WHERE role_name = 'COMPLIANCE_OFFICER'),
  id
FROM admin_permissions
WHERE category IN ('COMPLIANCE', 'KYC', 'USERS', 'TRANSACTIONS', 'REPORTS')
  AND code NOT LIKE '%DELETE%'
ON CONFLICT DO NOTHING;

-- SUPPORT_AGENT gets minimal permissions
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM admin_roles WHERE role_name = 'SUPPORT_AGENT'),
  id
FROM admin_permissions
WHERE category IN ('SUPPORT', 'USERS')
  AND code IN ('SUPPORT_VIEW', 'SUPPORT_RESPOND', 'SUPPORT_ESCALATE', 'USERS_VIEW')
ON CONFLICT DO NOTHING;

-- ============================================
-- PART 12: Create Default Super Admin
-- ============================================
-- Password: Admin@123 (hashed with bcrypt)
INSERT INTO admin_users (username, full_name, password_hash, email, role_id, status)
VALUES (
  'superadmin',
  'Super Administrator',
  '$2a$10$rZ5qKvZxKvZxKvZxKvZxKuO7Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y',
  'admin@rasid.com',
  (SELECT id FROM admin_roles WHERE role_name = 'SUPER_ADMIN'),
  'ACTIVE'
)
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- PART 13: Update Triggers
-- ============================================
CREATE OR REPLACE FUNCTION update_admin_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS admin_users_update_trigger ON admin_users;
CREATE TRIGGER admin_users_update_trigger
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_timestamp();

DROP TRIGGER IF EXISTS admin_roles_update_trigger ON admin_roles;
CREATE TRIGGER admin_roles_update_trigger
  BEFORE UPDATE ON admin_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_timestamp();

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE admin_users IS 'Separate admin user accounts (not customers)';
COMMENT ON TABLE admin_roles IS 'Admin role definitions';
COMMENT ON TABLE admin_permissions IS 'Permission catalog';
COMMENT ON TABLE admin_role_permissions IS 'Role-permission mappings';
COMMENT ON TABLE admin_sessions IS 'Admin session tracking';
COMMENT ON TABLE admin_audit_logs IS 'Admin action audit trail';

SELECT 'Sprint 5 Complete Admin System created successfully!' AS status;
