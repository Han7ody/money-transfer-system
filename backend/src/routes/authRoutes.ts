
import express from 'express';
import * as authController from '../controllers/authController';
import { verifyToken } from '../middleware/auth';
import prisma from '../lib/prisma';
import bcrypt from 'bcrypt';
import { generateToken } from '../middleware/auth';
import { uploadKycDocuments, handleUploadError } from '../middleware/upload';
import emailService from '../services/emailService';

const router = express.Router();

// Register - Step 1: Create account with email/password
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Validation
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and password are required'
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user with minimal info
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        // phone is intentionally omitted, will be set in profile step
        passwordHash,
        country: '', // Will be set in profile step
        role: 'USER',
        isVerified: false,
        verificationOtp: otp,
        verificationOtpExpiresAt: otpExpiresAt
      }
    });

    // Send OTP email
    await emailService.sendVerificationEmail(user.email, user.fullName, otp);
    console.log(`OTP for ${email}: ${otp}`); // For development

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      success: true,
      message: 'Account created. Please verify your email.',
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          isVerified: user.isVerified
        },
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// Resend OTP (for unauthenticated users during registration)
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationOtp: otp,
        verificationOtpExpiresAt: otpExpiresAt
      }
    });

    // Send OTP email
    // await sendVerificationOtpEmail(user.email, otp);
    console.log(`New OTP for ${email}: ${otp}`);

    res.json({
      success: true,
      message: 'Verification code sent'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification code'
    });
  }
});

// Verify OTP during registration (Step 1B)
router.post('/verify-registration-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.verificationOtp || !user.verificationOtpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: 'No pending verification'
      });
    }

    if (user.verificationOtpExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request a new one.'
      });
    }

    if (user.verificationOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Mark as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationOtp: null,
        verificationOtpExpiresAt: null
      }
    });

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: { token }
    });
  } catch (error) {
    console.error('Verify registration OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed'
    });
  }
});

// Update profile (Step 2)
router.put('/profile', verifyToken, async (req: any, res) => {
  try {
    const { phone, country, city, dateOfBirth, nationality } = req.body;
    const userId = req.user.id;

    // Validation
    if (!phone || !country || !city || !dateOfBirth || !nationality) {
      return res.status(400).json({
        success: false,
        message: 'All profile fields are required'
      });
    }

    // Check phone uniqueness
    if (phone) {
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone,
          id: {
            not: userId
          }
        }
      });

      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already in use'
        });
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        phone,
        country,
        city,
        dateOfBirth: new Date(dateOfBirth),
        nationality
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        country: true,
        city: true,
        dateOfBirth: true,
        nationality: true,
        isVerified: true,
        kycStatus: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check maintenance mode BEFORE allowing login for non-admins
    const maintenanceSetting = await prisma.systemSettings.findUnique({
      where: { key: 'maintenance_mode' }
    });
    
    console.log('[Login] Checking maintenance mode...');
    console.log('[Login] maintenanceSetting:', maintenanceSetting);
    console.log('[Login] maintenanceSetting?.value:', maintenanceSetting?.value);
    console.log('[Login] Is string "true"?', maintenanceSetting?.value === 'true');
    
    // Ensure maintenance_mode record exists, initialize to false if not
    let isMaintenanceMode = false;
    if (maintenanceSetting?.value === 'true') {
      isMaintenanceMode = true;
      console.log('[Login] Maintenance mode is ON');
    } else if (!maintenanceSetting) {
      console.log('[Login] maintenance_mode record not found, creating...');
      // If record doesn't exist, create it with false value
      try {
        await prisma.systemSettings.create({
          data: {
            key: 'maintenance_mode',
            value: 'false',
            category: 'general'
          }
        });
      } catch (error) {
        // Record might have been created by another request, that's fine
        console.log('Could not create maintenance_mode setting:', error);
      }
      isMaintenanceMode = false;
    } else {
      console.log('[Login] Maintenance mode is OFF');
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('[Login] User found:', user.email, 'Role:', user.role);
    console.log('[Login] isMaintenanceMode:', isMaintenanceMode);
    console.log('[Login] User role !== ADMIN:', user.role !== 'ADMIN');
    console.log('[Login] User role !== SUPER_ADMIN:', user.role !== 'SUPER_ADMIN');

    // Block non-admin users during maintenance mode
    if (isMaintenanceMode && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      console.log('[Login] BLOCKING user - maintenance is ON and user is not admin');
      return res.status(503).json({
        success: false,
        message: 'The system is currently under maintenance. Please try again later.',
        maintenance: true,
        statusCode: 503
      });
    }

    console.log('[Login] User allowed to proceed');

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Set token as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax', // Use 'lax' for localhost, 'none' for production with HTTPS
      secure: false, // Set to true in production with HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified,
          kycStatus: user.kycStatus
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Get current user
router.get('/me', verifyToken, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        country: true,
        city: true,
        dateOfBirth: true,
        nationality: true,
        isVerified: true,
        kycStatus: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user data'
    });
  }
});

router.post('/change-password', verifyToken, authController.changePassword);
router.post('/send-verification-otp', verifyToken, authController.sendVerificationOtp);
router.post('/verify-otp', verifyToken, authController.verifyOtp);

// Forgot & Reset Password
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// KYC Upload (Step 3)
router.post(
  '/kyc-upload',
  verifyToken,
  uploadKycDocuments,
  handleUploadError,
  authController.uploadKycDocuments
);

// Get current user
router.get('/me', verifyToken, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        isActive: true,
        kycStatus: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user data'
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: false
  });
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;
