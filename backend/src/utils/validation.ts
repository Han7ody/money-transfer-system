// backend/src/utils/validation.ts
/**
 * Common validation utilities
 */

export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate required fields
 */
export const validateRequired = (fields: Record<string, any>, fieldNames: string[]): void => {
  const missing = fieldNames.filter(name => !fields[name] || (typeof fields[name] === 'string' && fields[name].trim() === ''));
  
  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      { missingFields: missing }
    );
  }
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone format (basic)
 */
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
};

/**
 * Validate positive number
 */
export const validatePositiveNumber = (value: any, fieldName: string): void => {
  const num = Number(value);
  if (isNaN(num) || num <= 0) {
    throw new ValidationError(`${fieldName} must be a positive number`);
  }
};

/**
 * Validate number range
 */
export const validateRange = (value: any, min: number, max: number, fieldName: string): void => {
  const num = Number(value);
  if (isNaN(num) || num < min || num > max) {
    throw new ValidationError(`${fieldName} must be between ${min} and ${max}`);
  }
};

/**
 * Validate string length
 */
export const validateLength = (value: string, min: number, max: number, fieldName: string): void => {
  if (value.length < min || value.length > max) {
    throw new ValidationError(`${fieldName} must be between ${min} and ${max} characters`);
  }
};

/**
 * Sanitize string input
 */
export const sanitizeString = (value: string): string => {
  return value.trim().replace(/[<>]/g, '');
};
