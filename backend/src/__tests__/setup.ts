// Test setup file
import { PrismaClient } from '@prisma/client';

// Mock Prisma client for tests
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    transaction: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    currency: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    exchangeRate: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    notification: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    transactionHistory: {
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

// Mock Redis
jest.mock('../utils/cache', () => ({
  initRedis: jest.fn(),
  getCache: jest.fn(),
  setCache: jest.fn(),
  deleteCache: jest.fn(),
  deleteCacheByPattern: jest.fn(),
  clearCache: jest.fn(),
  closeRedis: jest.fn(),
  cacheMiddleware: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

// Mock Winston logger
jest.mock('../utils/logger', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  morganStream: {
    write: jest.fn(),
  },
}));

// Set test environment variables
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// Global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Export helper functions for tests
export const mockUser = {
  id: 1,
  fullName: 'Test User',
  email: 'test@example.com',
  phone: '+1234567890',
  passwordHash: '$2b$10$abcdefghijklmnopqrstuv',
  role: 'USER',
  country: 'Test Country',
  isVerified: false,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockAdmin = {
  ...mockUser,
  id: 2,
  email: 'admin@example.com',
  role: 'ADMIN',
};

export const mockTransaction = {
  id: 1,
  userId: 1,
  transactionRef: '202501010001',
  senderName: 'John Doe',
  senderPhone: '+1234567890',
  senderCountry: 'USA',
  recipientName: 'Jane Smith',
  recipientPhone: '+9876543210',
  recipientBankName: 'Test Bank',
  recipientAccountNumber: '123456789',
  recipientCountry: 'India',
  fromCurrencyId: 1,
  toCurrencyId: 2,
  amountSent: 100,
  exchangeRate: 83.5,
  adminFee: 5,
  amountReceived: 8350,
  status: 'PENDING',
  receiptFilePath: null,
  receiptUploadedAt: null,
  reviewedBy: null,
  reviewedAt: null,
  adminNotes: null,
  rejectionReason: null,
  paymentMethod: null,
  paymentReference: null,
  completedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};
