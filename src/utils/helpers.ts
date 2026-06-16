import { TicketStatus, ApprovalStatus, ReminderLevel, BusinessCategory } from '@/types';
import dayjs from 'dayjs';

export const statusTextMap: Record<TicketStatus, string> = {
  queuing: '排队中',
  calling: '叫号中',
  processing: '办理中',
  missed: '已过号',
  completed: '已完成',
  cancelled: '已作废'
};

export const statusColorMap: Record<TicketStatus, string> = {
  queuing: '#2E7DFF',
  calling: '#FF7D00',
  processing: '#1E5CBF',
  missed: '#F53F3F',
  completed: '#00B42A',
  cancelled: '#86909C'
};

export const approvalStatusTextMap: Record<ApprovalStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  approved: '已通过',
  rejected: '已驳回',
  timeout: '已超时',
  escalated: '已升级'
};

export const approvalStatusColorMap: Record<ApprovalStatus, string> = {
  pending: '#86909C',
  processing: '#2E7DFF',
  approved: '#00B42A',
  rejected: '#F53F3F',
  timeout: '#F53F3F',
  escalated: '#FF7D00'
};

export const reminderLevelTextMap: Record<ReminderLevel, string> = {
  normal: '普通提醒',
  urgent: '紧急提醒',
  critical: '严重超时'
};

export const reminderLevelColorMap: Record<ReminderLevel, string> = {
  normal: '#2E7DFF',
  urgent: '#FF7D00',
  critical: '#F53F3F'
};

export const formatTime = (isoString: string): string => {
  return dayjs(isoString).format('HH:mm');
};

export const formatDate = (isoString: string): string => {
  return dayjs(isoString).format('MM-DD HH:mm');
};

export const formatFullDate = (isoString: string): string => {
  return dayjs(isoString).format('YYYY-MM-DD HH:mm:ss');
};

export const getRemainTime = (timeoutAt: string): { minutes: number; seconds: number; isTimeout: boolean } => {
  const diff = dayjs(timeoutAt).valueOf() - Date.now();
  const isTimeout = diff <= 0;
  const absDiff = Math.abs(diff);
  const minutes = Math.floor(absDiff / 60000);
  const seconds = Math.floor((absDiff % 60000) / 1000);
  return { minutes, seconds, isTimeout };
};

export const getDurationText = (minutes: number): string => {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
};

export const formatDuration = (startAt: string, endAt?: string): string => {
  const start = dayjs(startAt);
  const end = endAt ? dayjs(endAt) : dayjs();
  const diffMin = end.diff(start, 'minute');
  return getDurationText(diffMin);
};

export const generateTicketNumber = (category: BusinessCategory, count: number): string => {
  const prefixMap: Record<BusinessCategory, string> = {
    social: 'A',
    household: 'B',
    property: 'C',
    tax: 'D',
    cert: 'E',
    other: 'F'
  };
  const prefix = prefixMap[category] || 'Z';
  const num = String(count).padStart(4, '0');
  return `${prefix}${num}`;
};

export const getBusinessIconBg = (category: BusinessCategory): string => {
  const colorMap: Record<BusinessCategory, string> = {
    social: 'linear-gradient(135deg, #3498DB 0%, #2980B9 100%)',
    household: 'linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%)',
    property: 'linear-gradient(135deg, #1ABC9C 0%, #16A085 100%)',
    tax: 'linear-gradient(135deg, #E67E22 0%, #D35400 100%)',
    cert: 'linear-gradient(135deg, #F1C40F 0%, #F39C12 100%)',
    other: 'linear-gradient(135deg, #95A5A6 0%, #7F8C8D 100%)'
  };
  return colorMap[category] || colorMap.other;
};

export const validatePhone = (phone: string): boolean => {
  return /^1[3-9]\d{9}$/.test(phone);
};

export const maskPhone = (phone: string): string => {
  if (phone.length !== 11) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};
