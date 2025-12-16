export enum Permission {
  // Transaction Permissions
  TRANSACTION_VIEW = 'transaction:view',
  TRANSACTION_APPROVE = 'transaction:approve',
  TRANSACTION_REJECT = 'transaction:reject',
  TRANSACTION_CANCEL = 'transaction:cancel',
  TRANSACTION_ASSIGN_AGENT = 'transaction:assign_agent',
  TRANSACTION_BULK_APPROVE = 'transaction:bulk_approve',
  
  // KYC Permissions
  KYC_VIEW = 'kyc:view',
  KYC_APPROVE = 'kyc:approve',
  KYC_REJECT = 'kyc:reject',
  KYC_ESCALATE = 'kyc:escalate',
  KYC_BULK_APPROVE = 'kyc:bulk_approve',
  
  // User Permissions
  USER_VIEW = 'user:view',
  USER_BLOCK = 'user:block',
  USER_UNBLOCK = 'user:unblock',
  USER_EDIT = 'user:edit',
  
  // Agent Permissions
  AGENT_VIEW = 'agent:view',
  AGENT_CREATE = 'agent:create',
  AGENT_EDIT = 'agent:edit',
  AGENT_DELETE = 'agent:delete',
  AGENT_ASSIGN = 'agent:assign',
  
  // Settings Permissions
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_EDIT = 'settings:edit',
  EXCHANGE_RATE_UPDATE = 'settings:exchange_rate_update',
  
  // Admin Management
  ADMIN_CREATE = 'admin:create',
  ADMIN_EDIT = 'admin:edit',
  ADMIN_DELETE = 'admin:delete',
  ADMIN_VIEW = 'admin:view',
  
  // System Permissions
  AUDIT_LOG_VIEW = 'system:audit_log_view',
  SYSTEM_HEALTH_VIEW = 'system:health_view',
  IP_WHITELIST_MANAGE = 'system:ip_whitelist_manage',
  
  // Compliance Permissions
  COMPLIANCE_DASHBOARD_VIEW = 'compliance:dashboard_view',
  COMPLIANCE_REPORT_GENERATE = 'compliance:report_generate',
  FRAUD_INVESTIGATION = 'compliance:fraud_investigation',
  SANCTIONS_SCREENING = 'compliance:sanctions_screening',
}

export const RolePermissions: Record<string, Permission[]> = {
  SUPER_ADMIN: Object.values(Permission), // All permissions
  
  ADMIN: [
    Permission.TRANSACTION_VIEW,
    Permission.TRANSACTION_APPROVE,
    Permission.TRANSACTION_REJECT,
    Permission.TRANSACTION_ASSIGN_AGENT,
    Permission.KYC_VIEW,
    Permission.KYC_APPROVE,
    Permission.KYC_REJECT,
    Permission.USER_VIEW,
    Permission.USER_BLOCK,
    Permission.USER_UNBLOCK,
    Permission.AGENT_VIEW,
    Permission.AGENT_ASSIGN,
    Permission.SETTINGS_VIEW,
    Permission.AUDIT_LOG_VIEW,
    Permission.COMPLIANCE_DASHBOARD_VIEW,
  ],
  
  COMPLIANCE_OFFICER: [
    Permission.TRANSACTION_VIEW,
    Permission.KYC_VIEW,
    Permission.KYC_APPROVE,
    Permission.KYC_REJECT,
    Permission.KYC_ESCALATE,
    Permission.USER_VIEW,
    Permission.AUDIT_LOG_VIEW,
    Permission.COMPLIANCE_DASHBOARD_VIEW,
    Permission.COMPLIANCE_REPORT_GENERATE,
    Permission.FRAUD_INVESTIGATION,
    Permission.SANCTIONS_SCREENING,
  ],
  
  AGENT: [
    Permission.TRANSACTION_VIEW,
    Permission.AGENT_VIEW,
  ],
  
  USER: [],
};
