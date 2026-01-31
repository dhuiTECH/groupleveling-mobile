import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
} from 'react-native-reanimated';
import { BaseModal } from './BaseModal';
import { Award, Gem, Percent, TrendingUp } from 'lucide-react-native';

const coinIcon = require('../../../assets/coinicon.png');
const expIcon = require('../../../assets/expcrystal.png');

interface Reward {
  type: 'coins' | 'exp' | 'gems' | 'stat';
  amount: number;
  stat?: string;
}

interface RewardModalProps {
  visible: boolean;
  onClose: () => void;
  rank?: string;
  rewards?: Reward[];
  goldBuff?: number;
  expBuff?: number;
}

export const RewardModal: React.FC<RewardModalProps> = ({
  visible,
  onClose,
  rank,
  rewards,
  goldBuff,
  expBuff,
}) => {
  const iconRotation = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      iconRotation.value = withRepeat(withTiming(360, { duration: 2000 }), -1, true);
    } else {
      iconRotation.value = 0;
    }
  }, [visible]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotation.value}deg` }],
  }));

  const renderRewardItem = ({ item, index }: { item: Reward, index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', delay: 300 + index * 100 }}
      style={styles.rewardItem}
    >
      <Image
        source={
          item.type === 'coins' ? coinIcon :
          item.type === 'exp' ? expIcon :
          undefined // You'd need a gem icon asset
        }
        style={styles.rewardIcon}
      />
      {item.type === 'gems' && <Gem size={24} color="#a855f7" style={styles.rewardIcon} />}
      <Text style={styles.rewardText}>
        {item.type === 'stat' ? `${item.stat?.toUpperCase()} +${item.amount}` : `+${item.amount.toLocaleString()}`}
      </Text>
    </MotiView>
  );

  return (
    <BaseModal visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <Animated.View style={[styles.awardIconContainer, animatedIconStyle]}>
          <Award size={64} color="#facc15" />
        </Animated.View>
        <Text style={styles.title}>Season Rewards</Text>
        {rank && <Text style={styles.rankText}>Rank: {rank}</Text>}

        {rewards && rewards.length > 0 && (
          <FlatList
            data={rewards}
            renderItem={renderRewardItem}
            keyExtractor={(item, index) => `${item.type}-${index}`}
            numColumns={2}
            style={styles.rewardsList}
            contentContainerStyle={styles.rewardsContent}
          />
        )}
        
        {(goldBuff || expBuff) && (
          <View style={styles.buffsContainer}>
            <Text style={styles.buffsTitle}>Passive Buffs Unlocked</Text>
            {goldBuff && (
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 500 }}
                style={styles.buffItem}
              >
                <TrendingUp size={16} color="#fbbf24" />
                <Text style={styles.buffText}>+{goldBuff}% Gold Acquisition</Text>
              </MotiView>
            )}
            {expBuff && (
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 600 }}
                style={styles.buffItem}
              >
                <Percent size={16} color="#34d399" />
                <Text style={styles.buffText}>+{expBuff}% EXP Gain</Text>
              </MotiView>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.claimButton} onPress={onClose}>
          <Text style={styles.claimButtonText}>CLAIM</Text>
        </TouchableOpacity>
      </View>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  awardIconContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    borderRadius: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
  },
  rankText: {
    fontSize: 16,
    color: '#facc15',
    marginBottom: 24,
  },
  rewardsList: {
    width: '100%',
    maxHeight: 150,
    marginBottom: 24,
  },
  rewardsContent: {
    alignItems: 'center',
  },
  rewardItem: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 6,
    minWidth: 120,
  },
  rewardIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  rewardText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buffsContainer: {
    width: '100%',
    marginBottom: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 16,
  },
  buffsTitle: {
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 12,
    fontWeight: 'bold',
  },
  buffItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  buffText: {
    color: '#fff',
    fontSize: 14,
  },
  claimButton: {
    backgroundColor: '#facc15',
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 8,
  },
  claimButtonText: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '900',
  },
});
