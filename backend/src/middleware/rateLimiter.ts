import rateLimit from 'express-rate-limit';
import prisma from '../lib/prisma';
import { Request, Response, NextFunction } from 'express';

// Store for dynamic rate limiters
const rateLimiters = new Map<string, any>();

// Create rate limiter from database config
const createRateLimiter = (config: any) => {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.maxRequests,
    message: {
      success: false,
      message: config.message || 'Too many requests, please try again later.',
      retryAfter: Math.ceil(config.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// Dynamic rate limiting middleware
export const dynamicRateLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const endpoint = req.route?.path || req.path;
    const method = req.method;
    const fullPath = req.originalUrl || req.path;
    
    // Look for rate limit config in database
    const rateLimitConfigs = await prisma.rateLimit.findMany({
      where: { isActive: true },
      orderBy: [
        { endpoint: 'desc' }, // Specific endpoints first
        { method: 'desc' }    // Specific methods first
      ]
    });
    
    // Find the most specific matching config
    let rateLimitConfig = null;
    
    for (const config of rateLimitConfigs) {
      const configEndpoint = config.endpoint;
      const configMethod = config.method;
      
      // Check method match
      const methodMatches = configMethod === 'ALL' || configMethod === method;
      if (!methodMatches) continue;
      
      // Check endpoint match
      let endpointMatches = false;
      
      if (configEndpoint === endpoint) {
        // Exact match
        endpointMatches = true;
      } else if (configEndpoint.endsWith('*')) {
        // Wildcard match
        const prefix = configEndpoint.slice(0, -1);
        endpointMatches = fullPath.startsWith(prefix) || endpoint.startsWith(prefix);
      } else if (configEndpoint === '*') {
        // Global match
        endpointMatches = true;
      }
      
      if (endpointMatches) {
        rateLimitConfig = config;
        break; // Use first (most specific) match
      }
    }

    if (!rateLimitConfig) {
      // No rate limit configured, proceed
      return next();
    }

    // Log rate limit application (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[RATE LIMIT] ${method} ${fullPath} -> ${rateLimitConfig.endpoint} (${rateLimitConfig.maxRequests}/${rateLimitConfig.windowMs}ms)`);
    }

    // Create cache key
    const cacheKey = `${rateLimitConfig.endpoint}:${rateLimitConfig.method}:${rateLimitConfig.id}`;
    
    // Get or create rate limiter for this config
    let limiter = rateLimiters.get(cacheKey);
    if (!limiter) {
      limiter = createRateLimiter(rateLimitConfig);
      rateLimiters.set(cacheKey, limiter);
      
      // Clear cache after window expires to pick up config changes
      setTimeout(() => {
        rateLimiters.delete(cacheKey);
      }, rateLimitConfig.windowMs + 60000); // Add 1 minute buffer
    }

    // Apply rate limiting
    limiter(req, res, next);
    
  } catch (error) {
    console.error('Rate limiting error:', error);
    // If rate limiting fails, don't block the request
    next();
  }
};

// Specific rate limiter for login endpoint
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: true
});

// Clear all cached rate limiters (useful for config updates)
export const clearRateLimitCache = () => {
  rateLimiters.clear();
};
