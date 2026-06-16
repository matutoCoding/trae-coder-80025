import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { businessTypes, categoryColors, categoryNames } from '@/data/businessTypes';
import { useAppStore } from '@/store/useAppStore';
import { BusinessCategory } from '@/types';
import { getDurationText } from '@/utils/helpers';
import styles from './index.module.scss';
import classnames from 'classnames';

type CategoryKey = 'all' | BusinessCategory;

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: 'all', label: '全部业务' },
  { key: 'social', label: '社保服务' },
  { key: 'household', label: '户政服务' },
  { key: 'property', label: '不动产服务' },
  { key: 'tax', label: '税务服务' },
  { key: 'cert', label: '证照办理' },
  { key: 'other', label: '其他服务' }
];

const BusinessListPage: React.FC = () => {
  const router = useRouter();
  const initialCategory = (router.params.category as CategoryKey) || 'all';
  const [activeCategory, setActiveCategory] = useState<CategoryKey>(initialCategory);
  const { createTicket, currentUser } = useAppStore();
  const [selectedBiz, setSelectedBiz] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const filteredBusiness = useMemo(() => {
    if (activeCategory === 'all') return businessTypes;
    return businessTypes.filter(b => b.category === activeCategory);
  }, [activeCategory]);

  const getCategoryColor = (key: CategoryKey) => {
    if (key === 'all') return '#1E5CBF';
    return categoryColors[key] || '#999';
  };

  const handleTakeTicket = (bizId: string) => {
    setSelectedBiz(bizId);
    setShowModal(true);
  };

  const confirmTakeTicket = () => {
    if (!selectedBiz) return;
    const result = createTicket(selectedBiz, currentUser.name, currentUser.phone);
    setShowModal(false);
    setSelectedBiz(null);
    if (result) {
      Taro.showModal({
        title: '取号成功',
        content: `您的号码是 ${result.ticketNumber}\n请到${result.windowNumber}号窗口排队\n前方${result.aheadCount}人等待`,
        showCancel: false,
        confirmText: '好的',
        success: () => {
          console.log('[BusinessList] 取号成功:', result);
          Taro.switchTab({ url: '/pages/myticket/index' });
        }
      });
    } else {
      Taro.showToast({ title: '取号失败', icon: 'error' });
    }
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.categoryTabs}>
        {CATEGORIES.map(cat => (
          <View
            key={cat.key}
            className={classnames(
              styles.categoryTab,
              activeCategory === cat.key && styles.categoryTabActive
            )}
            onClick={() => setActiveCategory(cat.key)}
          >
            <View
              className={styles.categoryDot}
              style={{
                backgroundColor: activeCategory === cat.key ? '#fff' : getCategoryColor(cat.key)
              }}
            />
            <Text>{cat.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.businessList}>
        {filteredBusiness.length === 0 ? (
          <View className={styles.emptyState}>
            <View className={styles.emptyIcon}>📭</View>
            <Text className={styles.emptyText}>暂无相关业务</Text>
          </View>
        ) : (
          filteredBusiness.map(biz => (
            <View
              key={biz.id}
              className={styles.businessCard}
              style={{ borderLeftColor: categoryColors[biz.category] }}
            >
              <View className={styles.cardTop}>
                <View
                  className={styles.businessIcon}
                  style={{ background: `linear-gradient(135deg, ${categoryColors[biz.category]} 0%, ${categoryColors[biz.category]}cc 100%)` }}
                >
                  <Text className={styles.businessIconText}>{biz.icon}</Text>
                </View>
                <View className={styles.businessInfo}>
                  <Text className={styles.businessName}>
                    {biz.name}
                    <Text
                      className={styles.categoryBadge}
                      style={{
                        backgroundColor: `${categoryColors[biz.category]}15`,
                        color: categoryColors[biz.category]
                      }}
                    >
                      {categoryNames[biz.category]}
                    </Text>
                  </Text>
                  <Text className={styles.businessDesc}>{biz.description}</Text>
                </View>
              </View>

              <View className={styles.metaSection}>
                <View className={styles.metaBlock}>
                  <Text className={styles.metaLabel}>办理窗口</Text>
                  <Text className={styles.metaValue}>{biz.windowNumber}</Text>
                </View>
                <View className={styles.metaBlock}>
                  <Text className={styles.metaLabel}>预计时长</Text>
                  <Text className={styles.metaValue}>{getDurationText(biz.estimatedTime)}</Text>
                </View>
                <View className={styles.metaBlock}>
                  <Text className={styles.metaLabel}>材料数</Text>
                  <Text className={styles.metaValue}>{biz.requiredDocuments.length}份</Text>
                </View>
              </View>

              <View
                className={styles.takeBtn}
                onClick={() => handleTakeTicket(biz.id)}
                style={{
                  background: `linear-gradient(135deg, ${categoryColors[biz.category]} 0%, ${categoryColors[biz.category]}dd 100%)`,
                  boxShadow: `0 4rpx 12rpx ${categoryColors[biz.category]}40`
                }}
              >
                立即取号
              </View>
            </View>
          ))
        )}
      </View>

      {showModal && (
        <TakeTicketConfirm
          business={businessTypes.find(b => b.id === selectedBiz)}
          onCancel={() => { setShowModal(false); setSelectedBiz(null); }}
          onConfirm={confirmTakeTicket}
        />
      )}
    </ScrollView>
  );
};

interface ModalProps {
  business: any;
  onCancel: () => void;
  onConfirm: () => void;
}

const TakeTicketConfirm: React.FC<ModalProps> = ({ business, onCancel, onConfirm }) => {
  if (!business) return null;
  const color = categoryColors[business.category] || '#1E5CBF';

  return (
    <View
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
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
              background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8rpx 20rpx ${color}40`
            }}
          >
            <Text style={{ fontSize: '40rpx', fontWeight: 700, color: '#fff' }}>{business.icon}</Text>
          </View>
          <Text style={{ fontSize: '36rpx', fontWeight: 600, color: '#1d2129', display: 'block', marginBottom: '8rpx' }}>
            确认取号办理
          </Text>
          <Text style={{ fontSize: '28rpx', color: '#4e5969' }}>{business.name}</Text>
        </View>

        <View style={{ background: '#F7F8FA', borderRadius: '16rpx', padding: '24rpx', marginBottom: '32rpx' }}>
          <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16rpx' }}>
            <Text style={{ fontSize: '26rpx', color: '#86909C' }}>办理窗口</Text>
            <Text style={{ fontSize: '26rpx', color: '#1d2129', fontWeight: 500 }}>{business.windowNumber}号</Text>
          </View>
          <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16rpx' }}>
            <Text style={{ fontSize: '26rpx', color: '#86909C' }}>业务分类</Text>
            <Text style={{ fontSize: '26rpx', color: '#1d2129', fontWeight: 500 }}>{categoryNames[business.category]}</Text>
          </View>
          <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16rpx' }}>
            <Text style={{ fontSize: '26rpx', color: '#86909C' }}>预计时长</Text>
            <Text style={{ fontSize: '26rpx', color: '#1d2129', fontWeight: 500 }}>{business.estimatedTime}分钟</Text>
          </View>
          <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={{ fontSize: '26rpx', color: '#86909C', flexShrink: 0, marginRight: '16rpx' }}>所需材料</Text>
            <Text style={{ fontSize: '26rpx', color: '#1d2129', textAlign: 'right', flex: 1 }}>
              {business.requiredDocuments.join('、')}
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
              background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28rpx',
              color: '#fff',
              fontWeight: 500,
              boxShadow: `0 6rpx 16rpx ${color}40`
            }}
          >
            确认取号
          </View>
        </View>
      </View>
    </View>
  );
};

export default BusinessListPage;
