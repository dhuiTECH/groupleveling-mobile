import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ImageBackground } from 'react-native';

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
        <Image source={require('../../assets/exclamation.png')} style={styles.skullIcon} />
        <Text style={styles.headerTitle}>SPECIAL INSTANCES</Text>
      </View>

      <View style={styles.dungeonCard}>
        <ImageBackground 
          source={require('../../assets/gates.png')} 
          style={styles.backgroundImage}
          imageStyle={{ borderRadius: 20 }}
        >
          <View style={styles.overlay}>
            <View style={styles.cardHeader}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>E-RANK</Text>
              </View>
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>🕒 JAN 31, 2026 3:00 PM PST</Text>
              </View>
            </View>

            <Text style={styles.dungeonTitle}>THE SUNDAY TRACK RAID</Text>

            <View style={styles.rewardsContainer}>
              <View style={styles.rewardItem}>
                <Image source={require('../../assets/expcrystal.png')} style={styles.rewardIcon} />
                <Text style={styles.rewardText}>500 XP</Text>
              </View>
              <View style={styles.rewardItem}>
                <Image source={require('../../assets/coinicon.png')} style={styles.rewardIcon} />
                <Text style={[styles.rewardText, { color: '#fbbf24' }]}>100</Text>
              </View>
            </View>

            <View style={styles.detailsContainer}>
              <Text style={styles.detailText}>• REQ: 10KM</Text>
              <Text style={styles.detailText}>• BOSS: INTERVAL OGRE</Text>
            </View>

            <View style={styles.footer}>
              <View style={styles.partyContainer}>
                <Text style={styles.partyLabel}>PARTY (1)</Text>
                <View style={styles.partyMembers}>
                   {/* Avatar placeholders */}
                   <View style={styles.partyAvatar} />
                   <Text style={styles.viewAll}>VIEW ALL</Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.dropoutButton}>
                <Text style={styles.dropoutText}>DROP OUT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </View>
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
    tintColor: '#ef4444',
  },
  headerTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#3b82f6',
    letterSpacing: 3,
  },
  dungeonCard: {
    height: 250,
    borderRadius: 20,
    overflow: 'hidden',
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 20,
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
    paddingVertical: 4,
    borderRadius: 4,
  },
  rankText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 8,
    color: '#cbd5e1',
    fontWeight: 'bold',
  },
  dungeonTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    fontStyle: 'italic',
    marginTop: 8,
  },
  rewardsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardIcon: {
    width: 14,
    height: 14,
  },
  rewardText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  detailsContainer: {
    marginTop: 8,
  },
  detailText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fbbf24',
    textTransform: 'uppercase',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  partyContainer: {
    gap: 4,
  },
  partyLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#06b6d4',
  },
  partyMembers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  partyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#475569',
    borderWidth: 1,
    borderColor: '#fff',
  },
  viewAll: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#3b82f6',
    textDecorationLine: 'underline',
  },
  dropoutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
    transform: [{ skewX: '-10deg' }],
  },
  dropoutText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
});

export default DungeonView;
