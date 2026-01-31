import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface DungeonViewProps {
  user: any;
  dungeons: any[];
  activeTab: string;
  onNavigate: (tab: string) => void;
  showNotification: (msg: string, type?: 'success' | 'error') => void;
  setUser: (u: any) => void;
  level: number;
  rank: string;
  onAvatarClick: (u: any) => void;
  selectedDungeon: any;
  setSelectedDungeon: (d: any) => void;
}

const DungeonView: React.FC<DungeonViewProps> = (props) => {
  const { dungeons } = props;
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/special instances.png')} style={styles.skullIcon} />
        <Text style={styles.headerTitle}>SPECIAL INSTANCES</Text>
      </View>

      <TouchableOpacity 
        style={styles.dungeonCard}
        onPress={() => {}}
        activeOpacity={0.9}
      >
        <ImageBackground 
          source={require('../../assets/special instances.png')} 
          style={styles.backgroundImage}
          imageStyle={{ borderRadius: 8 }}
        >
          <LinearGradient
            colors={['rgba(2, 6, 23, 0.4)', 'rgba(2, 6, 23, 0.9)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.overlay}>
            <View style={styles.cardHeader}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>E-RANK</Text>
              </View>
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>TIME_REMAINING: 04:22:15</Text>
              </View>
            </View>

            <View style={styles.contentMiddle}>
              <Text style={styles.dungeonTitle}>THE SUNDAY TRACK RAID</Text>
              <View style={styles.rewardsRow}>
                <View style={styles.rewardItem}>
                  <Image source={require('../../assets/expcrystal.png')} style={styles.rewardIcon} />
                  <Text style={styles.rewardText}>500 XP</Text>
                </View>
                <View style={styles.rewardItem}>
                  <Image source={require('../../assets/coinicon.png')} style={styles.rewardIcon} />
                  <Text style={[styles.rewardText, { color: '#fbbf24' }]}>100G</Text>
                </View>
              </View>
            </View>

            <View style={styles.footer}>
              <View style={styles.detailsContainer}>
                <Text style={styles.detailText}>OBJ: 10KM INTERVAL_RUN</Text>
                <Text style={styles.detailText}>BOSS: INTERVAL_OGRE</Text>
              </View>
              
              <TouchableOpacity style={styles.enterButton}>
                <Text style={styles.enterButtonText}>ENTER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  skullIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#3b82f6',
    letterSpacing: 4,
  },
  dungeonCard: {
    height: 220,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
  },
  backgroundImage: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    padding: 15,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankBadge: {
    backgroundColor: '#06b6d4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 2,
  },
  rankText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  timeText: {
    fontSize: 8,
    color: '#22d3ee',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  contentMiddle: {
    marginTop: 10,
  },
  dungeonTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
    textShadowColor: 'rgba(34, 211, 238, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 5,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rewardIcon: {
    width: 14,
    height: 14,
  },
  rewardText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  detailsContainer: {
    flex: 1,
  },
  detailText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: 'rgba(34, 211, 238, 0.6)',
    letterSpacing: 1,
    marginBottom: 2,
  },
  enterButton: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#06b6d4',
  },
  enterButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
});

export default DungeonView;
