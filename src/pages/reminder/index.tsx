import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh, useDidShow } from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import { ReminderLevel } from '@/types';
import ReminderCard from '@/components/ReminderCard';
import { reminderLevelColorMap } from '@/utils/helpers';
import styles from './index.module.scss';
import classnames from 'classnames';

type TabKey = 'all' | 'unread' | 'critical' | 'escalation';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'unread', label: '未读' },
  { key: 'critical', label: '严重超时' },
  { key: 'escalation', label: '升级催办' }
];

const LEVEL_FILTERS = [
  { key: 'all', label: '全部级别' },
  { key: 'normal', label: '普通提醒' },
  { key: 'urgent', label: '紧急提醒' },
  { key: 'critical', label: '严重超时' }
];

const ReminderPage: React.FC = () => {
  const reminders = useAppStore(state => state.reminders);
  const approvals = useAppStore(state => state.approvals);
  const markReminderRead = useAppStore(state => state.markReminderRead);
  const checkAndUpdateTimeouts = useAppStore(state => state.checkAndUpdateTimeouts);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [levelFilter, setLevelFilter] = useState('all');

  useDidShow(() => {
    checkAndUpdateTimeouts();
  });

  usePullDownRefresh(() => {
    checkAndUpdateTimeouts();
    setTimeout(() => Taro.stopPullDownRefresh(), 600);
  });

  const stats = useMemo(() => {
    const unread = reminders.filter(r => !r.read).length;
    const critical = reminders.filter(r => r.level === 'critical').length;
    const escalation = reminders.filter(r => r.isEscalation).length;
    return { total: reminders.length, unread, critical, escalation };
  }, [reminders]);

  const filteredReminders = useMemo(() => {
    let list = reminders;
    switch (activeTab) {
      case 'unread':
        list = list.filter(r => !r.read);
        break;
      case 'critical':
        list = list.filter(r => r.level === 'critical');
        break;
      case 'escalation':
        list = list.filter(r => r.isEscalation);
        break;
    }
    if (levelFilter !== 'all') {
      list = list.filter(r => r.level === levelFilter);
    }
    return list.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  }, [reminders, activeTab, levelFilter]);

  const responsibleStats = useMemo(() => {
    const map = new Map<string, { name: string; role: string; timeout: number; total: number }>();
    approvals.forEach(approval => {
      approval.nodes.forEach(node => {
        if (node.status === 'processing' || node.status === 'timeout' || node.isTimeout) {
          const key = node.handler;
          if (!map.has(key)) {
            map.set(key, { name: node.handler, role: node.handlerRole, timeout: 0, total: 0 });
          }
          const item = map.get(key)!;
          item.total++;
          if (node.isTimeout) item.timeout++;
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => b.timeout - a.timeout || b.total - a.total);
  }, [approvals]);

  const handleClick = (reminder: any) => {
    if (!reminder.read) {
      markReminderRead(reminder.id);
      console.log('[ReminderPage] 标记催办已读:', reminder.id);
    }
    Taro.navigateTo({
      url: `/pages/approval-detail/index?id=${reminder.approvalId}`
    });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.headerCard}>
        <Text className={styles.headerTitle}>催办管理中心
          {stats.unread > 0 && (
            <Text className={styles.unreadBadge}>{stats.unread}</Text>
          )}
        </Text>
        <Text className={styles.headerSubtitle}>节点超时自动催办 · 超时升级机制 · 责任到人</Text>
        <View className={styles.statRow}>
          <View className={styles.statCol}>
            <Text className={styles.statNum}>{stats.total}</Text>
            <Text className={styles.statLabel}>催办总数</Text>
          </View>
          <View className={styles.statCol}>
            <Text className={styles.statNum}>{stats.critical}</Text>
            <Text className={styles.statLabel}>严重超时</Text>
          </View>
          <View className={styles.statCol}>
            <Text className={styles.statNum}>{stats.escalation}</Text>
            <Text className={styles.statLabel}>已升级</Text>
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

      <View className={styles.filterBar}>
        {LEVEL_FILTERS.map(f => (
          <View
            key={f.key}
            className={classnames(
              styles.filterChip,
              levelFilter === f.key && styles.filterChipActive
            )}
            onClick={() => setLevelFilter(f.key)}
          >
            <Text>{f.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.summarySection}>
        <Text className={styles.summaryTitle}>责任人超时统计</Text>
        <View className={styles.personList}>
          {responsibleStats.length === 0 ? (
            <Text style={{ fontSize: '26rpx', color: '#86909C', textAlign: 'center', padding: '32rpx 0' }}>
              暂无超时记录
            </Text>
          ) : (
            responsibleStats.slice(0, 5).map((person, idx) => (
              <View key={person.name} className={styles.personItem}>
                <View className={styles.personAvatar}>
                  {person.name.charAt(0)}
                </View>
                <View className={styles.personInfo}>
                  <Text className={styles.personName}>{person.name}</Text>
                  <Text className={styles.personRole}>{person.role}</Text>
                </View>
                <View className={styles.personStats}>
                  <View className={styles.personStat}>
                    <Text className={classnames(styles.personStatNum, styles.statRed)}>{person.timeout}</Text>
                    <Text className={styles.personStatLabel}>超时</Text>
                  </View>
                  <View className={styles.personStat}>
                    <Text className={classnames(styles.personStatNum, styles.statOrange)}>{person.total}</Text>
                    <Text className={styles.personStatLabel}>待办</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      {filteredReminders.length === 0 ? (
        <View className={styles.emptyState}>
          <View className={styles.emptyIcon}>🔔</View>
          <Text className={styles.emptyText}>暂无催办记录</Text>
        </View>
      ) : (
        filteredReminders.map(reminder => (
          <ReminderCard
            key={reminder.id}
            reminder={reminder}
            onClick={() => handleClick(reminder)}
          />
        ))
      )}
    </ScrollView>
  );
};

export default ReminderPage;
