import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../server';
import { mockUser, mockAdmin } from '../setup';

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

describe('Authentication Tests', () => {

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        fullName: 'Test User',
        email: 'newuser@example.com',
        phone: '+1234567890',
        password: 'Test@1234',
        country: 'USA',
      };

      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        ...mockUser,
        email: newUser.email,
        fullName: newUser.fullName,
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(newUser.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('should fail with weak password', async () => {
      const newUser = {
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'weak',
        country: 'USA',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid email', async () => {
      const newUser = {
        fullName: 'Test User',
        email: 'invalid-email',
        phone: '+1234567890',
        password: 'Test@1234',
        country: 'USA',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail if user already exists', async () => {
      const existingUser = {
        fullName: 'Test User',
        email: 'existing@example.com',
        phone: '+1234567890',
        password: 'Test@1234',
        country: 'USA',
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send(existingUser);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'Test@1234',
      };

      const hashedPassword = await bcrypt.hash(credentials.password, 10);

      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: hashedPassword,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(credentials.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('should fail with wrong password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'WrongPassword@123',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent user', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'Test@1234',
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with deactivated account', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'Test@1234',
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid email format', async () => {
      const credentials = {
        email: 'invalid-email',
        password: 'Test@1234',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with missing password', async () => {
      const credentials = {
        email: 'test@example.com',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
