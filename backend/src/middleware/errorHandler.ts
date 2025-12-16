// backend/src/middleware/errorHandler.ts
/**
 * Global Error Handler Middleware
 * Catches all errors and sends standardized error responses
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';

/**
 * Global error handling middleware
 * Must be registered after all routes
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error for debugging
  console.error('[Error Handler]', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Handle AppError instances
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    
    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      sendError(res, 'A record with this value already exists', 409);
      return;
    }
    
    // Foreign key constraint violation
    if (prismaError.code === 'P2003') {
      sendError(res, 'Related record not found', 400);
      return;
    }
    
    // Record not found
    if (prismaError.code === 'P2025') {
      sendError(res, 'Record not found', 404);
      return;
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid token', 401);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    sendError(res, 'Token expired', 401);
    return;
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    sendError(res, err.message, 400);
    return;
  }

  // Handle multer errors (file upload)
  if (err.name === 'MulterError') {
    const multerError = err as any;
    if (multerError.code === 'LIMIT_FILE_SIZE') {
      sendError(res, 'File size too large', 400);
      return;
    }
    if (multerError.code === 'LIMIT_UNEXPECTED_FILE') {
      sendError(res, 'Unexpected file field', 400);
      return;
    }
  }

  // Default to 500 server error
  const statusCode = 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message || 'Something went wrong';

  sendError(res, message, statusCode);
};

/**
 * Async handler wrapper
 * Catches async errors and passes them to error handler
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler
 * Should be registered before error handler
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  sendError(res, `Route not found: ${req.method} ${req.path}`, 404);
};
