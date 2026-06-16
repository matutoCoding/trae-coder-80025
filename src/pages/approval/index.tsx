import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh, useDidShow } from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import { ApprovalFlow, ApprovalStatus } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import { formatDate, approvalStatusColorMap } from '@/utils/helpers';
import styles from './index.module.scss';
import classnames from 'classnames';

type TabKey = 'all' | 'pending' | 'processing' | 'completed' | 'timeout';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'processing', label: '处理中' },
  { key: 'completed', label: '已完成' },
  { key: 'timeout', label: '超时' }
];

const ApprovalPage: React.FC = () => {
  const approvals = useAppStore(state => state.approvals);
  const checkAndUpdateTimeouts = useAppStore(state => state.checkAndUpdateTimeouts);
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  useDidShow(() => {
    checkAndUpdateTimeouts();
  });

  usePullDownRefresh(() => {
    checkAndUpdateTimeouts();
    setTimeout(() => Taro.stopPullDownRefresh(), 600);
  });

  const stats = useMemo(() => {
    return {
      total: approvals.length,
      pending: approvals.filter(a => a.overallStatus === 'pending').length,
      processing: approvals.filter(a => a.overallStatus === 'processing').length,
      timeout: approvals.filter(a => a.nodes.some(n => n.isTimeout)).length,
      completed: approvals.filter(a => a.overallStatus === 'approved').length
    };
  }, [approvals]);

  const filteredApprovals = useMemo(() => {
    switch (activeTab) {
      case 'pending':
        return approvals.filter(a => a.overallStatus === 'pending');
      case 'processing':
        return approvals.filter(a => a.overallStatus === 'processing' && !a.nodes.some(n => n.isTimeout));
      case 'completed':
        return approvals.filter(a => a.overallStatus === 'approved');
      case 'timeout':
        return approvals.filter(a => a.nodes.some(n => n.isTimeout));
      default:
        return approvals;
    }
  }, [approvals, activeTab]);

  const hasTimeout = (approval: ApprovalFlow) => approval.nodes.some(n => n.isTimeout);

  const getCurrentNode = (approval: ApprovalFlow) => {
    return approval.nodes.find((_, idx) => idx === approval.currentNodeIndex);
  };

  const getCardClass = (approval: ApprovalFlow) => {
    if (hasTimeout(approval)) return styles.approvalCardTimeout;
    if (approval.overallStatus === 'pending') return styles.approvalCardPending;
    return '';
  };

  const renderProgressSteps = (approval: ApprovalFlow) => {
    const currentIdx = approval.currentNodeIndex;
    return approval.nodes.map((node, idx) => {
      let cls = styles.progressStep;
      if (idx < currentIdx || (node.status === 'approved' && idx === currentIdx)) {
        cls += ` ${styles.progressStepDone}`;
      } else if (idx === currentIdx && node.isTimeout) {
        cls += ` ${styles.progressStepTimeout}`;
      } else if (idx === currentIdx) {
        cls += ` ${styles.progressStepActive}`;
      }
      return <View key={node.id} className={cls} />;
    });
  };

  const goDetail = (approvalId: string) => {
    Taro.navigateTo({
      url: `/pages/approval-detail/index?id=${approvalId}`
    });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.headerCard}>
        <Text className={styles.headerTitle}>审批流程中心</Text>
        <Text className={styles.headerSubtitle}>审批轨迹透明可追溯 · 超时自动催办升级</Text>
        <View className={styles.headerStats}>
          <View className={styles.headerStat}>
            <Text className={styles.headerStatNum}>{stats.total}</Text>
            <Text className={styles.headerStatLabel}>总审批</Text>
          </View>
          <View className={styles.headerStat}>
            <Text className={classnames(styles.headerStatNum, styles.headerStatNumWarn)}>{stats.processing + stats.pending}</Text>
            <Text className={styles.headerStatLabel}>处理中</Text>
          </View>
          <View className={styles.headerStat}>
            <Text className={classnames(styles.headerStatNum, styles.headerStatNumError)}>{stats.timeout}</Text>
            <Text className={styles.headerStatLabel}>已超时</Text>
          </View>
        </View>
      </View>

      <View className={styles.tabs}>
        {TABS.map(tab => (
          <View
            key={tab.key}
            className={classnames(
              styles.tabItem,
              activeTab === tab.key && styles.tabItemActive
            )}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text>{tab.label}</Text>
          </View>
        ))}
      </View>

      {filteredApprovals.length === 0 ? (
        <View className={styles.emptyState}>
          <View className={styles.emptyIcon}>📋</View>
          <Text className={styles.emptyText}>暂无审批记录</Text>
        </View>
      ) : (
        filteredApprovals.map(approval => {
          const currentNode = getCurrentNode(approval);
          const isTimeout = hasTimeout(approval);
          return (
            <View
              key={approval.id}
              className={classnames(styles.approvalCard, getCardClass(approval))}
              onClick={() => goDetail(approval.id)}
            >
              <View className={styles.cardTop}>
                <View>
                  <Text className={styles.approvalTitle}>{approval.businessName}</Text>
                  <Text className={styles.applicant}>
                    {approval.ticketNumber} · 申请人：{approval.applicantName} · 责任人：{approval.responsiblePerson}
                  </Text>
                </View>
                <StatusBadge
                  type="approval"
                  status={isTimeout ? 'timeout' : approval.overallStatus}
                  size="md"
                />
              </View>

              <View className={styles.progressBar}>
                {renderProgressSteps(approval)}
              </View>

              <View className={styles.nodeRow}>
                <View className={styles.nodeInfo}>
                  <View
                    className={styles.nodeDot}
                    style={{
                      backgroundColor: currentNode
                        ? (currentNode.isTimeout ? approvalStatusColorMap.timeout : approvalStatusColorMap[currentNode.status])
                        : '#ccc'
                    }}
                  />
                  <Text className={styles.nodeName}>
                    当前节点：{currentNode?.name || '无'}（{currentNode?.handler || '-'}）
                  </Text>
                </View>
              </View>

              <View className={styles.timeRow}>
                <View className={styles.timeItem}>
                  <Text className={styles.timeLabel}>开始时间</Text>
                  <Text className={styles.timeValue}>{formatDate(approval.startTime)}</Text>
                </View>
                <View className={styles.timeItem}>
                  <Text className={styles.timeLabel}>预计完成</Text>
                  <Text className={classnames(
                    styles.timeValue,
                    isTimeout && styles.timeValueError
                  )}>
                    {formatDate(approval.expectedEndTime)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

export default ApprovalPage;
