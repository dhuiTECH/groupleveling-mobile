import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Image, Alert, Dimensions, ActivityIndicator, Vibration, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { RootStackScreenProps } from '../types/navigation';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

// Import assets
import swordIcon from '../../assets/huntericon.png';
import potionIcon from '../../assets/icon.png';
import goldIcon from '../../assets/coinicon.png';
import monsterPlaceholder from '../../assets/icon.png'; // Replace with actual monster images

interface DungeonScreenProps {}

// Mock data for demonstration
const initialDungeonState = {
  level: 1,
  health: 100,
  gold: 0,
  monsterHealth: 50,
  monsterName: 'Goblin',
  monsterImage: monsterPlaceholder,
  isFighting: false,
  isLoading: false,
  message: '',
};

type DungeonState = typeof initialDungeonState;

export const DungeonScreen: React.FC<DungeonScreenProps> = () => {
  const navigation = useNavigation<RootStackScreenProps<'Dungeon'>['navigation']>();
  const insets = useSafeAreaInsets();

  const [dungeonState, setDungeonState] = useState<DungeonState>(initialDungeonState);

  const handleAttack = () => {
    if (dungeonState.isFighting || dungeonState.isLoading) return;

    setDungeonState(prevState => ({
      ...prevState,
      isFighting: true,
      isLoading: true,
      message: 'Attacking...',
    }));

    // Simulate attack with a delay
    setTimeout(() => {
      const damage = Math.floor(Math.random() * 20) + 10; // Random damage between 10 and 30
      const newMonsterHealth = dungeonState.monsterHealth - damage;

      if (newMonsterHealth <= 0) {
        // Monster defeated
        const goldReward = Math.floor(Math.random() * 50) + 25; // Random gold between 25 and 75
        setDungeonState(prevState => ({
          ...prevState,
          gold: prevState.gold + goldReward,
          message: `You defeated the ${dungeonState.monsterName} and found ${goldReward} gold!`,
          monsterHealth: 50 + dungeonState.level * 10, // Reset monster health for next level
          level: prevState.level + 1,
          monsterName: `Monster Level ${prevState.level + 1}`, // Update monster name
          isFighting: false,
          isLoading: false,
        }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (Platform.OS === 'android') {
          Vibration.vibrate(500);
        }
      } else {
        // Monster still alive, monster attacks back
        const monsterDamage = Math.floor(Math.random() * 15) + 5; // Random monster damage between 5 and 20
        const newHealth = dungeonState.health - monsterDamage;

        setDungeonState(prevState => ({
          ...prevState,
          health: newHealth > 0 ? newHealth : 0,
          monsterHealth: newMonsterHealth,
          message: `You attacked for ${damage} damage! The ${dungeonState.monsterName} retaliated for ${monsterDamage} damage!`,
          isFighting: false,
          isLoading: false,
        }));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        if (Platform.OS === 'android') {
          Vibration.vibrate(200);
        }

        if (newHealth <= 0) {
          // Player died
          Alert.alert('Game Over', 'You have been defeated!', [
            { text: 'Restart', onPress: () => resetGame() },
          ]);
        }
      }
    }, 1500); // Simulate attack duration
  };

  const handleUsePotion = () => {
    if (dungeonState.isFighting || dungeonState.isLoading) return;

    setDungeonState(prevState => ({
      ...prevState,
      health: Math.min(100, prevState.health + 30), // Heal for 30, max 100
      message: 'You used a potion and healed for 30 health!',
    }));
    Haptics.selectionAsync();
  };

  const resetGame = () => {
    setDungeonState(initialDungeonState);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor="#333" />
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Dungeon Level: {dungeonState.level}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Image source={swordIcon} style={styles.icon} />
            <Text style={styles.statText}>Health: {dungeonState.health}</Text>
          </View>
          <View style={styles.statItem}>
            <Image source={goldIcon} style={styles.icon} />
            <Text style={styles.statText}>Gold: {dungeonState.gold}</Text>
          </View>
        </View>

        <View style={styles.monsterContainer}>
          <Text style={styles.monsterName}>{dungeonState.monsterName}</Text>
          <Image source={dungeonState.monsterImage} style={styles.monsterImage} />
          <Text style={styles.monsterHealth}>Monster Health: {dungeonState.monsterHealth}</Text>
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleAttack} disabled={dungeonState.isFighting || dungeonState.isLoading}>
            <Text style={styles.actionButtonText}>
              {dungeonState.isLoading ? 'Attacking...' : 'Attack'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleUsePotion} disabled={dungeonState.isFighting || dungeonState.isLoading}>
            <Text style={styles.actionButtonText}>Use Potion</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>{dungeonState.message}</Text>
        </View>

        {dungeonState.isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#333',
  },
  container: {
    flex: 1,
    backgroundColor: '#333',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'spaceAround',
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 5,
  },
  statText: {
    fontSize: 16,
    color: '#fff',
  },
  monsterContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  monsterName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  monsterImage: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  monsterHealth: {
    fontSize: 16,
    color: '#fff',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'spaceAround',
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 20,
  },
  messageText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DungeonScreen;