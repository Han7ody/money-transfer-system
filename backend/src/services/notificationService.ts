// backend/src/services/notificationService.ts
/**
 * Notification Service
 * Handles all notification-related business logic
 * Eliminates duplicate notification creation code across controllers
 */

import prisma from '../lib/prisma';
import { NotFoundError } from '../utils/errors';

export interface CreateNotificationParams {
  userId: number;
  title: string;
  message: string;
  transactionId?: number;
}

export class NotificationService {
  /**
   * Create a notification for a user
   * Centralized method to eliminate duplicate code
   */
  async createNotification(params: CreateNotificationParams): Promise<void> {
    const { userId, title, message, transactionId } = params;

    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        ...(transactionId && { transactionId }),
        isRead: false
      }
    });
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(userId: number, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.notification.count({ where: { userId } })
    ]);

    return {
      notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number, userId: number): Promise<void> {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: number): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: number): Promise<number> {
    return await prisma.notification.count({
      where: { userId, isRead: false }
    });
  }

  /**
   * Delete old notifications (cleanup utility)
   */
  async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true
      }
    });

    return result.count;
  }
}

export default new NotificationService();
