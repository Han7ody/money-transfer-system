// Event type constants
export enum EventType {
  // Transaction Events
  TRANSACTION_CREATED = 'transaction.created',
  TRANSACTION_APPROVED = 'transaction.approved',
  TRANSACTION_REJECTED = 'transaction.rejected',
  TRANSACTION_COMPLETED = 'transaction.completed',
  TRANSACTION_ASSIGNED_TO_AGENT = 'transaction.assignedToAgent',
  TRANSACTION_PICKUP_CONFIRMED = 'transaction.pickupConfirmed',
  
  // Agent Events
  AGENT_CREATED = 'agent.created',
  AGENT_UPDATED = 'agent.updated',
  AGENT_STATUS_CHANGED = 'agent.statusChanged',
  
  // KYC Events
  KYC_SUBMITTED = 'kyc.submitted',
  KYC_APPROVED = 'kyc.approved',
  KYC_REJECTED = 'kyc.rejected',
  
  // User Events
  USER_REGISTERED = 'user.registered',
  USER_BLOCKED = 'user.blocked',
  USER_UNBLOCKED = 'user.unblocked',
  
  // System Events
  SYSTEM_ALERT = 'system.alert',
  SECURITY_ALERT = 'security.alert'
}

// Event payload interfaces
export interface TransactionCreatedPayload {
  transactionId: number;
  transactionRef: string;
  userId: number;
  userName: string;
  amount: number;
  currency: string;
}

export interface TransactionApprovedPayload {
  transactionId: number;
  transactionRef: string;
  userId: number;
  approvedBy: number;
  approvedByName: string;
}

export interface TransactionRejectedPayload {
  transactionId: number;
  transactionRef: string;
  userId: number;
  rejectedBy: number;
  rejectedByName: string;
  reason: string;
}

export interface TransactionCompletedPayload {
  transactionId: number;
  transactionRef: string;
  userId: number;
  completedBy: number;
}

export interface TransactionAssignedToAgentPayload {
  transactionId: number;
  transactionRef: string;
  agentId: number;
  agentName: string;
  assignedBy: number;
}

export interface TransactionPickupConfirmedPayload {
  transactionId: number;
  transactionRef: string;
  agentId: number;
  agentName: string;
  confirmedBy: number;
}

export interface AgentCreatedPayload {
  agentId: number;
  agentName: string;
  city: string;
  createdBy: number;
}

export interface AgentUpdatedPayload {
  agentId: number;
  agentName: string;
  updatedBy: number;
  changes: Record<string, any>;
}

export interface AgentStatusChangedPayload {
  agentId: number;
  agentName: string;
  oldStatus: string;
  newStatus: string;
  changedBy: number;
}

export interface KycSubmittedPayload {
  userId: number;
  userName: string;
  documentCount: number;
}

export interface KycApprovedPayload {
  userId: number;
  userName: string;
  approvedBy: number;
  approvedByName: string;
}

export interface KycRejectedPayload {
  userId: number;
  userName: string;
  rejectedBy: number;
  rejectedByName: string;
  reason: string;
}

// Map event types to their payloads
export interface EventPayloadMap {
  [EventType.TRANSACTION_CREATED]: TransactionCreatedPayload;
  [EventType.TRANSACTION_APPROVED]: TransactionApprovedPayload;
  [EventType.TRANSACTION_REJECTED]: TransactionRejectedPayload;
  [EventType.TRANSACTION_COMPLETED]: TransactionCompletedPayload;
  [EventType.TRANSACTION_ASSIGNED_TO_AGENT]: TransactionAssignedToAgentPayload;
  [EventType.TRANSACTION_PICKUP_CONFIRMED]: TransactionPickupConfirmedPayload;
  [EventType.AGENT_CREATED]: AgentCreatedPayload;
  [EventType.AGENT_UPDATED]: AgentUpdatedPayload;
  [EventType.AGENT_STATUS_CHANGED]: AgentStatusChangedPayload;
  [EventType.KYC_SUBMITTED]: KycSubmittedPayload;
  [EventType.KYC_APPROVED]: KycApprovedPayload;
  [EventType.KYC_REJECTED]: KycRejectedPayload;
}
