import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { BusinessType } from '@/types';
import { getBusinessIconBg, getDurationText } from '@/utils/helpers';
import styles from './index.module.scss';

interface BusinessItemProps {
  business: BusinessType;
  compact?: boolean;
  onClick?: () => void;
}

const BusinessItem: React.FC<BusinessItemProps> = ({ business, compact = false, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/business-list/index?id=${business.id}`
      });
    }
  };

  return (
    <View
      className={compact ? styles.itemCompact : styles.item}
      onClick={handleClick}
    >
      <View
        className={styles.icon}
        style={{ background: getBusinessIconBg(business.category) }}
      >
        <Text className={styles.iconText}>{business.icon}</Text>
      </View>
      <View className={styles.info}>
        <Text className={styles.name}>{business.name}</Text>
        {!compact && (
          <View className={styles.meta}>
            <Text className={styles.metaText}>{business.windowNumber}窗口</Text>
            <Text className={styles.sep}>·</Text>
            <Text className={styles.metaText}>约{getDurationText(business.estimatedTime)}</Text>
          </View>
        )}
      </View>
      {!compact && <Text className={styles.arrow}>›</Text>}
    </View>
  );
};

export default BusinessItem;
