import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import { businessTypes, categoryColors, categoryNames } from '@/data/businessTypes';
import BusinessItem from '@/components/BusinessItem';
import TicketCard from '@/components/TicketCard';
import styles from './index.module.scss';
import classnames from 'classnames';

const IndexPage: React.FC = () => {
  const { queueStats, getMyTickets, createTicket, currentUser } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [selectedBiz, setSelectedBiz] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  usePullDownRefresh(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 800);
  });

  const hotBusinesses = useMemo(() => {
    return businessTypes.slice(0, 8);
  }, []);

  const myRecentTickets = useMemo(() => {
    return getMyTickets().slice(0, 3);
  }, [getMyTickets]);

  const handleBusinessClick = (bizId: string) => {
    const biz = businessTypes.find(b => b.id === bizId);
    if (!biz) return;
    setSelectedBiz(bizId);
    setShowModal(true);
  };

  const handleConfirmTakeTicket = () => {
    if (!selectedBiz) return;
    const newTicket = createTicket(selectedBiz, currentUser.name, currentUser.phone);
    setShowModal(false);
    setSelectedBiz(null);
    if (newTicket) {
      Taro.showToast({
        title: `取号成功：${newTicket.ticketNumber}`,
        icon: 'success',
        duration: 2000
      });
      console.log('[IndexPage] 取号成功:', newTicket);
    } else {
      Taro.showToast({
        title: '取号失败，请重试',
        icon: 'error'
      });
    }
  };

  const handleViewAllBusiness = () => {
    Taro.navigateTo({
      url: '/pages/business-list/index'
    });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.hero}>
        <Text className={styles.heroTitle}>政务服务取号大厅</Text>
        <Text className={styles.heroSubtitle}>高效办事 · 智能排队 · 透明审批</Text>
      </View>

      <View className={styles.callingBoard}>
        <View className={styles.boardHeader}>
          <View className={styles.boardIcon}>
            <Text className={styles.boardIconText}>叫</Text>
          </View>
          <View className={styles.boardInfo}>
            <Text className={styles.boardLabel}>当前叫号</Text>
            <Text className={styles.boardWindow}>{queueStats.windowNumber}号窗口正在办理</Text>
          </View>
        </View>

        <View className={styles.callingNumber}>
          <Text className={styles.callingNumberText}>{queueStats.currentCallingNumber}</Text>
          <View className={styles.callingPulse} />
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{queueStats.totalQueuing}</Text>
            <Text className={styles.statLabel}>排队中</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={classnames(styles.statNum, styles.statNumOrange)}>{queueStats.totalProcessing}</Text>
            <Text className={styles.statLabel}>办理中</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={classnames(styles.statNum, styles.statNumGreen)}>{queueStats.totalCompleted}</Text>
            <Text className={styles.statLabel}>已完成</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={classnames(styles.statNum, styles.statNumRed)}>{queueStats.totalMissed}</Text>
            <Text className={styles.statLabel}>过号</Text>
          </View>
        </View>

        <View className={styles.avgTime}>
          <Text className={styles.avgTimeText}>
            今日平均等待时长：
            <Text className={styles.avgTimeNum}>{queueStats.averageWaitTime}分钟</Text>
          </Text>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>热门业务</Text>
          <Text className={styles.sectionMore} onClick={handleViewAllBusiness}>
            全部业务 ›
          </Text>
        </View>

        <View className={styles.businessGrid}>
          {hotBusinesses.map(biz => (
            <BusinessItem
              key={biz.id}
              business={biz}
              compact
              onClick={() => handleBusinessClick(biz.id)}
            />
          ))}
        </View>
      </View>

      <View className={styles.recentSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>我的号码</Text>
          <Text
            className={styles.sectionMore}
            onClick={() => Taro.switchTab({ url: '/pages/myticket/index' })}
          >
            查看全部 ›
          </Text>
        </View>

        {myRecentTickets.length === 0 ? (
          <View className={styles.emptyHint}>
            <Text>暂无取号记录，快去取号吧~</Text>
          </View>
        ) : (
          myRecentTickets.map(ticket => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))
        )}
      </View>

      {showModal && (
        <TakeTicketModal
          business={businessTypes.find(b => b.id === selectedBiz)}
          onCancel={() => { setShowModal(false); setSelectedBiz(null); }}
          onConfirm={handleConfirmTakeTicket}
        />
      )}
    </ScrollView>
  );
};

interface TakeTicketModalProps {
  business: any;
  onCancel: () => void;
  onConfirm: () => void;
}

const TakeTicketModal: React.FC<TakeTicketModalProps> = ({ business, onCancel, onConfirm }) => {
  if (!business) return null;
  const bgColor = categoryColors[business.category] || '#999';

  return (
    <View
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 48rpx'
      }}
      onClick={onCancel}
    >
      <View
        style={{
          background: '#fff',
          borderRadius: '24rpx',
          width: '100%',
          maxWidth: '654rpx',
          padding: '48rpx 40rpx 40rpx'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <View style={{ textAlign: 'center', marginBottom: '32rpx' }}>
          <View
            style={{
              width: '96rpx',
              height: '96rpx',
              borderRadius: '24rpx',
              margin: '0 auto 20rpx',
              background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}cc 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8rpx 20rpx ${bgColor}40`
            }}
          >
            <Text style={{ fontSize: '40rpx', fontWeight: 700, color: '#fff' }}>{business.icon}</Text>
          </View>
          <Text style={{ fontSize: '36rpx', fontWeight: 600, color: '#1d2129', display: 'block', marginBottom: '8rpx' }}>
            确认取号
          </Text>
          <Text style={{ fontSize: '28rpx', color: '#4e5969' }}>{business.name}</Text>
        </View>

        <View
          style={{
            background: '#F7F8FA',
            borderRadius: '16rpx',
            padding: '24rpx',
            marginBottom: '32rpx'
          }}
        >
          <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16rpx' }}>
            <Text style={{ fontSize: '26rpx', color: '#86909C' }}>办理窗口</Text>
            <Text style={{ fontSize: '26rpx', color: '#1d2129', fontWeight: 500 }}>{business.windowNumber}号</Text>
          </View>
          <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16rpx' }}>
            <Text style={{ fontSize: '26rpx', color: '#86909C' }}>业务分类</Text>
            <Text style={{ fontSize: '26rpx', color: '#1d2129', fontWeight: 500 }}>
              {categoryNames[business.category]}
            </Text>
          </View>
          <View style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: '26rpx', color: '#86909C' }}>预计时长</Text>
            <Text style={{ fontSize: '26rpx', color: '#1d2129', fontWeight: 500 }}>
              {business.estimatedTime}分钟
            </Text>
          </View>
        </View>

        <View style={{ display: 'flex', gap: '24rpx' }}>
          <View
            onClick={onCancel}
            style={{
              flex: 1,
              height: '88rpx',
              borderRadius: '48rpx',
              background: '#F2F3F5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28rpx',
              color: '#4e5969',
              fontWeight: 500
            }}
          >
            取消
          </View>
          <View
            onClick={onConfirm}
            style={{
              flex: 1,
              height: '88rpx',
              borderRadius: '48rpx',
              background: 'linear-gradient(135deg, #1E5CBF 0%, #2E7DFF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28rpx',
              color: '#fff',
              fontWeight: 500,
              boxShadow: '0 6rpx 16rpx rgba(30, 92, 191, 0.3)'
            }}
          >
            确认取号
          </View>
        </View>
      </View>
    </View>
  );
};

export default IndexPage;
