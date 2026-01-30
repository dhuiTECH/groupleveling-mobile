import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface TrainingWidgetProps {
  user: any;
  trainingProtocol: any;
  nutritionLogs: any[];
  onOpenModal: () => void;
  onClaimChest: () => void;
  onClaimStepsReward: () => void;
}

const TrainingWidget: React.FC<TrainingWidgetProps> = ({ 
  user, 
  onOpenModal, 
  onClaimChest, 
  onClaimStepsReward 
}) => {
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const currentDay = 'THU'; // Mock current day

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(15, 23, 42, 0.9)', 'rgba(30, 41, 59, 0.6)']}
        style={styles.card}
      >
        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity style={styles.activeTab}>
            <Text style={styles.activeTabText}>[ TRAINING ]</Text>
            <View style={styles.activeTabIndicator} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>[ DIETARY ]</Text>
          </TouchableOpacity>
        </View>

        {/* Days of Week */}
        <View style={styles.daysContainer}>
          {days.map((day) => {
            const isActive = day === currentDay;
            const isCompleted = day === 'WED' || day === 'THU';
            return (
              <View key={day} style={styles.dayItem}>
                <Text style={[styles.dayText, isActive && styles.activeDayText]}>{day}</Text>
                <View style={[
                  styles.dayCheck, 
                  isCompleted ? styles.checkedDay : styles.uncheckedDay,
                  isActive && styles.activeDayCheck
                ]}>
                  {isCompleted && (
                    <Text style={styles.checkIcon}>✓</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Stats and Streak */}
        <View style={styles.bottomSection}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>P</Text>
              <Text style={styles.statValue}>0g</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>C</Text>
              <Text style={styles.statValue}>0g</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>F</Text>
              <Text style={styles.statValue}>0g</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: '#fbbf24' }]}>🔥</Text>
              <Text style={styles.statValue}>0</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.streakCard} onPress={onClaimChest}>
            <View>
              <Text style={styles.streakLabel}>WEEKLY STREAK: 0/7</Text>
            </View>
            <Image 
              source={require('../../assets/icons/mediumchest.png')} 
              style={styles.chestIcon} 
            />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Image source={require('../../assets/icons/gachapon.png')} style={{ width: 14, height: 14, tintColor: '#22d3ee' }} />
            {/* Using a generic icon or shoe if available, defaulting to emoji for now if asset missing */}
            <Text style={styles.progressValue}>0 / 10,000</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '5%' }]} />
          </View>
          <View style={styles.chestReward}>
             <Image source={require('../../assets/icons/silverchest.png')} style={styles.miniRewardChest} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.1)',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: -1,
    height: 2,
    width: '100%',
    backgroundColor: '#06b6d4',
    shadowColor: '#06b6d4',
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#64748b',
    letterSpacing: 1,
  },
  activeTabText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#06b6d4',
    letterSpacing: 1,
    textShadowColor: 'rgba(6, 182, 212, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dayItem: {
    alignItems: 'center',
    gap: 12,
  },
  dayText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
  },
  activeDayText: {
    color: '#06b6d4',
  },
  dayCheck: {
    width: 32,
    height: 40,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    transform: [{ skewX: '-5deg' }],
  },
  uncheckedDay: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  checkedDay: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  activeDayCheck: {
    borderColor: '#06b6d4',
    borderWidth: 1,
    shadowColor: '#06b6d4',
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  checkIcon: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#3b82f6',
  },
  statValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  streakCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  streakLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  chestIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 80,
  },
  progressValue: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: 'bold',
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#06b6d4',
    borderRadius: 3,
  },
  chestReward: {
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
  },
  miniRewardChest: {
    width: 16,
    height: 16,
    opacity: 0.5,
  }
});

export default TrainingWidget;