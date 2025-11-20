import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Update current user profile
export const updateCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const { fullName, phone, country } = req.body;
    const userId = req.user!.id;

    if (!fullName || !phone || !country) {
      return res.status(400).json({ success: false, message: 'Full name, phone, and country are required.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { fullName, phone, country },
      select: {
        id: true, fullName: true, email: true, phone: true, country: true, role: true, createdAt: true,
        notificationsOnEmail: true, notificationsOnSms: true, notificationsOnTransactionUpdate: true, notificationsOnMarketing: true
      }
    });

    res.json({ success: true, message: 'Profile updated successfully.', data: updatedUser });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

// Update notification settings
export const updateNotificationSettings = async (req: AuthRequest, res: Response) => {
  try {
    const {
      notificationsOnEmail,
      notificationsOnSms,
      notificationsOnTransactionUpdate,
      notificationsOnMarketing,
    } = req.body;
    const userId = req.user!.id;

    const dataToUpdate = {
      notificationsOnEmail: !!notificationsOnEmail,
      notificationsOnSms: !!notificationsOnSms,
      notificationsOnTransactionUpdate: !!notificationsOnTransactionUpdate,
      notificationsOnMarketing: !!notificationsOnMarketing,
    };

    await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    res.json({ success: true, message: 'Notification settings updated successfully.' });

  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings.' });
  }
};