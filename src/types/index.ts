export type TicketStatus = 
  | 'queuing'
  | 'calling'
  | 'processing'
  | 'missed'
  | 'completed'
  | 'cancelled';

export type BusinessCategory = 
  | 'social'
  | 'household'
  | 'property'
  | 'tax'
  | 'cert'
  | 'other';

export type ApprovalStatus =
  | 'pending'
  | 'processing'
  | 'approved'
  | 'rejected'
  | 'timeout'
  | 'escalated';

export type ReminderLevel = 'normal' | 'urgent' | 'critical';

export interface BusinessType {
  id: string;
  name: string;
  category: BusinessCategory;
  description: string;
  estimatedTime: number;
  requiredDocuments: string[];
  windowNumber: string;
  icon: string;
}

export interface QueueTicket {
  id: string;
  ticketNumber: string;
  businessTypeId: string;
  businessName: string;
  businessCategory: BusinessCategory;
  customerName: string;
  customerPhone: string;
  status: TicketStatus;
  queuePosition: number;
  aheadCount: number;
  windowNumber: string;
  missedCount: number;
  createdAt: string;
  calledAt?: string;
  completedAt?: string;
  estimatedWaitTime: number;
  approvalId?: string;
}

export interface ApprovalNode {
  id: string;
  name: string;
  order: number;
  handler: string;
  handlerRole: string;
  status: ApprovalStatus;
  comment?: string;
  assignedAt: string;
  handledAt?: string;
  timeoutAt: string;
  isTimeout: boolean;
  timeoutDuration: number;
  reminderCount: number;
  escalated: boolean;
  escalatedTo?: string;
}

export interface ApprovalFlow {
  id: string;
  ticketId: string;
  ticketNumber: string;
  businessName: string;
  applicantName: string;
  currentNodeIndex: number;
  nodes: ApprovalNode[];
  overallStatus: ApprovalStatus;
  startTime: string;
  expectedEndTime: string;
  responsiblePerson: string;
}

export interface ReminderRecord {
  id: string;
  approvalId: string;
  nodeId: string;
  level: ReminderLevel;
  content: string;
  sentAt: string;
  sentTo: string;
  sentToRole: string;
  isEscalation: boolean;
  read: boolean;
}

export interface CallRecord {
  id: string;
  ticketId: string;
  ticketNumber: string;
  windowNumber: string;
  calledAt: string;
  result: 'arrived' | 'missed' | 'requeued';
}

export interface QueueStats {
  totalQueuing: number;
  totalProcessing: number;
  totalCompleted: number;
  totalMissed: number;
  averageWaitTime: number;
  currentCallingNumber: string;
  windowNumber: string;
}
