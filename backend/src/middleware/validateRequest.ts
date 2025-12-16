// backend/src/middleware/validateRequest.ts
/**
 * Request validation middleware
 * Validates request body, params, and query
 */

import { Request, Response, NextFunction } from 'express';
import { sendValidationError } from '../utils/response';

export interface ValidationSchema {
  body?: Record<string, ValidationRule>;
  params?: Record<string, ValidationRule>;
  query?: Record<string, ValidationRule>;
}

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'phone';
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

/**
 * Validate request against schema
 */
export const validateRequest = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, string> = {};

    // Validate body
    if (schema.body) {
      Object.entries(schema.body).forEach(([field, rule]) => {
        const value = req.body[field];
        const error = validateField(value, field, rule);
        if (error) errors[field] = error;
      });
    }

    // Validate params
    if (schema.params) {
      Object.entries(schema.params).forEach(([field, rule]) => {
        const value = req.params[field];
        const error = validateField(value, field, rule);
        if (error) errors[field] = error;
      });
    }

    // Validate query
    if (schema.query) {
      Object.entries(schema.query).forEach(([field, rule]) => {
        const value = req.query[field];
        const error = validateField(value, field, rule);
        if (error) errors[field] = error;
      });
    }

    if (Object.keys(errors).length > 0) {
      return sendValidationError(res, 'Validation failed', errors);
    }

    next();
  };
};

/**
 * Validate individual field
 */
const validateField = (value: any, fieldName: string, rule: ValidationRule): string | null => {
  // Check required
  if (rule.required && (value === undefined || value === null || value === '')) {
    return `${fieldName} is required`;
  }

  // Skip further validation if not required and empty
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return null;
  }

  // Type validation
  if (rule.type) {
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') return `${fieldName} must be a string`;
        break;
      case 'number':
        if (isNaN(Number(value))) return `${fieldName} must be a number`;
        break;
      case 'boolean':
        if (typeof value !== 'boolean') return `${fieldName} must be a boolean`;
        break;
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `${fieldName} must be a valid email`;
        break;
      case 'phone':
        if (!/^\+?[1-9]\d{1,14}$/.test(value.replace(/[\s-]/g, ''))) return `${fieldName} must be a valid phone`;
        break;
    }
  }

  // Min/Max validation
  if (rule.min !== undefined) {
    if (typeof value === 'string' && value.length < rule.min) {
      return `${fieldName} must be at least ${rule.min} characters`;
    }
    if (typeof value === 'number' && value < rule.min) {
      return `${fieldName} must be at least ${rule.min}`;
    }
  }

  if (rule.max !== undefined) {
    if (typeof value === 'string' && value.length > rule.max) {
      return `${fieldName} must be at most ${rule.max} characters`;
    }
    if (typeof value === 'number' && value > rule.max) {
      return `${fieldName} must be at most ${rule.max}`;
    }
  }

  // Pattern validation
  if (rule.pattern && !rule.pattern.test(value)) {
    return `${fieldName} format is invalid`;
  }

  // Custom validation
  if (rule.custom) {
    const result = rule.custom(value);
    if (typeof result === 'string') return result;
    if (result === false) return `${fieldName} is invalid`;
  }

  return null;
};
