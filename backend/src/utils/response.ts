// backend/src/utils/response.ts
/**
 * Standardized API Response Utilities
 * Ensures consistent response format across all endpoints
 */

import { Response } from 'express';

export interface SuccessResponse<T = any> {
  success: true;
  message?: string;
  data?: T;
}

export interface ErrorResponse {
  success: false;
  message: string;
  statusCode?: number;
  errors?: any[];
}

export interface PaginatedResponse<T = any> {
  success: true;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Send success response
 */
export const sendSuccess = <T = any>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = 200
): Response => {
  const response: SuccessResponse<T> = {
    success: true,
    ...(message && { message }),
    ...(data !== undefined && { data })
  };

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  details?: any
): Response => {
  const response: ErrorResponse = {
    success: false,
    message,
    statusCode,
    ...(details && { errors: details })
  };

  return res.status(statusCode).json(response);
};

/**
 * Standardized error response helpers
 */
export const sendBadRequest = (res: Response, message: string, details?: any): Response =>
  sendError(res, message, 400, details);

export const sendUnauthorized = (res: Response, message = 'Unauthorized'): Response =>
  sendError(res, message, 401);

export const sendForbidden = (res: Response, message = 'Forbidden - Insufficient permissions'): Response =>
  sendError(res, message, 403);

export const sendNotFound = (res: Response, message: string): Response =>
  sendError(res, message, 404);

export const sendConflict = (res: Response, message: string, details?: any): Response =>
  sendError(res, message, 409, details);

export const sendValidationError = (res: Response, message: string, details?: any): Response =>
  sendError(res, message, 400, details);

/**
 * Send paginated response
 */
export const sendPaginated = <T = any>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  statusCode: number = 200
): Response => {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };

  return res.status(statusCode).json(response);
};

/**
 * Send created response (201)
 */
export const sendCreated = <T = any>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully'
): Response => {
  return sendSuccess(res, data, message, 201);
};

/**
 * Send no content response (204)
 */
export const sendNoContent = (res: Response): Response => {
  return res.status(204).send();
};
