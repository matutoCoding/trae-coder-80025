import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { ReminderRecord } from '@/types';
import { reminderLevelTextMap, reminderLevelColorMap, formatDate } from '@/utils/helpers';
import StatusBadge from '@/components/StatusBadge';
import styles from './index.module.scss';
import classnames from 'classnames';

interface ReminderCardProps {
  reminder: ReminderRecord;
  onClick?: () => void;
}

const ReminderCard: React.FC<ReminderCardProps> = ({ reminder, onClick }) => {
  const color = reminderLevelColorMap[reminder.level];

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/approval-detail/index?id=${reminder.approvalId}`
      });
    }
  };

  return (
    <View
      className={classnames(
        styles.card,
        !reminder.read && styles.cardUnread,
        reminder.level === 'critical' && styles.cardCritical
      )}
      onClick={handleClick}
    >
      <View className={styles.header}>
        <StatusBadge type="reminder" status={reminder.level} size="md" />
        {reminder.isEscalation && (
          <View className={styles.escalationBadge}>
            <Text className={styles.escalationText}>升级催办</Text>
          </View>
        )}
        {!reminder.read && <View className={styles.unreadDot} />}
      </View>

      <Text className={styles.content}>{reminder.content}</Text>

      <View className={styles.footer}>
        <View className={styles.receiver}>
          <Text className={styles.receiverName}>{reminder.sentTo}</Text>
          <Text className={styles.receiverRole}>· {reminder.sentToRole}</Text>
        </View>
        <Text className={styles.time}>{formatDate(reminder.sentAt)}</Text>
      </View>
    </View>
  );
};

export default ReminderCard;
