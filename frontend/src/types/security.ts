// Security-related TypeScript interfaces

export interface LoginHistoryEntry {
  id: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  status: 'success' | 'failed';
  deviceType: string;
  browser: string;
  os: string;
}

export interface LoginHistoryResponse {
  success: boolean;
  data: LoginHistoryEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface Session {
  id: string;
  deviceType: string;
  browser: string;
  os: string;
  ipAddress: string;
  location?: string;
  lastActive: string;
  isCurrent: boolean;
  createdAt: string;
}

export interface SessionsResponse {
  success: boolean;
  data: Session[];
}

export interface TwoFactorStatus {
  enabled: boolean;
  qrCode?: string;
  secret?: string;
  backupCodes?: string[];
}

export interface TwoFactorStatusResponse {
  success: boolean;
  data: TwoFactorStatus;
}

export interface TwoFactorEnableResponse {
  success: boolean;
  data: {
    qrCode: string;
    secret: string;
  };
}

export interface TwoFactorVerifyResponse {
  success: boolean;
  data: {
    backupCodes: string[];
  };
  message: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface PasswordChangeResponse {
  success: boolean;
  message: string;
}
