import { create } from 'zustand';
import { QueueTicket, ApprovalFlow, ReminderRecord, QueueStats, CallRecord, BusinessCategory, ApprovalNode, ReminderLevel } from '@/types';
import { mockTickets, mockApprovals, mockReminders, mockQueueStats, mockCallRecords } from '@/data/mockData';
import { generateTicketNumber } from '@/utils/helpers';
import { businessTypes } from '@/data/businessTypes';

interface AppState {
  tickets: QueueTicket[];
  approvals: ApprovalFlow[];
  reminders: ReminderRecord[];
  queueStats: QueueStats;
  callRecords: CallRecord[];
  currentUser: { name: string; phone: string };
  ticketCounter: Record<BusinessCategory, number>;
  lastTimeoutCheck: number;

  setCurrentUser: (name: string, phone: string) => void;
  createTicket: (businessTypeId: string, name: string, phone: string) => QueueTicket | null;
  requeueTicket: (ticketId: string) => boolean;
  cancelTicket: (ticketId: string) => boolean;
  markTicketMissed: (ticketId: string) => boolean;
  getMyTickets: () => QueueTicket[];
  getTicketById: (id: string) => QueueTicket | undefined;
  getApprovalById: (id: string) => ApprovalFlow | undefined;
  getRemindersByApproval: (approvalId: string) => ReminderRecord[];
  markReminderRead: (reminderId: string) => void;
  getTimeoutCount: () => number;
  checkAndUpdateTimeouts: () => void;
  getCurrentCallingTicket: () => QueueTicket | undefined;
  getUnreadReminderCount: () => number;
}

const generateId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const escalateMap: Record<string, { name: string; role: string }> = {
  '张科员': { name: '王科长', role: '科室科长' },
  '陈科员': { name: '刘科长', role: '科室科长' },
  '周科员': { name: '钱科长', role: '科室科长' },
  '郑科员': { name: '冯科长', role: '科室科长' },
  '王科长': { name: '李主任', role: '政务中心主任' },
  '刘科长': { name: '孙主任', role: '政务中心副主任' },
  '钱科长': { name: '赵主任', role: '政务中心主任' },
  '冯科长': { name: '孙主任', role: '政务中心副主任' },
};

