import React, { useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import { businessTypes } from '@/data/businessTypes';
import StatusBadge from '@/components/StatusBadge';
import { formatFullDate, formatDuration } from '@/utils/helpers';
import styles from './index.module.scss';
import classnames from 'classnames';

const TicketDetailPage: React.FC = () => {
  const router = useRouter();
  const ticketId = router.params.id as string;
  const { getTicketById, requeueTicket, cancelTicket } = useAppStore();

  const ticket = useMemo(() => getTicketById(ticketId), [ticketId, getTicketById]);
  const business = useMemo(
    () => ticket ? businessTypes.find(b => b.id === ticket.businessTypeId) : undefined,
    [ticket]
  );

  if (!ticket) {
    return (
      <ScrollView className={styles.page} scrollY>
        <View style={{ padding: '100rpx 32rpx', textAlign: 'center' }}>
          <Text style={{ fontSize: '28rpx', color: '#86909C' }}>号码不存在</Text>
        </View>
      </ScrollView>
    );
  }

  const handleRequeue = () => {
    Taro.showModal({
      title: '重新排队',
      content: `确定要重新排到队尾吗？当前已过号${ticket.missedCount}次，累计过号3次将作废。`,
      success: (res) => {
        if (res.confirm) {
          const result = requeueTicket(ticket.id);
          if (result) {
            Taro.showToast({ title: '已重新排队', icon: 'success' });
            console.log('[TicketDetail] 重新排队成功:', ticket.id);
          } else {
            Taro.showToast({ title: '号码已作废', icon: 'none' });
          }
        }
      }
    });
  };

  const handleCancel = () => {
    Taro.showModal({
      title: '取消取号',
      content: '确定要取消此号码吗？取消后无法恢复。',
      success: (res) => {
        if (res.confirm) {
          cancelTicket(ticket.id);
          Taro.showToast({ title: '已取消', icon: 'success' });
          setTimeout(() => Taro.navigateBack(), 500);
          console.log('[TicketDetail] 取消取号:', ticket.id);
        }
      }
    });
  };

  const handleViewApproval = () => {
    if (ticket.approvalId) {
      Taro.navigateTo({
        url: `/pages/approval-detail/index?id=${ticket.approvalId}`
      });
    }
  };

  const canRequeue = ticket.status === 'missed' && ticket.missedCount < 3;
  const canCancel = ticket.status === 'queuing' || ticket.status === 'calling';
  const canViewApproval = (ticket.status === 'processing' || ticket.status === 'completed') && ticket.approvalId;

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.ticketHeader}>
        <View className={styles.ticketNumberRow}>
          <Text className={styles.ticketNumber}>{ticket.ticketNumber}</Text>
          <View className={styles.windowBadge}>
            <Text>{ticket.windowNumber}号窗口</Text>
          </View>
        </View>
        <Text className={styles.businessName}>{ticket.businessName}</Text>
        <View className={styles.metaRow}>
          <Text>取号时间：{formatFullDate(ticket.createdAt)}</Text>
        </View>
      </View>

      <View className={styles.mainCard}>
        <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32rpx' }}>
          <Text style={{ fontSize: '30rpx', fontWeight: 600, color: '#1d2129' }}>当前状态</Text>
          <StatusBadge status={ticket.status} size="md" />
        </View>

        {(ticket.status === 'queuing' || ticket.status === 'calling') && (
          <View className={styles.queueStatus}>
            <View className={styles.queueStat}>
              <Text className={classnames(styles.queueNum, ticket.status === 'calling' && styles.queueNumWarn)}>
                {ticket.aheadCount}
              </Text>
              <Text className={styles.queueLabel}>前方等待</Text>
            </View>
            <View className={styles.queueStat}>
              <Text className={styles.queueNum}>#{ticket.queuePosition}</Text>
              <Text className={styles.queueLabel}>排队位置</Text>
            </View>
            <View className={styles.queueStat}>
              <Text className={styles.queueNum}>{ticket.estimatedWaitTime}</Text>
              <Text className={styles.queueLabel}>预计等(分)</Text>
            </View>
          </View>
        )}

        {ticket.status === 'missed' && (
          <View className={styles.missedWarning}>
            <Text className={styles.warningIcon}>⚠️</Text>
            <Text className={styles.warningText}>
              此号码已过号！当前过号次数 {ticket.missedCount}/3。
              {ticket.missedCount >= 3
                ? '连续过号3次，号码已作废，请重新取号。'
                : '点击下方"重新排队"按钮排到队尾，累计3次过号号码将作废。'}
            </Text>
          </View>
        )}

        {ticket.status === 'cancelled' && (
          <View className={styles.missedWarning}>
            <Text className={styles.warningIcon}>ℹ️</Text>
            <Text className={styles.warningText}>
              此号码已作废（过号{ticket.missedCount}次），请返回取号大厅重新取号。
            </Text>
          </View>
        )}
      </View>

      <View className={styles.infoSection}>
        <Text className={styles.sectionTitle}>基本信息</Text>
        <View className={styles.infoCard}>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>办理业务</Text>
            <Text className={styles.infoValue}>{ticket.businessName}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>办理窗口</Text>
            <Text className={styles.infoValue}>{ticket.windowNumber}号窗口</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>申请人</Text>
            <Text className={styles.infoValue}>{ticket.customerName}（{ticket.customerPhone}）</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>取号时间</Text>
            <Text className={styles.infoValue}>{formatFullDate(ticket.createdAt)}</Text>
          </View>
          {ticket.calledAt && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>叫号时间</Text>
              <Text className={styles.infoValue}>{formatFullDate(ticket.calledAt)}</Text>
            </View>
          )}
          {ticket.completedAt && ticket.calledAt && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>办理用时</Text>
              <Text className={styles.infoValue}>{formatDuration(ticket.calledAt, ticket.completedAt)}</Text>
            </View>
          )}
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>过号次数</Text>
            <Text
              className={styles.infoValue}
              style={{ color: ticket.missedCount >= 2 ? '#F53F3F' : ticket.missedCount >= 1 ? '#FF7D00' : '#1d2129', fontWeight: 600 }}
            >
              {ticket.missedCount} / 3 次
            </Text>
          </View>
        </View>
      </View>

      {business && (
        <View className={styles.infoSection}>
          <Text className={styles.sectionTitle}>办理须知</Text>
          <View className={styles.infoCard}>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>预计时长</Text>
              <Text className={styles.infoValue}>{business.estimatedTime}分钟</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>所需材料</Text>
              <Text className={styles.infoValue}>{business.requiredDocuments.join('、')}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>业务说明</Text>
              <Text className={styles.infoValue}>{business.description}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={{ height: '160rpx' }} />

      <View className={styles.bottomBar}>
        {canCancel && (
          <Button className={classnames(styles.btn, styles.btnGhost)} onClick={handleCancel}>
            取消取号
          </Button>
        )}
        {canRequeue && (
          <Button className={classnames(styles.btn, styles.btnSecondary)} onClick={handleRequeue}>
            重新排队
          </Button>
        )}
        {canViewApproval && (
          <Button className={classnames(styles.btn, styles.btnPrimary)} onClick={handleViewApproval}>
            查看审批进度
          </Button>
        )}
        {!canCancel && !canRequeue && !canViewApproval && ticket.status !== 'processing' && (
          <Button
            className={classnames(styles.btn, styles.btnPrimary)}
            onClick={() => Taro.switchTab({ url: '/pages/index/index' })}
          >
            返回取号大厅
          </Button>
        )}
      </View>
    </ScrollView>
  );
};

export default TicketDetailPage;
