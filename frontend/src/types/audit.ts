// Audit Log TypeScript interfaces

export interface AuditLog {
  id: number;
  adminId: number;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  admin?: {
    fullName: string;
    email: string;
  };
}

export interface AuditLogStats {
  totalLogs: number;
  logsByAction: Record<string, number>;
  logsByEntity: Record<string, number>;
  logsByAdmin: Array<{
    adminId: number;
    adminName: string;
    count: number;
  }>;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  action?: string;
  entity?: string;
  adminId?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface AuditLogResponse {
  success: boolean;
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
}
