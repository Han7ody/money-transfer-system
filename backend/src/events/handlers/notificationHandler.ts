import { eventEmitter } from '../eventEmitter';
import { EventType, EventPayloadMap } from '../eventTypes';
import notificationService from '../../services/notificationService';
import prisma from '../../lib/prisma';

class NotificationHandler {
  initialize(): void {
    // Transaction events
    eventEmitter.on(EventType.TRANSACTION_CREATED, this.handleTransactionCreated);
    eventEmitter.on(EventType.TRANSACTION_APPROVED, this.handleTransactionApproved);
    eventEmitter.on(EventType.TRANSACTION_REJECTED, this.handleTransactionRejected);
    eventEmitter.on(EventType.TRANSACTION_COMPLETED, this.handleTransactionCompleted);
    eventEmitter.on(EventType.TRANSACTION_ASSIGNED_TO_AGENT, this.handleTransactionAssignedToAgent);
    eventEmitter.on(EventType.TRANSACTION_PICKUP_CONFIRMED, this.handleTransactionPickupConfirmed);
    
    // Agent events
    eventEmitter.on(EventType.AGENT_CREATED, this.handleAgentCreated);
    eventEmitter.on(EventType.AGENT_STATUS_CHANGED, this.handleAgentStatusChanged);
    
    // KYC events
    eventEmitter.on(EventType.KYC_SUBMITTED, this.handleKycSubmitted);
    eventEmitter.on(EventType.KYC_APPROVED, this.handleKycApproved);
    eventEmitter.on(EventType.KYC_REJECTED, this.handleKycRejected);

    console.log('[NotificationHandler] Initialized event listeners');
  }

  private handleTransactionCreated = async (
    payload: EventPayloadMap[EventType.TRANSACTION_CREATED]
  ): Promise<void> => {
    try {
      await this.notifyAdmins({
        title: 'New Transaction',
        message: `Transaction ${payload.transactionRef} created by ${payload.userName}`,
        type: 'transaction',
        metadata: { transactionId: payload.transactionId }
      });
    } catch (error) {
      console.error('Error handling transaction.created event:', error);
    }
  };

  private handleTransactionApproved = async (
    payload: EventPayloadMap[EventType.TRANSACTION_APPROVED]
  ): Promise<void> => {
    try {
      // Notify user
      await notificationService.createNotification({
        userId: payload.userId,
        title: 'Transaction Approved',
        message: `Your transaction ${payload.transactionRef} has been approved`,
        transactionId: payload.transactionId
      });

      // Notify admins
      await this.notifyAdmins({
        title: 'Transaction Approved',
        message: `${payload.approvedByName} approved transaction ${payload.transactionRef}`,
        type: 'transaction',
        metadata: { transactionId: payload.transactionId }
      });
    } catch (error) {
      console.error('Error handling transaction.approved event:', error);
    }
  };

  private handleTransactionRejected = async (
    payload: EventPayloadMap[EventType.TRANSACTION_REJECTED]
  ): Promise<void> => {
    try {
      // Notify user
      await notificationService.createNotification({
        userId: payload.userId,
        title: 'Transaction Rejected',
        message: `Your transaction ${payload.transactionRef} was rejected: ${payload.reason}`,
        transactionId: payload.transactionId
      });

      // Notify admins
      await this.notifyAdmins({
        title: 'Transaction Rejected',
        message: `${payload.rejectedByName} rejected transaction ${payload.transactionRef}`,
        type: 'transaction',
        metadata: { transactionId: payload.transactionId }
      });
    } catch (error) {
      console.error('Error handling transaction.rejected event:', error);
    }
  };

  private handleTransactionCompleted = async (
    payload: EventPayloadMap[EventType.TRANSACTION_COMPLETED]
  ): Promise<void> => {
    try {
      await notificationService.createNotification({
        userId: payload.userId,
        title: 'Transaction Completed',
        message: `Your transaction ${payload.transactionRef} has been completed`,
        transactionId: payload.transactionId
      });
    } catch (error) {
      console.error('Error handling transaction.completed event:', error);
    }
  };

  private handleTransactionAssignedToAgent = async (
    payload: EventPayloadMap[EventType.TRANSACTION_ASSIGNED_TO_AGENT]
  ): Promise<void> => {
    try {
      await this.notifyAdmins({
        title: 'Agent Assigned',
        message: `Transaction ${payload.transactionRef} assigned to ${payload.agentName}`,
        type: 'transaction',
        metadata: { transactionId: payload.transactionId, agentId: payload.agentId }
      });
    } catch (error) {
      console.error('Error handling transaction.assignedToAgent event:', error);
    }
  };

