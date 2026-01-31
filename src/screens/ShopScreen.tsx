import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  Alert, 
  SafeAreaView, 
  Platform,
  ActivityIndicator,
  Text
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { playHunterSound } from '../utils/audio';
import { useAuth } from '../contexts/AuthContext';
import { useGameData } from '../hooks/useGameData';
import { api } from '../api/shop';
import ShopView from '../components/ShopView';
import { ShopItem } from '../types/user';

export const ShopScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuth();
  const { refreshGameData } = useGameData();

  const [loading, setLoading] = useState(true);
  const [allItems, setAllItems] = useState<ShopItem[]>([]);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const items = await api.getShopItems();
      setAllItems(items);
    } catch (error) {
      console.error('Failed to fetch shop items:', error);
      Alert.alert('System Error', 'Failed to synchronize with Hunter Trading Post.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleBuyItem = async (item: ShopItem, currency: 'coins' | 'gems' | 'both' = 'coins') => {
    if (!user) return;

    playHunterSound('click');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    Alert.alert(
      'INITIATE_TRANSACTION',
      `Confirm acquisition of ${item.name}?`,
      [
        { text: 'ABORT', style: 'cancel' },
        { 
          text: 'CONFIRM', 
          onPress: async () => {
            try {
              const result = await api.purchaseItem(user.id, item.id, currency);
              
              if (result.success) {
                playHunterSound('purchasesuccess');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                
                // Update local user state with new balance
                const updatedUser = { ...user };
                if (result.newCoinBalance !== undefined) updatedUser.coins = result.newCoinBalance;
                if (result.newGemBalance !== undefined) updatedUser.gems = result.newGemBalance;
                
                // Optimistically add cosmetic if returned, or just rely on refresh
                // For now, let's refresh game data to be safe about inventory
                setUser(updatedUser);
                refreshGameData();
                
                Alert.alert('SUCCESS', 'Transaction complete. Item transferred to inventory.');
              } else {
                playHunterSound('error');
                Alert.alert('TRANSACTION_FAILED', result.message || 'Unknown error occurred.');
              }
            } catch (error: any) {
              console.error('Purchase error:', error);
              Alert.alert('SYSTEM_ERROR', 'The transaction could not be completed.');
            }
          } 
        }
      ]
    );
  };

  if (loading && allItems.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#020617', '#0f172a', '#020617']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color="#22d3ee" />
        <Text style={styles.loadingText}>ACCESSING_DATABASE...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#020617', '#0f172a', '#020617']}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? insets.top : 0 }}>
        {user && (
          <ShopView
            user={user}
            shopItems={allItems}
            setUser={setUser}
            handleBuyItem={handleBuyItem}
            isLoading={loading}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#020617',
  },
  loadingText: {
    color: '#22d3ee',
    marginTop: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});

export default ShopScreen;
