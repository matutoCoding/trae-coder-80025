import React from 'react';
import { View, Text } from '@tarojs/components';
import { ApprovalNode } from '@/types';
import { approvalStatusTextMap, approvalStatusColorMap, formatDate, getDurationText } from '@/utils/helpers';
import StatusBadge from '@/components/StatusBadge';
import styles from './index.module.scss';
import classnames from 'classnames';

interface TimelineStepProps {
  node: ApprovalNode;
  isActive: boolean;
  isLast: boolean;
}

const TimelineStep: React.FC<TimelineStepProps> = ({ node, isActive, isLast }) => {
  const color = approvalStatusColorMap[node.status];
  const isDone = node.status === 'approved' || node.status === 'rejected';
  const isPending = node.status === 'pending';

  return (
    <View className={styles.step}>
      <View className={styles.leftColumn}>
        <View
          className={classnames(
            styles.dot,
            isActive && styles.dotActive,
            isDone && styles.dotDone,
            node.isTimeout && styles.dotTimeout,
            isPending && styles.dotPending
          )}
          style={{
            backgroundColor: isPending ? undefined : color,
            borderColor: color
          }}
        >
          {isDone && <Text className={styles.dotIcon}>✓</Text>}
          {node.isTimeout && <Text className={styles.dotIcon}>!</Text>}
        </View>
        {!isLast && (
          <View
            className={classnames(
              styles.line,
              isDone && styles.lineDone
            )}
            style={{ backgroundColor: isDone ? color : undefined }}
          />
        )}
      </View>

      <View className={styles.rightColumn}>
        <View className={styles.header}>
          <Text className={styles.order}>{node.order}</Text>
          <Text className={styles.name}>{node.name}</Text>
          <StatusBadge type="approval" status={node.status} />
        </View>

        <View className={styles.handlerInfo}>
          <View className={styles.handler}>
            <Text className={styles.label}>处理人：</Text>
            <Text className={styles.value}>{node.handler}</Text>
            <Text className={styles.role}>（{node.handlerRole}）</Text>
          </View>
        </View>

        <View className={styles.timeInfo}>
          <Text className={styles.timeLabel}>分配：{formatDate(node.assignedAt)}</Text>
          {node.handledAt && (
            <Text className={styles.timeLabel}>完成：{formatDate(node.handledAt)}</Text>
          )}
        </View>

        {node.isTimeout && (
          <View className={styles.timeoutWarning}>
            <Text className={styles.timeoutIcon}>⏱</Text>
            <Text className={styles.timeoutText}>
              已超时 {getDurationText(node.timeoutDuration)}
              {node.reminderCount > 0 && `，催办${node.reminderCount}次`}
            </Text>
          </View>
        )}

        {node.escalated && (
          <View className={styles.escalationInfo}>
            <Text className={styles.escalationIcon}>↑</Text>
            <Text className={styles.escalationText}>
              已升级至 {node.escalatedTo} 处理
            </Text>
          </View>
        )}

        {node.comment && (
          <View className={styles.commentBox}>
            <Text className={styles.commentLabel}>审批意见：</Text>
            <Text className={styles.comment}>{node.comment}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default TimelineStep;
