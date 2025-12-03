// System Settings TypeScript interfaces

export interface SystemSettings {
  platformName: string;
  timezone: string;
  defaultLanguage: 'ar' | 'en';
  maintenanceMode: boolean;
  supportEmail: string;
  supportPhone: string;
  companyAddress: string;
  dateFormat: string;
  timeFormat: string;
}

export const TIMEZONES = [
  'Africa/Cairo',
  'Asia/Dubai',
  'Asia/Riyadh',
  'Asia/Kuwait',
  'Asia/Bahrain',
  'Asia/Qatar',
  'Asia/Amman',
  'Asia/Beirut',
  'Europe/Istanbul',
  'UTC'
];

export const DATE_FORMATS = [
  'YYYY-MM-DD',
  'DD/MM/YYYY',
  'MM/DD/YYYY',
  'DD-MM-YYYY',
  'YYYY/MM/DD'
];

export const TIME_FORMATS = [
  '24h',
  '12h'
];

export interface SystemSettingsResponse {
  success: boolean;
  data: SystemSettings;
  message?: string;
}

export interface LogoUploadResponse {
  success: boolean;
  data: {
    logoUrl: string;
  };
  message?: string;
}
