import { Request, Response, NextFunction } from 'express';
import { sessionService } from '../services/SessionService';
import { sendError } from '../utils/response';

/**
 * Middleware to track session activity and enforce timeout
 */
export const sessionActivityMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as any).user;

  // Skip if no user (public routes) or no sessionId (legacy tokens)
  if (!user) {
    return next();
  }

  // If user has no sessionId, it's a legacy token - allow but warn
  if (!user.sessionId) {
    console.warn('[SessionActivity] Legacy token detected - please re-login to enable session tracking');
    return next();
  }

  try {
    // Validate session is still active
    const isValid = await sessionService.validateSession(user.sessionId);

    if (!isValid) {
      return sendError(res, 'Session expired. Please login again.', 401);
    }

    // Update last activity
    await sessionService.updateActivity(user.sessionId);

    next();
  } catch (error) {
    console.error('[SessionActivity] Error:', error);
    next(); // Don't block request on session update failure
  }
};
