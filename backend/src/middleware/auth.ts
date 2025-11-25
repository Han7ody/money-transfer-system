// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logAdminAction, AuditActions, AuditEntities } from '../utils/auditLogger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

// Verify JWT Token
export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = req.cookies?.token;

    if (!token) {
      token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      email: string;
      role: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
};

// Authorize based on roles
export const authorize = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.role) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. User role not found.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      if (req.user) {
        logAdminAction({
            adminId: req.user.id,
            action: 'UNAUTHORIZED_ACCESS',
            entity: AuditEntities.AUTH,
            entityId: req.path,
            newValue: `Attempted to access with role ${req.user.role}`,
            req: req,
        });
      }
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to access this resource.'
      });
    }
    next();
  };
};

// Generate JWT Token
export const generateToken = (payload: { id: number; email: string; role: string }) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// Refresh Token
export const refreshToken = (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const newToken = generateToken({
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    });

    res.json({
      success: true,
      token: newToken
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to refresh token'
    });
  }
};