export const useAppStore = create<AppState>((set, get) => ({
  tickets: mockTickets,
  approvals: mockApprovals,
  reminders: mockReminders,
  queueStats: mockQueueStats,
  callRecords: mockCallRecords,
  currentUser: { name: '张三', phone: '138****1234' },
  ticketCounter: {
    social: 135,
    household: 90,
    property: 60,
    tax: 35,
    cert: 50,
    other: 15
  },
  lastTimeoutCheck: 0,

  setCurrentUser: (name, phone) => {
    set({ currentUser: { name, phone } });
    console.log('[Store] setCurrentUser:', { name, phone });
  },

  createTicket: (businessTypeId, name, phone) => {
    const business = businessTypes.find(b => b.id === businessTypeId);
    if (!business) {
      console.error('[Store] createTicket: business not found', businessTypeId);
      return null;
    }

    const counter = get().ticketCounter;
    const newCount = (counter[business.category] || 0) + 1;
    const ticketNumber = generateTicketNumber(business.category, newCount);

    const sameWindowTickets = get().tickets.filter(
      t => t.windowNumber === business.windowNumber && t.status === 'queuing'
    );
    const queuePosition = sameWindowTickets.length + 1;

    const newTicket: QueueTicket = {
      id: `t_${Date.now()}`,
      ticketNumber,
      businessTypeId,
      businessName: business.name,
      businessCategory: business.category,
      customerName: name,
      customerPhone: phone,
      status: 'queuing',
      queuePosition,
      aheadCount: queuePosition - 1,
      windowNumber: business.windowNumber,
      missedCount: 0,
      createdAt: new Date().toISOString(),
      estimatedWaitTime: queuePosition * business.estimatedTime
    };

    set({
      tickets: [...get().tickets, newTicket],
      ticketCounter: { ...counter, [business.category]: newCount },
      queueStats: {
        ...get().queueStats,
        totalQueuing: get().queueStats.totalQueuing + 1
      }
    });

    console.log('[Store] createTicket success:', newTicket);
    return newTicket;
  },

  requeueTicket: (ticketId) => {
    const tickets = get().tickets;
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) {
      console.error('[Store] requeueTicket: ticket not found', ticketId);
      return false;
    }

    const newMissedCount = ticket.missedCount + 1;

    if (newMissedCount >= 3) {
      console.log('[Store] requeueTicket: missed count reaches 3, cancelling ticket');
      set({
        tickets: tickets.map(t =>
          t.id === ticketId ? { ...t, status: 'cancelled' as const, missedCount: newMissedCount } : t
        ),
        queueStats: {
          ...get().queueStats,
          totalMissed: get().queueStats.totalMissed + 1
        }
      });
      return false;
    }

    const sameWindowTickets = tickets.filter(
      t => t.windowNumber === ticket.windowNumber && t.status === 'queuing'
    );
    const newPosition = sameWindowTickets.length + 1;

    set({
      tickets: tickets.map(t =>
        t.id === ticketId
          ? {
              ...t,
              status: 'queuing' as const,
              queuePosition: newPosition,
              aheadCount: newPosition - 1,
              missedCount: newMissedCount
            }
          : t
      )
    });

    console.log('[Store] requeueTicket success:', ticketId, 'new position:', newPosition, 'missedCount:', newMissedCount);
    return true;
  },

  cancelTicket: (ticketId) => {
    const tickets = get().tickets;
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return false;

    const wasQueuing = ticket.status === 'queuing';

    set({
      tickets: tickets.map(t =>
        t.id === ticketId ? { ...t, status: 'cancelled' as const } : t
      ),
      queueStats: {
        ...get().queueStats,
        totalQueuing: wasQueuing ? get().queueStats.totalQueuing - 1 : get().queueStats.totalQueuing
      }
    });

    console.log('[Store] cancelTicket:', ticketId);
    return true;
  },

  markTicketMissed: (ticketId) => {
    const tickets = get().tickets;
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket || (ticket.status !== 'calling' && ticket.status !== 'queuing')) {
      console.error('[Store] markTicketMissed: invalid ticket', ticketId, ticket?.status);
      return false;
    }

    const newMissedCount = ticket.missedCount + 1;
    const isCancelled = newMissedCount >= 3;

    const sameWindowTickets = tickets.filter(
      t => t.windowNumber === ticket.windowNumber && t.status === 'queuing' && t.id !== ticketId
    );
    const newPosition = isCancelled ? 0 : sameWindowTickets.length + 1;

    const newCallRecord: CallRecord = {
      id: `c_${Date.now()}`,
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      windowNumber: ticket.windowNumber,
      calledAt: new Date().toISOString(),
      result: isCancelled ? 'missed' : 'requeued'
    };

    set({
      tickets: tickets.map(t =>
        t.id === ticketId
          ? {
              ...t,
              status: isCancelled ? 'cancelled' as const : 'missed' as const,
              missedCount: newMissedCount,
              queuePosition: newPosition,
              aheadCount: newPosition - 1,
              calledAt: new Date().toISOString()
            }
          : t
      ),
      callRecords: [...get().callRecords, newCallRecord],
      queueStats: {
        ...get().queueStats,
        totalMissed: get().queueStats.totalMissed + 1,
        totalQueuing: ticket.status === 'queuing' ? get().queueStats.totalQueuing - 1 : get().queueStats.totalQueuing
      }
    });

    console.log('[Store] markTicketMissed:', ticketId, 'missedCount:', newMissedCount, 'cancelled:', isCancelled);
    return true;
  },

  getMyTickets: () => {
    const { currentUser, tickets } = get();
    return tickets
      .filter(t => t.customerName === currentUser.name || t.customerPhone === currentUser.phone)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getTicketById: (id) => {
    return get().tickets.find(t => t.id === id);
  },

  getApprovalById: (id) => {
    return get().approvals.find(a => a.id === id);
  },

  getRemindersByApproval: (approvalId) => {
    return get().reminders
      .filter(r => r.approvalId === approvalId)
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  },

  markReminderRead: (reminderId) => {
    set({
      reminders: get().reminders.map(r =>
        r.id === reminderId ? { ...r, read: true } : r
      )
    });
  },

  getTimeoutCount: () => {
    return get().approvals.filter(a =>
      a.nodes.some(n => n.isTimeout && (n.status === 'timeout' || n.status === 'processing'))
    ).length;
  },

  checkAndUpdateTimeouts: () => {
    const now = Date.now();
    const { approvals, reminders } = get();
    const newReminders: ReminderRecord[] = [];
    let updatedApprovals = [...approvals];

    updatedApprovals = updatedApprovals.map(approval => {
      const updatedNodes = approval.nodes.map((node, nodeIndex) => {
        if (node.status === 'approved' || node.status === 'rejected' || node.status === 'pending') {
          return node;
        }

        const timeoutTime = new Date(node.timeoutAt).getTime();
        const timeSinceTimeout = now - timeoutTime;

        if (timeSinceTimeout <= 0) {
          return node;
        }

        let updatedNode: ApprovalNode = { ...node, isTimeout: true };
        if (node.status === 'processing') {
          updatedNode.status = 'timeout';
        }

        const minsSinceTimeout = Math.floor(timeSinceTimeout / 60000);
        let expectedReminders = 0;
        let currentLevel: ReminderLevel = 'normal';

        if (minsSinceTimeout >= 60) {
          expectedReminders = 3;
          currentLevel = 'critical';
        } else if (minsSinceTimeout >= 30) {
          expectedReminders = 2;
          currentLevel = 'urgent';
        } else if (minsSinceTimeout >= 5) {
          expectedReminders = 1;
          currentLevel = 'normal';
        }

        if (expectedReminders > updatedNode.reminderCount) {
          const nodeReminders = reminders.filter(r => r.nodeId === node.id);
          const nodeNewReminders: ReminderRecord[] = [];

          for (let i = updatedNode.reminderCount; i < expectedReminders; i++) {
            let level: ReminderLevel = 'normal';
            if (i >= 2) level = 'critical';
            else if (i >= 1) level = 'urgent';

            const isEscalation = level === 'critical';
            const escalateTo = escalateMap[node.handler];
            const sentTo = isEscalation && escalateTo ? escalateTo.name : node.handler;
            const sentToRole = isEscalation && escalateTo ? escalateTo.role : node.handlerRole;

            let content = '';
            if (level === 'normal') {
              content = `【${node.name}】节点已超时，请尽快处理（${approval.businessName}-${approval.ticketNumber}）`;
            } else if (level === 'urgent') {
              content = `【${node.name}】节点已超时30分钟以上，请立即处理！`;
            } else {
              content = `【${node.name}】节点已超时60分钟！已自动升级至${sentTo}处理`;
            }

            nodeNewReminders.push({
              id: `r_${generateId()}`,
              approvalId: approval.id,
              nodeId: node.id,
              level,
              content,
              sentAt: new Date(now - (expectedReminders - 1 - i) * 5 * 60000).toISOString(),
              sentTo,
              sentToRole,
              isEscalation,
              read: false
            });
          }

          newReminders.push(...nodeNewReminders);
          updatedNode.reminderCount = expectedReminders;

          if (currentLevel === 'critical' && !updatedNode.escalated) {
            const escalateTo = escalateMap[node.handler];
            if (escalateTo) {
              updatedNode.escalated = true;
              updatedNode.escalatedTo = escalateTo.name;
            }
          }
        }

        return updatedNode;
      });

      const hasTimeout = updatedNodes.some(n => n.isTimeout && n.status === 'timeout');
      const overallStatus = hasTimeout ? 'timeout' : approval.overallStatus;

      return {
        ...approval,
        nodes: updatedNodes,
        overallStatus: overallStatus as any
      };
    });

    if (newReminders.length > 0) {
      set({
        approvals: updatedApprovals,
        reminders: [...reminders, ...newReminders],
        lastTimeoutCheck: now
      });
      console.log('[Store] checkAndUpdateTimeouts: generated', newReminders.length, 'new reminders');
    } else {
      set({ lastTimeoutCheck: now });
    }
  },

  getCurrentCallingTicket: () => {
    const { tickets, queueStats } = get();
    return tickets.find(t => t.ticketNumber === queueStats.currentCallingNumber);
  },

  getUnreadReminderCount: () => {
    return get().reminders.filter(r => !r.read).length;
  }
}));
