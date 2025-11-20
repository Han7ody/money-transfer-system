import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth';
import { sendVerificationOtpEmail, sendPasswordResetEmail } from '../utils/email';

const prisma = new PrismaClient();

// Change Password for logged-in user
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required.' });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid current password.' });
    }
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
};

// Generate and send a verification OTP
export const sendVerificationOtp = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await prisma.user.update({
      where: { id: userId },
      data: { verificationOtp: otp, verificationOtpExpiresAt: expiresAt },
    });
    await sendVerificationOtpEmail(user.email, otp);
    res.json({ success: true, message: `A verification code has been sent to ${user.email}.` });
  } catch (error) {
    console.error('Send verification OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send verification code.' });
  }
};

// Verify the OTP
export const verifyOtp = async (req: AuthRequest, res: Response) => {
  try {
    const { otp } = req.body;
    const userId = req.user!.id;
    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required.' });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.verificationOtp || !user.verificationOtpExpiresAt) {
      return res.status(400).json({ success: false, message: 'No pending verification found.' });
    }
    if (user.verificationOtpExpiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }
    if (user.verificationOtp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }
    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true, verificationOtp: null, verificationOtpExpiresAt: null },
    });
    res.json({ success: true, message: 'Account verified successfully.' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP.' });
  }
};

// Forgot Password - Step 1: Send reset link
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      const passwordResetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken, passwordResetTokenExpiresAt },
      });
      try {
        await sendPasswordResetEmail(user.email, resetToken);
      } catch (emailError) {
        console.error("Could not send password reset email:", emailError);
      }
    }
    res.json({ success: true, message: 'If an account with this email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'An internal error occurred.' });
  }
};

// Reset Password - Step 2: Verify token and update password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    }
    const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken,
        passwordResetTokenExpiresAt: { gt: new Date() },
      },
    });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token.' });
    }
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        passwordResetToken: null,
        passwordResetTokenExpiresAt: null,
      },
    });
    res.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};