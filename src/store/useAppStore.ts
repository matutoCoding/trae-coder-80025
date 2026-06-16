import { create } from 'zustand';
import { QueueTicket, ApprovalFlow, ReminderRecord, QueueStats, CallRecord, BusinessCategory } from '@/types';
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

  setCurrentUser: (name: string, phone: string) => void;
  createTicket: (businessTypeId: string, name: string, phone: string) => QueueTicket | null;
  requeueTicket: (ticketId: string) => boolean;
  cancelTicket: (ticketId: string) => boolean;
  getMyTickets: () => QueueTicket[];
  getTicketById: (id: string) => QueueTicket | undefined;
  getApprovalById: (id: string) => ApprovalFlow | undefined;
  getRemindersByApproval: (approvalId: string) => ReminderRecord[];
  markReminderRead: (reminderId: string) => void;
  getTimeoutCount: () => number;
}

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

    if (ticket.missedCount >= 3) {
      console.log('[Store] requeueTicket: missed count >= 3, cancelling ticket');
      set({
        tickets: tickets.map(t =>
          t.id === ticketId ? { ...t, status: 'cancelled' as const } : t
        )
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
              missedCount: t.missedCount + 1
            }
          : t
      )
    });

    console.log('[Store] requeueTicket success:', ticketId, 'new position:', newPosition);
    return true;
  },

  cancelTicket: (ticketId) => {
    const tickets = get().tickets;
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return false;

    set({
      tickets: tickets.map(t =>
        t.id === ticketId ? { ...t, status: 'cancelled' as const } : t
      )
    });

    console.log('[Store] cancelTicket:', ticketId);
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
  }
}));
