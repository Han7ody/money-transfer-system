/**
 * Typography & Number Formatting Utilities
 * Ensures all numbers display in English format (0-9)
 */

/**
 * Format number with English digits
 */
export const formatNumber = (num: number | string): string => {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';
  return n.toLocaleString('en-US');
};

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number | string, currency: string = 'SAR'): string => {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(n)) return '0';
  return `${n.toLocaleString('en-US')} ${currency}`;
};

/**
 * Format date in English format
 */
export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB'); // DD/MM/YYYY
};

/**
 * Format time in English format (24h)
 */
export const formatTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-GB', { hour12: false }); // HH:MM:SS
};

/**
 * Format datetime in English format
 */
export const formatDateTime = (date: string | Date): string => {
  return `${formatDate(date)} ${formatTime(date)}`;
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number): string => {
  return `${value.toLocaleString('en-US')}%`;
};

/**
 * Format phone number
 */
export const formatPhone = (phone: string): string => {
  // Already in English format, just ensure proper display
  return phone.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
};
