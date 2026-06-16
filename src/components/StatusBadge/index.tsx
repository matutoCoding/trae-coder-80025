import React from 'react';
import { View, Text } from '@tarojs/components';
import { TicketStatus, ApprovalStatus, ReminderLevel } from '@/types';
import {
  statusTextMap,
  statusColorMap,
  approvalStatusTextMap,
  approvalStatusColorMap,
  reminderLevelTextMap,
  reminderLevelColorMap
} from '@/utils/helpers';
import styles from './index.module.scss';
import classnames from 'classnames';

type BadgeType = 'ticket' | 'approval' | 'reminder';

interface StatusBadgeProps {
  type?: BadgeType;
  status: TicketStatus | ApprovalStatus | ReminderLevel;
  size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ type = 'ticket', status, size = 'sm' }) => {
  let text = '';
  let color = '';
  let bgColor = '';

  if (type === 'ticket') {
    text = statusTextMap[status as TicketStatus];
    color = statusColorMap[status as TicketStatus];
  } else if (type === 'approval') {
    text = approvalStatusTextMap[status as ApprovalStatus];
    color = approvalStatusColorMap[status as ApprovalStatus];
  } else if (type === 'reminder') {
    text = reminderLevelTextMap[status as ReminderLevel];
    color = reminderLevelColorMap[status as ReminderLevel];
  }

  bgColor = `${color}15`;

  return (
    <View
      className={classnames(styles.badge, size === 'md' && styles.badgeMd)}
      style={{ backgroundColor: bgColor, borderColor: `${color}40` }}
    >
      <Text className={styles.dot} style={{ backgroundColor: color }} />
      <Text className={styles.text} style={{ color }}>{text}</Text>
    </View>
  );
};

export default StatusBadge;