  private handleTransactionPickupConfirmed = async (
    payload: EventPayloadMap[EventType.TRANSACTION_PICKUP_CONFIRMED]
  ): Promise<void> => {
    try {
      await this.notifyAdmins({
        title: 'Pickup Confirmed',
        message: `${payload.agentName} confirmed pickup for transaction ${payload.transactionRef}`,
        type: 'transaction',
        metadata: { transactionId: payload.transactionId }
      });
    } catch (error) {
      console.error('Error handling transaction.pickupConfirmed event:', error);
    }
  };

  private handleAgentCreated = async (
    payload: EventPayloadMap[EventType.AGENT_CREATED]
  ): Promise<void> => {
    try {
      await this.notifyAdmins({
        title: 'New Agent',
        message: `Agent ${payload.agentName} created in ${payload.city}`,
        type: 'agent',
        metadata: { agentId: payload.agentId }
      });
    } catch (error) {
      console.error('Error handling agent.created event:', error);
    }
  };

  private handleAgentStatusChanged = async (
    payload: EventPayloadMap[EventType.AGENT_STATUS_CHANGED]
  ): Promise<void> => {
    try {
      await this.notifyAdmins({
        title: 'Agent Status Changed',
        message: `${payload.agentName} status changed from ${payload.oldStatus} to ${payload.newStatus}`,
        type: 'agent',
        metadata: { agentId: payload.agentId }
      });
    } catch (error) {
      console.error('Error handling agent.statusChanged event:', error);
    }
  };

  private handleKycSubmitted = async (
    payload: EventPayloadMap[EventType.KYC_SUBMITTED]
  ): Promise<void> => {
    try {
      await this.notifyAdmins({
        title: 'KYC Submitted',
        message: `${payload.userName} submitted ${payload.documentCount} KYC documents`,
        type: 'kyc',
        metadata: { userId: payload.userId }
      });
    } catch (error) {
      console.error('Error handling kyc.submitted event:', error);
    }
  };

  private handleKycApproved = async (
    payload: EventPayloadMap[EventType.KYC_APPROVED]
  ): Promise<void> => {
    try {
      // Notify user
      await notificationService.createNotification({
        userId: payload.userId,
        title: 'KYC Approved',
        message: 'Your identity verification has been approved'
      });

      // Notify admins
      await this.notifyAdmins({
        title: 'KYC Approved',
        message: `${payload.approvedByName} approved KYC for ${payload.userName}`,
        type: 'kyc',
        metadata: { userId: payload.userId }
      });
    } catch (error) {
      console.error('Error handling kyc.approved event:', error);
    }
  };

  private handleKycRejected = async (
    payload: EventPayloadMap[EventType.KYC_REJECTED]
  ): Promise<void> => {
    try {
      // Notify user
      await notificationService.createNotification({
        userId: payload.userId,
        title: 'KYC Rejected',
        message: `Your identity verification was rejected: ${payload.reason}`
      });

      // Notify admins
      await this.notifyAdmins({
        title: 'KYC Rejected',
        message: `${payload.rejectedByName} rejected KYC for ${payload.userName}`,
        type: 'kyc',
        metadata: { userId: payload.userId }
      });
    } catch (error) {
      console.error('Error handling kyc.rejected event:', error);
    }
  };

  private async notifyAdmins(notification: {
    title: string;
    message: string;
    type: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      // Get all admin users
      const admins = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SUPER_ADMIN'] }
        },
        select: { id: true }
      });
      
      // Create notifications for each admin
      await Promise.all(
        admins.map(admin =>
          notificationService.createNotification({
            userId: admin.id,
            title: notification.title,
            message: notification.message
          })
        )
      );

      // TODO: Emit WebSocket event when socket service is ready
      // socketService.emitToAdmins('notification', {
      //   title: notification.title,
      //   message: notification.message,
      //   type: notification.type,
      //   metadata: notification.metadata,
      //   timestamp: new Date().toISOString()
      // });
    } catch (error) {
      console.error('Error notifying admins:', error);
    }
  }
}

export const notificationHandler = new NotificationHandler();
