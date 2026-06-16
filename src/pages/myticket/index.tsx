import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh, useDidShow } from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import TicketCard from '@/components/TicketCard';
import styles from './index.module.scss';
import classnames from 'classnames';

type TabKey = 'all' | 'active' | 'missed' | 'history';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '进行中' },
  { key: 'missed', label: '过号记录' },
  { key: 'history', label: '历史记录' }
];

const MyTicketPage: React.FC = () => {
  const tickets = useAppStore(state => state.tickets);
  const currentUser = useAppStore(state => state.currentUser);
  const requeueTicket = useAppStore(state => state.requeueTicket);
  const checkAndUpdateTimeouts = useAppStore(state => state.checkAndUpdateTimeouts);

  const [activeTab, setActiveTab] = useState<TabKey>('all');

  useDidShow(() => {
    checkAndUpdateTimeouts();
  });

  usePullDownRefresh(() => {
    checkAndUpdateTimeouts();
    setTimeout(() => Taro.stopPullDownRefresh(), 600);
  });

  const myTickets = useMemo(() => {
    return tickets
      .filter(t => t.customerName === currentUser.name || t.customerPhone === currentUser.phone)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tickets, currentUser]);

  const filteredTickets = useMemo(() => {
    switch (activeTab) {
      case 'active':
        return myTickets.filter(t =>
          t.status === 'queuing' || t.status === 'calling' || t.status === 'processing'
        );
      case 'missed':
        return myTickets.filter(t => t.status === 'missed');
      case 'history':
        return myTickets.filter(t => t.status === 'completed' || t.status === 'cancelled');
      default:
        return myTickets;
    }
  }, [myTickets, activeTab]);

  const counts = useMemo(() => ({
    all: myTickets.length,
    active: myTickets.filter(t => ['queuing', 'calling', 'processing'].includes(t.status)).length,
    missed: myTickets.filter(t => t.status === 'missed').length,
    history: myTickets.filter(t => ['completed', 'cancelled'].includes(t.status)).length
  }), [myTickets]);

  const summaryStats = useMemo(() => {
    const total = myTickets.length;
    const active = myTickets.filter(t => ['queuing', 'calling', 'processing'].includes(t.status)).length;
    const completed = myTickets.filter(t => t.status === 'completed').length;
    const missed = myTickets.filter(t => t.status === 'missed' || t.status === 'cancelled').length;
    return { total, active, completed, missed };
  }, [myTickets]);

  const handleRequeue = (ticketId: string) => {
    const ticket = myTickets.find(t => t.id === ticketId);
    const nextCount = ticket ? ticket.missedCount + 1 : 1;
    const willCancel = nextCount >= 3;

    const content = willCancel
      ? '⚠️ 这是第3次过号，确认重新排队后号码将立即作废！'
      : `确定要将此号码重新排到队尾吗？过号次数将变为 ${nextCount}/3。连续过号3次将作废。`;

    const confirmColor = willCancel ? '#F53F3F' : '#1E5CBF';

    Taro.showModal({
      title: '重新排队',
      content,
      confirmText: '确认',
      cancelText: '取消',
      confirmColor,
      success: (res) => {
        if (res.confirm) {
          const result = requeueTicket(ticketId);
          if (result) {
            Taro.showToast({ title: '已重新排队', icon: 'success' });
            console.log('[MyTicketPage] 重新排队成功:', ticketId);
          } else {
            Taro.showToast({ title: '号码已作废', icon: 'none', duration: 2000 });
            console.log('[MyTicketPage] 号码已作废:', ticketId);
            setTimeout(() => {
              setActiveTab('history');
            }, 1000);
          }
        }
      }
    });
  };

  const goTakeTicket = () => {
    Taro.switchTab({ url: '/pages/index/index' });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.userCard}>
        <Text className={styles.userName}>{currentUser.name}</Text>
        <Text className={styles.userPhone}>{currentUser.phone}</Text>
        <View className={styles.userStats}>
          <View className={styles.userStat}>
            <Text className={styles.userStatNum}>{summaryStats.total}</Text>
            <Text className={styles.userStatLabel}>总取号</Text>
          </View>
          <View className={styles.userStat}>
            <Text className={styles.userStatNum}>{summaryStats.active}</Text>
            <Text className={styles.userStatLabel}>进行中</Text>
          </View>
          <View className={styles.userStat}>
            <Text className={styles.userStatNum}>{summaryStats.completed}</Text>
            <Text className={styles.userStatLabel}>已完成</Text>
          </View>
        </View>
      </View>

      <View className={styles.summaryCard}>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryNum}>{summaryStats.total}</Text>
          <Text className={styles.summaryLabel}>累计取号</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={classnames(styles.summaryNum, styles.summaryNumOrange)}>{summaryStats.active}</Text>
          <Text className={styles.summaryLabel}>进行中</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={classnames(styles.summaryNum, styles.summaryNumGreen)}>{summaryStats.completed}</Text>
          <Text className={styles.summaryLabel}>已完成</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={classnames(styles.summaryNum, styles.summaryNumGray)}>{summaryStats.missed}</Text>
          <Text className={styles.summaryLabel}>过号/作废</Text>
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
            <Text className={styles.tabCount}>{counts[tab.key]}</Text>
          </View>
        ))}
      </View>

      {filteredTickets.length === 0 ? (
        <View className={styles.emptyState}>
          <View className={styles.emptyIcon}>📋</View>
          <Text className={styles.emptyText}>
            {activeTab === 'all' ? '暂无取号记录' : '暂无' + TABS.find(t => t.key === activeTab)?.label + '的号码'}
          </Text>
          <View className={styles.emptyBtn} onClick={goTakeTicket}>立即取号</View>
        </View>
      ) : (
        filteredTickets.map(ticket => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onRequeue={() => handleRequeue(ticket.id)}
          />
        ))
      )}
    </ScrollView>
  );
};

export default MyTicketPage;
