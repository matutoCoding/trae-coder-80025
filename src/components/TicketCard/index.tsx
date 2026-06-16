import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { QueueTicket } from '@/types';
import { statusTextMap, statusColorMap, formatTime, getDurationText, getBusinessIconBg } from '@/utils/helpers';
import StatusBadge from '@/components/StatusBadge';
import styles from './index.module.scss';
import classnames from 'classnames';

interface TicketCardProps {
  ticket: QueueTicket;
  onRequeue?: () => void;
  onViewApproval?: () => void;
  showDetail?: boolean;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket, onRequeue, onViewApproval, showDetail = true }) => {
  const handleClick = () => {
    if (showDetail) {
      Taro.navigateTo({
        url: `/pages/ticket-detail/index?id=${ticket.id}`
      });
    }
  };

  const handleViewApproval = (e) => {
    e.stopPropagation();
    if (onViewApproval) {
      onViewApproval();
    } else if (ticket.approvalId) {
      Taro.navigateTo({
        url: `/pages/approval-detail/index?id=${ticket.approvalId}`
      });
    }
  };

  const handleRequeue = (e) => {
    e.stopPropagation();
    if (onRequeue) onRequeue();
  };

  const canRequeue = ticket.status === 'missed' && ticket.missedCount < 3;
  const hasApproval = ticket.status === 'processing' || ticket.status === 'completed';

  return (
    <View
      className={classnames(
        styles.card,
        ticket.status === 'calling' && styles.cardCalling,
        ticket.status === 'missed' && styles.cardMissed,
        ticket.status === 'cancelled' && styles.cardCancelled
      )}
      onClick={handleClick}
    >
      <View className={styles.cardHeader}>
        <View className={styles.left}>
          <View
            className={styles.icon}
            style={{ background: getBusinessIconBg(ticket.businessCategory) }}
          >
            <Text className={styles.iconText}>{ticket.ticketNumber.charAt(0)}</Text>
          </View>
          <View className={styles.headerInfo}>
            <Text className={styles.ticketNumber}>{ticket.ticketNumber}</Text>
            <Text className={styles.window}>{ticket.windowNumber}窗口</Text>
          </View>
        </View>
        <StatusBadge status={ticket.status} size="md" />
      </View>

      <View className={styles.cardBody}>
        <Text className={styles.businessName}>{ticket.businessName}</Text>

        {ticket.status === 'queuing' && (
          <View className={styles.queueInfo}>
            <View className={styles.queueStat}>
              <Text className={styles.queueNum}>{ticket.aheadCount}</Text>
              <Text className={styles.queueLabel}>前方等待</Text>
            </View>
            <View className={styles.queueDivider} />
            <View className={styles.queueStat}>
              <Text className={styles.queueNum}>约{ticket.estimatedWaitTime}</Text>
              <Text className={styles.queueLabel}>预计等待(分钟)</Text>
            </View>
          </View>
        )}

        {ticket.status === 'calling' && (
          <View className={styles.callingNotice}>
            <View className={styles.pulseDot} />
            <Text className={styles.callingText}>请尽快前往{ticket.windowNumber}号窗口办理！</Text>
          </View>
        )}

        {ticket.missedCount > 0 && ticket.status !== 'cancelled' && ticket.status !== 'completed' && ticket.status !== 'processing' && (
          <View className={styles.missedInfo}>
            <Text className={styles.missedText}>
              已过号 <Text style={{ color: '#F53F3F', fontWeight: 600 }}>{ticket.missedCount}</Text>/3 次
            </Text>
          </View>
        )}

        {ticket.status === 'missed' && (
          <View className={styles.missedInfo}>
            <Text className={styles.missedText}>
              请点击重新排队按钮排到队尾
            </Text>
          </View>
        )}

        {ticket.status === 'processing' && (
          <View className={styles.processInfo}>
            <Text className={styles.processText}>正在办理中，由{ticket.windowNumber}号窗口受理</Text>
          </View>
        )}

        {ticket.status === 'completed' && (
          <View className={styles.completedInfo}>
            <Text className={styles.completedText}>已完成办理 · 用时 {formatDuration(ticket.calledAt!, ticket.completedAt)}</Text>
          </View>
        )}

        <View className={styles.timeInfo}>
          <Text className={styles.timeText}>取号时间：{formatTime(ticket.createdAt)}</Text>
        </View>
      </View>

      {(canRequeue || hasApproval) && (
        <View className={styles.cardFooter}>
          {canRequeue && (
            <Button
              className={classnames(styles.btn, styles.btnRequeue)}
              onClick={handleRequeue}
            >
              重新排队
            </Button>
          )}
          {hasApproval && ticket.approvalId && (
            <Button
              className={classnames(styles.btn, styles.btnApproval)}
              onClick={handleViewApproval}
            >
              查看审批
            </Button>
          )}
        </View>
      )}
    </View>
  );
};

const formatDuration = (start: string, end?: string): string => {
  if (!end) return '';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const minutes = Math.floor(ms / 60000);
  return getDurationText(minutes);
};

export default TicketCard;
