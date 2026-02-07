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
import { supabase } from '@/lib/supabase';
import { playHunterSound } from '@/utils/audio';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useGameData } from '@/hooks/useGameData';
import { api } from '@/api/shop';
import ShopView from '@/components/ShopView';
import { ShopItem } from '@/types/user';

export const ShopScreen: React.FC<{ route: any }> = ({ route }) => {
  // Guard against undefined params (e.g. from Tab Navigator)
  const currentNodeId = route?.params?.currentNodeId;
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuth();
  const { showNotification } = useNotification();
  const { refreshGameData } = useGameData();

  const [loading, setLoading] = useState(true);
  const [allItems, setAllItems] = useState<ShopItem[]>([]);

  const fetchItems = useCallback(async (nodeId: string | undefined) => {
    try {
      setLoading(true);
      // 1. Fetch the Global/Standard items
      const { data: globalItems } = await supabase
        .from('shop_items')
        .select('*')
        .eq('is_global', true);

      let exclusives: any[] = [];
      
      // 2. If a specific node is passed (e.g. traveling merchant), fetch exclusives
      if (nodeId) {
        const { data: exclusiveLinks } = await supabase
          .from('shop_exclusives')
          .select('shop_items(*)')
          .eq('shop_id', nodeId);
          
        exclusives = exclusiveLinks?.map(link => link.shop_items) || [];
      }

      // 3. Combine them for your UI
      setAllItems([...(globalItems || []), ...exclusives]);
    } catch (error) {
      console.error('Failed to fetch shop items:', error);
      Alert.alert('System Error', 'Failed to synchronize with Hunter Trading Post.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Always fetch items, even if currentNodeId is undefined (shows global items only)
    fetchItems(currentNodeId);
  }, [fetchItems, currentNodeId]);

  const handleBuyItem = async (item: ShopItem, currency: 'coins' | 'gems' | 'both' = 'coins') => {
    if (!user) return;

    playHunterSound('click');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const result = await api.purchaseItem(user.id, item.id, currency);

      if (result.success) {
        playHunterSound('purchasesuccess');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const updatedUser = { ...user };
        if (result.newCoinBalance !== undefined) updatedUser.coins = result.newCoinBalance;
        if (result.newGemBalance !== undefined) updatedUser.gems = result.newGemBalance;
        // Add new cosmetic so the shop list excludes it immediately (no refetch delay)
        if (result.cosmetic) {
          const newCosmetic = {
            ...result.cosmetic,
            created_at: (result.cosmetic as any).acquired_at ?? new Date().toISOString(),
          };
          updatedUser.cosmetics = [...(user.cosmetics || []), newCosmetic];
        }

        setUser(updatedUser);
        refreshGameData();

        showNotification('Purchase complete. Check inventory (avatars/backgrounds in top right).', 'success');
      } else {
        playHunterSound('error');
        showNotification(result.message || 'Purchase failed', 'error');
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      showNotification(error?.message || 'The transaction could not be completed.', 'error');
    }
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
