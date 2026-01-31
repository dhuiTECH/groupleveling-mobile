import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Image, 
  Alert, 
  FlatList, 
  RefreshControl, 
  Dimensions, 
  Platform,
  ImageBackground
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, AnimatePresence } from 'moti';
import * as Haptics from 'expo-haptics';
import { playHunterSound } from '../utils/audio';
import { useAuth } from '../contexts/AuthContext';
import { useGameData } from '../hooks/useGameData';

// Icons/Assets
import coinIcon from '../../assets/coinicon.png';
import gemIcon from '../../assets/gemicon.png';
import shopIcon from '../../assets/shopicon.png';
import placeholderImage from '../../assets/icon.png';

const { width } = Dimensions.get('window');

type Category = 'all' | 'weapons' | 'armor' | 'cosmetics' | 'potions';

export const ShopScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { shopItems: allItems, loading: dataLoading } = useGameData();

  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Fallback items if allItems is empty
  const displayItems = allItems.length > 0 ? allItems : [
    { id: '1', name: 'BASIC_SWORD', price: 100, category: 'weapons', rarity: 'Common', image: placeholderImage },
    { id: '2', name: 'HP_POTION_S', price: 50, category: 'potions', rarity: 'Common', image: placeholderImage },
    { id: '3', name: 'IRON_PLATE', price: 250, category: 'armor', rarity: 'Uncommon', image: placeholderImage },
    { id: '4', name: 'SHADOW_CLOAK', price: 500, category: 'cosmetics', rarity: 'Rare', image: placeholderImage },
  ];

  const filteredItems = activeCategory === 'all' 
    ? displayItems 
    : displayItems.filter(item => item.category === activeCategory);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1500);
  }, []);

  const handlePurchase = (item: any) => {
    playHunterSound('click');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    Alert.alert(
      'INITIATE_TRANSACTION',
      `Confirm acquisition of ${item.name} for ${item.price} Gold?`,
      [
        { text: 'ABORT', style: 'cancel' },
        { 
          text: 'CONFIRM', 
          onPress: () => {
            playHunterSound('purchasesuccess');
            Alert.alert('System', 'Transaction complete. Item transferred to inventory.');
          } 
        }
      ]
    );
  };

  const categories: { id: Category; label: string }[] = [
    { id: 'all', label: 'ALL_ITEMS' },
    { id: 'weapons', label: 'WEAPONS' },
    { id: 'armor', label: 'ARMOR' },
    { id: 'potions', label: 'CONSUMABLES' },
    { id: 'cosmetics', label: 'SYSTEM_SKINS' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#020617', '#0f172a', '#020617']}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? insets.top : 0 }}>
        {/* HUD Header */}
        <View style={styles.hudHeader}>
          <View style={styles.hudLeft}>
            <Text style={styles.hudLabel}>LOCATION</Text>
            <Text style={styles.hudValue}>HUNTER_TRADING_POST</Text>
          </View>
          <View style={styles.hudRight}>
            <View style={styles.currencyBox}>
              <Image source={coinIcon} style={styles.currencyIcon} />
              <Text style={styles.currencyValue}>{user?.coins?.toLocaleString() || '0'}</Text>
            </View>
          </View>
        </View>

        {/* Category Tabs */}
        <View style={styles.categoryBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => {
                  playHunterSound('click');
                  setActiveCategory(cat.id);
                }}
                style={[
                  styles.categoryTab,
                  activeCategory === cat.id && styles.categoryTabActive
                ]}
              >
                <Text style={[
                  styles.categoryText,
                  activeCategory === cat.id && styles.categoryTextActive
                ]}>
                  {cat.label}
                </Text>
                {activeCategory === cat.id && (
                  <MotiView
                    from={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ type: 'timing', duration: 200 }}
                    style={styles.activeUnderline}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Items Grid */}
        <FlatList
          data={filteredItems}
          numColumns={2}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.itemsGrid}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#06b6d4" />
          }
          renderItem={({ item, index }) => (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: index * 100 }}
              style={styles.itemCardContainer}
            >
              <TouchableOpacity 
                style={styles.itemCard}
                onPress={() => handlePurchase(item)}
                activeOpacity={0.7}
              >
                <View style={styles.itemImageWrapper}>
                  <View style={styles.itemRarityGlow} />
                  <Image source={item.image || placeholderImage} style={styles.itemImage} />
                </View>
                
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <View style={styles.itemPriceRow}>
                    <Image source={coinIcon} style={styles.smallCoinIcon} />
                    <Text style={styles.itemPrice}>{item.price}</Text>
                  </View>
                </View>

                {/* Decorative Elements */}
                <View style={styles.cardCorner} />
              </TouchableOpacity>
            </MotiView>
          )}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  hudHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 211, 238, 0.2)',
  },
  hudLeft: {
    alignItems: 'flex-start',
  },
  hudRight: {
    alignItems: 'flex-end',
  },
  hudLabel: {
    color: 'rgba(34, 211, 238, 0.6)',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 2,
  },
  hudValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textTransform: 'uppercase',
  },
  currencyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    gap: 6,
  },
  currencyIcon: {
    width: 14,
    height: 14,
  },
  currencyValue: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  categoryBar: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryScroll: {
    paddingHorizontal: 15,
    gap: 10,
  },
  categoryTab: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  categoryTabActive: {
    // backgroundColor: 'rgba(34, 211, 238, 0.1)',
  },
  categoryText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  categoryTextActive: {
    color: '#22d3ee',
  },
  activeUnderline: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 2,
    backgroundColor: '#22d3ee',
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  itemsGrid: {
    padding: 15,
  },
  itemCardContainer: {
    flex: 0.5,
    padding: 6,
  },
  itemCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    height: 200,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  itemImageWrapper: {
    height: 100,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  itemRarityGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    zIndex: 0,
  },
  itemImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    zIndex: 1,
  },
  itemInfo: {
    marginTop: 10,
  },
  itemName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  smallCoinIcon: {
    width: 10,
    height: 10,
  },
  itemPrice: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  cardCorner: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 20,
    height: 20,
    backgroundColor: 'rgba(34, 211, 238, 0.2)',
    transform: [{ rotate: '45deg' }],
  },
});

export default ShopScreen;
