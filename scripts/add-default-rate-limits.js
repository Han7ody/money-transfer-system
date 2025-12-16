const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addDefaultRateLimits() {
  try {
    console.log('Adding default rate limits...');

    // Login rate limit
    await prisma.rateLimit.upsert({
      where: { 
        endpoint_method: {
          endpoint: '/api/auth/login',
          method: 'POST'
        }
      },
      update: {},
      create: {
        endpoint: '/api/auth/login',
        method: 'POST',
        maxRequests: 5,
        windowMs: 900000, // 15 minutes
        message: 'Too many login attempts. Please try again in 15 minutes.',
        isActive: true
      }
    });

    // Register rate limit
    await prisma.rateLimit.upsert({
      where: { 
        endpoint_method: {
          endpoint: '/api/auth/register',
          method: 'POST'
        }
      },
      update: {},
      create: {
        endpoint: '/api/auth/register',
        method: 'POST',
        maxRequests: 3,
        windowMs: 3600000, // 1 hour
        message: 'Too many registration attempts. Please try again in 1 hour.',
        isActive: true
      }
    });

    // Forgot password rate limit
    await prisma.rateLimit.upsert({
      where: { 
        endpoint_method: {
          endpoint: '/api/auth/forgot-password',
          method: 'POST'
        }
      },
      update: {},
      create: {
        endpoint: '/api/auth/forgot-password',
        method: 'POST',
        maxRequests: 3,
        windowMs: 3600000, // 1 hour
        message: 'Too many password reset attempts. Please try again in 1 hour.',
        isActive: true
      }
    });

    // Admin API rate limit
    await prisma.rateLimit.upsert({
      where: { 
        endpoint_method: {
          endpoint: '/api/admin/*',
          method: 'ALL'
        }
      },
      update: {},
      create: {
        endpoint: '/api/admin/*',
        method: 'ALL',
        maxRequests: 200,
        windowMs: 60000, // 1 minute
        message: 'Too many admin API requests. Please slow down.',
        isActive: true
      }
    });

    // Transaction API rate limit
    await prisma.rateLimit.upsert({
      where: { 
        endpoint_method: {
          endpoint: '/api/transactions',
          method: 'POST'
        }
      },
      update: {},
      create: {
        endpoint: '/api/transactions',
        method: 'POST',
        maxRequests: 10,
        windowMs: 60000, // 1 minute
        message: 'Too many transaction creation attempts. Please wait.',
        isActive: true
      }
    });

    // General API rate limit (high limit, safety net)
    await prisma.rateLimit.upsert({
      where: { 
        endpoint_method: {
          endpoint: '/api/*',
          method: 'ALL'
        }
      },
      update: {},
      create: {
        endpoint: '/api/*',
        method: 'ALL',
        maxRequests: 1000,
        windowMs: 60000, // 1 minute
        message: 'Rate limit exceeded. Please slow down.',
        isActive: true
      }
    });

    console.log('✅ Default rate limits added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding default rate limits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDefaultRateLimits();
