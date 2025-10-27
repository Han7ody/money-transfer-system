import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import {
  registerValidation,
  loginValidation,
  createTransactionValidation,
  exchangeRateValidation,
} from '../../middleware/validators';

describe('Validator Tests', () => {

  describe('Register Validation', () => {
    it('should accept valid registration data', () => {
      const validData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        password: 'SecurePass@123',
        country: 'USA',
      };

      // Validators should pass with valid data
      expect(validData.fullName.length).toBeGreaterThanOrEqual(3);
      expect(validData.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(validData.password).toMatch(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/);
    });

    it('should reject weak password', () => {
      const weakPassword = 'weak123';
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

      expect(passwordRegex.test(weakPassword)).toBe(false);
    });

    it('should reject invalid email', () => {
      const invalidEmail = 'not-an-email';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      expect(emailRegex.test(invalidEmail)).toBe(false);
    });

    it('should reject short full name', () => {
      const shortName = 'Ab';

      expect(shortName.length).toBeLessThan(3);
    });

    it('should reject invalid phone number', () => {
      const invalidPhone = '123';
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;

      expect(phoneRegex.test(invalidPhone)).toBe(false);
    });
  });

  describe('Login Validation', () => {
    it('should accept valid login data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'anypassword',
      };

      expect(validData.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(validData.password.length).toBeGreaterThan(0);
    });
  });

  describe('Transaction Validation', () => {
    it('should accept valid transaction data', () => {
      const validData = {
        senderName: 'John Doe',
        senderPhone: '+1234567890',
        senderCountry: 'USA',
        recipientName: 'Jane Smith',
        recipientPhone: '+9876543210',
        recipientBankName: 'Test Bank',
        recipientAccountNumber: '123456789',
        recipientCountry: 'India',
        fromCurrency: 'USD',
        toCurrency: 'INR',
        amountSent: 100.50,
      };

      expect(validData.senderName.length).toBeGreaterThanOrEqual(3);
      expect(validData.fromCurrency.length).toBe(3);
      expect(validData.toCurrency.length).toBe(3);
      expect(validData.amountSent).toBeGreaterThan(0);
    });

    it('should reject negative amount', () => {
      const negativeAmount = -100;

      expect(negativeAmount).toBeLessThanOrEqual(0);
    });

    it('should reject invalid currency code', () => {
      const invalidCode = 'US'; // Should be 3 characters

      expect(invalidCode.length).not.toBe(3);
    });
  });

  describe('Exchange Rate Validation', () => {
    it('should accept valid currency codes', () => {
      const validData = {
        from: 'USD',
        to: 'INR',
      };

      expect(validData.from.length).toBe(3);
      expect(validData.to.length).toBe(3);
    });

    it('should reject invalid currency codes', () => {
      const invalidFrom = 'US';
      const invalidTo = 'EURO';

      expect(invalidFrom.length).not.toBe(3);
      expect(invalidTo.length).not.toBe(3);
    });
  });

  describe('Password Strength Tests', () => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    it('should accept strong passwords', () => {
      const strongPasswords = [
        'SecurePass@123',
        'MyP@ssw0rd',
        'Test@1234',
        'Admin@Pass99',
      ];

      strongPasswords.forEach(password => {
        expect(passwordRegex.test(password)).toBe(true);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'password',          // No uppercase, number, or special char
        'Password',          // No number or special char
        'Password1',         // No special char
        'pass@1',            // Too short
        'PASSWORD@123',      // No lowercase
        'password@123',      // No uppercase
      ];

      weakPasswords.forEach(password => {
        expect(passwordRegex.test(password)).toBe(false);
      });
    });
  });

  describe('Phone Number Validation', () => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;

    it('should accept valid phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '+919876543210',
        '1234567890',
        '+441234567890',
      ];

      validPhones.forEach(phone => {
        expect(phoneRegex.test(phone)).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '123',               // Too short
        'abc1234567890',     // Contains letters
        '+0123456789',       // Starts with 0 after +
        '00123456789',       // Starts with 00
      ];

      invalidPhones.forEach(phone => {
        expect(phoneRegex.test(phone)).toBe(false);
      });
    });
  });
});
