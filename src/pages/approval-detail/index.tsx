import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import StatusBadge from '@/components/StatusBadge';
import TimelineStep from '@/components/TimelineStep';
import {
  formatFullDate,
  formatDuration,
  reminderLevelColorMap,
  reminderLevelTextMap
} from '@/utils/helpers';
import styles from './index.module.scss';
import classnames from 'classnames';

const ApprovalDetailPage: React.FC = () => {
  const router = useRouter();
  const approvalId = router.params.id as string;
  const approvals = useAppStore(state => state.approvals);
  const reminders = useAppStore(state => state.reminders);
  const checkAndUpdateTimeouts = useAppStore(state => state.checkAndUpdateTimeouts);
  const markReminderRead = useAppStore(state => state.markReminderRead);

  useDidShow(() => {
    checkAndUpdateTimeouts();
  });

  const approval = useMemo(() => approvals.find(a => a.id === approvalId), [approvals, approvalId]);
  const approvalReminders = useMemo(
    () => reminders
      .filter(r => r.approvalId === approvalId)
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()),
    [reminders, approvalId]
  );

  if (!approval) {
    return (
      <ScrollView className={styles.page} scrollY>
        <View style={{ padding: '100rpx 32rpx', textAlign: 'center' }}>
          <Text style={{ fontSize: '28rpx', color: '#86909C' }}>审批记录不存在</Text>
        </View>
      </ScrollView>
    );
  }

  const completedNodes = approval.nodes.filter(n => n.status === 'approved' || n.status === 'rejected').length;
  const hasTimeout = approval.nodes.some(n => n.isTimeout);
  const totalNodes = approval.nodes.length;
  const reminders = approvalReminders;

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.titleRow}>
          <View style={{ flex: 1, paddingRight: '20rpx' }}>
            <Text className={styles.businessName}>{approval.businessName}</Text>
            <View style={{ marginTop: '16rpx' }}>
              <StatusBadge
                type="approval"
                status={hasTimeout ? 'timeout' : approval.overallStatus}
                size="md"
              />
            </View>
          </View>
        </View>
        <View style={{ marginTop: '16rpx' }}>
          <Text className={styles.applicantInfo}>
            取号：{approval.ticketNumber} · 申请人：{approval.applicantName} · 责任人：{approval.responsiblePerson}
          </Text>
        </View>
      </View>

      <View className={styles.summaryCard}>
        <View className={styles.summaryRow}>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryNumGreen}>{completedNodes}</Text>
            <Text className={styles.summaryLabel}>已完成</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={classnames(styles.summaryNum, hasTimeout && styles.summaryNumRed)}>
              {totalNodes - completedNodes}
            </Text>
            <Text className={styles.summaryLabel}>待处理</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={classnames(styles.summaryNumOrange)}>{approval.nodes.filter(n => n.isTimeout).length}</Text>
            <Text className={styles.summaryLabel}>超时节点</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryNum}>{reminders.length}</Text>
            <Text className={styles.summaryLabel}>催办次数</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📋</Text>
          审批基本信息
        </Text>
        <View className={styles.infoCard}>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>审批ID</Text>
            <Text className={styles.infoValue}>{approval.id}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>取号编号</Text>
            <Text className={styles.infoValue}>{approval.ticketNumber}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>业务类型</Text>
            <Text className={styles.infoValue}>{approval.businessName}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>申请人</Text>
            <Text className={styles.infoValue}>{approval.applicantName}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>总体责任人</Text>
            <Text className={styles.infoValue}>{approval.responsiblePerson}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>开始时间</Text>
            <Text className={styles.infoValue}>{formatFullDate(approval.startTime)}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>预计完成</Text>
            <Text
              className={styles.infoValue}
              style={{ color: hasTimeout ? '#F53F3F' : '#1d2129', fontWeight: hasTimeout ? 600 : 400 }}
            >
              {formatFullDate(approval.expectedEndTime)}
              {hasTimeout && '（已超时）'}
            </Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>已用时长</Text>
            <Text className={styles.infoValue}>{formatDuration(approval.startTime)}</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>🔄</Text>
          审批流程轨迹
        </Text>
        <View className={styles.infoCard}>
          <View className={styles.timelineContainer}>
            {approval.nodes.map((node, idx) => (
              <TimelineStep
                key={node.id}
                node={node}
                isActive={idx === approval.currentNodeIndex}
                isLast={idx === approval.nodes.length - 1}
              />
            ))}
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>🔔</Text>
          催办记录（{reminders.length}条）
        </Text>
        <View className={styles.infoCard}>
          {reminders.length === 0 ? (
            <View className={styles.emptyReminder}>
              <Text>暂无催办记录，审批流程正常进行</Text>
            </View>
          ) : (
            reminders.map(r => (
              <View
                key={r.id}
                className={classnames(
                  styles.reminderItem,
                  r.level === 'critical' && styles.reminderItemCritical,
                  r.isEscalation && styles.reminderItemEscalation
                )}
              >
                <View className={styles.reminderHeader}>
                  <View className={styles.reminderLevel}>
                    <View
                      className={styles.reminderLevelDot}
                      style={{ backgroundColor: reminderLevelColorMap[r.level] }}
                    />
                    <Text
                      className={styles.reminderLevelText}
                      style={{ color: reminderLevelColorMap[r.level] }}
                    >
                      {reminderLevelTextMap[r.level]}
                      {r.isEscalation && ' · 升级催办'}
                    </Text>
                  </View>
                  <Text className={styles.reminderTime}>{formatFullDate(r.sentAt)}</Text>
                </View>
                <Text className={styles.reminderContent}>{r.content}</Text>
                <Text className={styles.reminderReceiver}>
                  接收人：{r.sentTo}（{r.sentToRole}）
                  {r.read ? ' · 已读' : ' · 未读'}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>

      <View style={{ height: '60rpx' }} />
    </ScrollView>
  );
};

export default ApprovalDetailPage;
