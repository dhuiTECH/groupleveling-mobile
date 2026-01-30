import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Modal,
  Dimensions,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
// Import existing icons
import { LockIcon } from '../components/icons/LockIcon';
import { XIcon } from '../components/icons/XIcon';

// Custom components and types
import { User, ShopItem, UserCosmetic } from '../types/user';
import { calculateLevel, getRank, calculateDerivedStats } from '../utils/stats';
import { RANK_COLORS } from '../constants/gameConstants';
import LayeredAvatar from '../components/LayeredAvatar';
import { ShopItemMedia } from '../components/ShopItemMedia';
import { useAuth } from '../hooks/useAuth';
import { useGameData } from '../hooks/useGameData';
import { useApi } from '../hooks/useApi';

const { width } = Dimensions.get('window');

export const InventoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuth();
  const { shopItems, equippedItems, totalStats, refreshGameData } = useGameData();
  const { put } = useApi();

  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'equipped' | 'weapons' | 'armor' | 'accessories' | 'magics'>('all');
  const [inventorySortAZ, setInventorySortAZ] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<{ item: ShopItem; cosmeticItem: UserCosmetic } | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<User | null>(null);

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Loading user data...</Text>
      </SafeAreaView>
    );
  }

  const level = calculateLevel(user.exp);
  const rank = getRank(level);

  const handleEquipCosmetic = useCallback(async (cosmeticId: string, equipped: boolean) => {
    if (!user) return;

    const updatedCosmetics = user.cosmetics?.map(c =>
      c.id === cosmeticId ? { ...c, equipped: equipped } : c
    ) || [];
    setUser({ ...user, cosmetics: updatedCosmetics });

    try {
      const { success, message } = await put(`/user_cosmetics/${cosmeticId}`, { equipped });
      if (!success) {
        console.error('Failed to update cosmetic:', message);
        setUser(user); 
      } else {
        refreshGameData();
      }
    } catch (error) {
      console.error('Error equipping/unequipping cosmetic:', error);
      setUser(user);
    }
  }, [user, setUser, put, refreshGameData]);

  const getFilteredInventoryItems = useCallback(() => {
    let filtered = (user.cosmetics || []).filter((cosmeticItem: UserCosmetic) => {
      const item = cosmeticItem.shop_items || shopItems.find(shopItem => shopItem.id === cosmeticItem.shop_item_id);
      return item?.slot !== 'background' && item?.slot !== 'avatar';
    });

    if (inventoryFilter !== 'all') {
      filtered = filtered.filter((cosmeticItem: UserCosmetic) => {
        const item = cosmeticItem.shop_items || shopItems.find(shopItem => shopItem.id === cosmeticItem.shop_item_id);
        switch (inventoryFilter) {
          case 'equipped':
            return cosmeticItem.equipped === true;
          case 'weapons':
            return item?.slot === 'weapon';
          case 'armor':
            return item?.slot === 'body';
          case 'accessories':
            return !['weapon', 'body', 'background', 'magic effects', 'avatar', 'fullbody', 'skin', 'character'].includes(item?.slot || '');
          case 'magics':
            return item?.slot === 'magic effects';
          default:
            return true;
        }
      });
    }

    if (inventorySortAZ) {
      return filtered.sort((a: UserCosmetic, b: UserCosmetic) => {
        const itemA = a.shop_items || shopItems.find(shopItem => shopItem.id === a.shop_item_id);
        const itemB = b.shop_items || shopItems.find(shopItem => shopItem.id === b.shop_item_id);
        const nameA = itemA?.name || '';
        const nameB = itemB?.name || '';
        return nameA.localeCompare(nameB);
      });
    } else {
      return filtered.sort((a: UserCosmetic, b: UserCosmetic) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [user, inventoryFilter, inventorySortAZ, shopItems]);

  const getFullDescription = useCallback((item: ShopItem) => {
    if (item.bonuses && Array.isArray(item.bonuses) && item.bonuses.length > 0) {
      return 'BONUSES: ' + item.bonuses.map((bonus: any) => {
        const typeName = bonus.type === 'str' ? 'STR' :
                        bonus.type === 'spd' ? 'SPD' :
                        bonus.type === 'end' ? 'END' :
                        bonus.type === 'int' ? 'INT' :
                        bonus.type === 'lck' ? 'LCK' :
                        bonus.type === 'per' ? 'PER' :
                        bonus.type === 'wil' ? 'WIL' :
                        bonus.type === 'attack_damage' ? 'ATK DMG' :
                        bonus.type === 'crit_percentage' ? 'CRIT %' :
                        bonus.type === 'crit_damage' ? 'CRIT DMG' :
                        bonus.type === 'intelligence' ? 'INT' :
                        bonus.type.replace('_', ' ').toUpperCase();
        const suffix = bonus.type.includes('percentage') || bonus.type === 'xp_boost' ? '%' :
                     bonus.type === 'crit_damage' ? 'x' : '';
        return `${typeName} +${bonus.value}${suffix}`;
      }).join(', ');
    } else if (item.bonus_type) {
      const typeName = item.bonus_type === 'str' ? 'STR' :
                     item.bonus_type === 'spd' ? 'SPD' :
                     item.bonus_type === 'end' ? 'END' :
                     item.bonus_type === 'int' ? 'INT' :
                     item.bonus_type === 'lck' ? 'LCK' :
                     item.bonus_type === 'per' ? 'PER' :
                     item.bonus_type === 'wil' ? 'WIL' :
                     item.bonus_type === 'attack_damage' ? 'ATK DMG' :
                     item.bonus_type === 'crit_percentage' ? 'CRIT %' :
                     item.bonus_type === 'crit_damage' ? 'CRIT DMG' :
                     item.bonus_type === 'intelligence' ? 'INT' :
                     item.bonus_type.replace('_', ' ').toUpperCase();
      const suffix = item.bonus_type.includes('percentage') || item.bonus_type === 'xp_boost' ? '%' :
                   item.bonus_type === 'crit_damage' ? 'x' : '';
      return `BONUS: ${typeName} +${item.bonus_value}${suffix}`;
    }
    return '';
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? insets.top : 0 }}>
      <ScrollView
        style={styles.scrollViewContent}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <LayeredAvatar user={user} size={width < 640 ? width * 0.7 : 224} onAvatarClick={() => setSelectedAvatar(user)} />
            <View style={styles.avatarButtonsContainer}>
              <TouchableOpacity
                onPress={() => setShowAvatarModal(true)}
                style={styles.avatarButton}
              >
                <Image source={require('../../assets/changeavatar.png')} style={styles.avatarButtonIcon} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowBackgroundModal(true)}
                style={styles.backgroundButton}
              >
                <Image source={require('../../assets/backgroundicon.png')} style={styles.avatarButtonIcon} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.userName}>{user.name || 'Adventurer'}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Rank</Text>
              <Text style={[styles.statValue, { color: RANK_COLORS[rank] || '#fff' }]}>{rank}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Level</Text>
              <Text style={styles.statValue}>{level}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Power</Text>
              <Text style={[styles.statValue, { color: RANK_COLORS['C'] }]}>
                {Object.values(totalStats || {}).reduce((sum: number, val: any) => {
                  return sum + (typeof val === 'number' ? val : 0);
                }, 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Equipped Items Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: RANK_COLORS['C'] }]}>
            ⚔️ Equipped Items
          </Text>
          <View style={styles.equippedGrid}>
            {['weapon', 'body', 'back', 'hands', 'feet'].map(slot => {
              const equippedItem = (equippedItems || []).find((cosmetic: UserCosmetic) => cosmetic.shop_items?.slot === slot);
              const rarity = equippedItem?.shop_items?.rarity?.toLowerCase() || 'common';
              const rarityColor = RANK_COLORS[rarity.charAt(0).toUpperCase()] || '#9ca3af';
              
              return (
                <TouchableOpacity 
                  key={slot}
                  style={[
                    styles.equippedSlot,
                    equippedItem 
                      ? { borderColor: rarityColor, backgroundColor: 'rgba(15, 23, 42, 0.8)', shadowColor: rarityColor, shadowOpacity: 0.15, shadowRadius: 10 } 
                      : styles.emptySlot,
                  ]}
                  onPress={() => equippedItem && setSelectedInventoryItem({ item: equippedItem.shop_items, cosmeticItem: equippedItem })}
                >
                  {equippedItem ? (
                    <View style={styles.equippedItemContent}>
                      <View 
                        style={[
                          styles.radiatingEnergy,
                          { 
                            backgroundColor: 
                            rarity === 'uncommon' ? 'rgba(34, 197, 94, 0.15)' :
                            rarity === 'rare' ? 'rgba(59, 130, 246, 0.25)' :
                            rarity === 'epic' ? 'rgba(168, 85, 247, 0.35)' :
                            rarity === 'legendary' ? 'rgba(255, 255, 0, 0.35)' :
                            rarity === 'monarch' ? 'rgba(255, 215, 0, 0.6)' :
                            'transparent'
                          }
                        ]}
                      />
                      
                      <View style={styles.equippedItemMediaContainer}>
                        <ShopItemMedia item={equippedItem.shop_items} style={styles.equippedItemMedia} />
                      </View>
                    </View>
                  ) : (
                    <LockIcon size={16} color="#6b7280" />
                  )}
                  <Text style={styles.slotLabel}>
                    {slot === 'weapon' ? 'weapon' :
                     slot === 'body' ? 'armor' :
                     slot === 'feet' ? 'feet' :
                     slot === 'hands' ? 'hands' :
                     slot === 'back' ? 'back' :
                     slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {Object.keys(totalStats || {}).length > 0 && (
            <View style={styles.equipmentStatsContainer}>
              <Text style={styles.equipmentStatsLabel}>Equipment Stats</Text>
              <View style={styles.statsRow}>
                {Object.entries(totalStats || {}).map(([stat, value]: [string, any]) => (
                  <Text key={stat} style={styles.equipmentStatText}>
                    {stat === 'attack_damage' ? 'ATK DMG' :
                     stat === 'crit_percentage' ? 'CRIT %' :
                     stat === 'crit_damage' ? 'CRIT DMG' :
                     stat === 'intelligence' ? 'INT' :
                     stat.replace('_', ' ').toUpperCase()} +{typeof value === 'object' ? 0 : value}{stat.includes('percentage') || stat === 'xp_boost' ? '%' :
                     stat === 'crit_damage' ? 'x' : ''}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Equipped Accessories Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: RANK_COLORS['B'] }]}>
            💍 Equipped Accessories
          </Text>
          <View style={styles.equippedGrid}>
            {['magic effects', 'eyes', 'head', 'face', 'accessory'].map((slot, index) => {
              if (slot === 'accessory') {
                const allAccessories = (equippedItems || []).filter((cosmetic: UserCosmetic) => {
                  const itemSlot = cosmetic.shop_items?.slot;
                  return ['accessory', 'jewelry', 'charms', 'scarves', 'earrings'].includes(itemSlot || '');
                });

                return (
                  <View key="multi-accessory" style={styles.multiAccessorySlot}>
                    <View style={styles.multiAccessoryGrid}>
                      {Array.from({ length: 6 }, (_, accessoryIndex) => {
                        const equippedAccessory = allAccessories[accessoryIndex];
                        const rarity = equippedAccessory?.shop_items?.rarity?.toLowerCase() || 'common';
                        
                        return (
                          <TouchableOpacity 
                            key={accessoryIndex}
                            style={[
                              styles.miniAccessorySlot,
                              equippedAccessory ? { borderColor: RANK_COLORS[rarity.charAt(0).toUpperCase()], shadowColor: RANK_COLORS[rarity.charAt(0).toUpperCase()], shadowOpacity: 0.2 } : {},
                            ]}
                            onPress={() => equippedAccessory && setSelectedInventoryItem({ item: equippedAccessory.shop_items, cosmeticItem: equippedAccessory })}
                          >
                            {equippedAccessory ? (
                              <View style={styles.equippedItemContent}>
                                <View 
                                  style={[
                                    styles.radiatingEnergyMicro,
                                    { 
                                      backgroundColor: 
                                      rarity === 'uncommon' ? 'rgba(34, 197, 94, 0.2)' :
                                      rarity === 'rare' ? 'rgba(59, 130, 246, 0.3)' :
                                      rarity === 'epic' ? 'rgba(168, 85, 247, 0.4)' :
                                      rarity === 'legendary' ? 'rgba(255, 255, 0, 0.4)' :
                                      rarity === 'monarch' ? 'rgba(255, 215, 0, 0.7)' :
                                      'transparent'
                                    }
                                  ]}
                                />
                                <View style={styles.miniAccessoryMediaContainer}>
                                  <ShopItemMedia item={equippedAccessory.shop_items} style={styles.miniAccessoryMedia} />
                                </View>
                              </View>
                            ) : (
                              <LockIcon size={6} color="#4b5563" />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <Text style={styles.slotLabel}>Multi-Accessory</Text>
                  </View>
                );
              }

              const equippedItem = (equippedItems || []).find((cosmetic: UserCosmetic) => cosmetic.shop_items?.slot === slot);
              const rarity = equippedItem?.shop_items?.rarity?.toLowerCase() || 'common';
              const rarityColor = RANK_COLORS[rarity.charAt(0).toUpperCase()] || '#9ca3af';

              return (
                <TouchableOpacity 
                  key={slot}
                  style={[
                    styles.equippedSlot,
                    equippedItem 
                      ? { borderColor: rarityColor, backgroundColor: 'rgba(15, 23, 42, 0.8)', shadowColor: rarityColor, shadowOpacity: 0.2 } 
                      : styles.emptySlot,
                  ]}
                  onPress={() => equippedItem && setSelectedInventoryItem({ item: equippedItem.shop_items, cosmeticItem: equippedItem })}
                >
                  {equippedItem ? (
                    <View style={styles.equippedItemContent}>
                      <View 
                        style={[
                          styles.radiatingEnergy,
                          { 
                            backgroundColor: 
                            rarity === 'uncommon' ? 'rgba(34, 197, 94, 0.15)' :
                            rarity === 'rare' ? 'rgba(59, 130, 246, 0.25)' :
                            rarity === 'epic' ? 'rgba(168, 85, 247, 0.35)' :
                            rarity === 'legendary' ? 'rgba(255, 255, 0, 0.35)' :
                            rarity === 'monarch' ? 'rgba(255, 215, 0, 0.6)' :
                            'transparent'
                          }
                        ]}
                      />
                      
                      <View style={styles.equippedItemMediaContainer}>
                        <ShopItemMedia item={equippedItem.shop_items} style={styles.equippedItemMedia} />
                      </View>
                    </View>
                  ) : (
                    <LockIcon size={16} color="#6b7280" />
                  )}
                  <Text style={styles.slotLabel}>
                    {slot === 'magic effects' ? 'aura' :
                     slot === 'eyes' ? 'eyes' :
                     slot === 'head' ? 'Head' :
                     slot === 'face' ? 'face' :
                     slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Inventory Section */}
        <View style={styles.section}>
          <Text style={[styles.inventoryHeader, { color: RANK_COLORS['A'] }]}>
            <Image source={require('../../assets/inventory.png')} style={styles.inventoryIcon} />
            Inventory
          </Text>

          <View style={styles.filterBar}>
            <View style={styles.filterButtonsContainer}>
              {[ 
                { id: 'all', label: 'All', icon: '📦' },
                { id: 'equipped', label: 'Equipped', icon: '✅' },
                { id: 'weapons', label: 'Weapons', icon: '⚔️' },
                { id: 'armor', label: 'Armor', icon: '🛡️' },
                { id: 'accessories', label: 'Accessories', icon: '💍' },
                { id: 'magics', label: 'Magics', icon: '🔮' }
              ].map(tab => (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setInventoryFilter(tab.id as any)}
                  style={[
                    styles.inventoryFilterButton,
                    inventoryFilter === tab.id ? styles.inventoryFilterButtonActive : null,
                  ]}
                >
                  <Text style={styles.inventoryFilterButtonText}>{tab.icon} {tab.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => setInventorySortAZ(!inventorySortAZ)}
              style={[
                styles.sortButton,
                inventorySortAZ ? styles.sortButtonActive : null,
              ]}
            >
              <Text style={styles.sortButtonText}>{inventorySortAZ ? '🔤 A-Z' : '📅 Recent'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inventoryGrid}>
            {getFilteredInventoryItems().length === 0 ? (
              <Text style={styles.noItemsText}>No items in this category...</Text>
            ) : (
              getFilteredInventoryItems().map((cosmeticItem: UserCosmetic) => {
                const item = cosmeticItem.shop_items || shopItems.find(shopItem => shopItem.id === cosmeticItem.shop_item_id);
                if (!item) return null;
                const rarity = item.rarity?.toLowerCase() || 'common';
                const rarityColor = RANK_COLORS[rarity.charAt(0).toUpperCase()] || '#9ca3af';

                return (
                  <TouchableOpacity
                    key={cosmeticItem.id}
                    style={[
                      styles.inventoryItemCard,
                      cosmeticItem.equipped ? styles.inventoryItemCardEquipped : null,
                      { borderColor: rarityColor }, 
                    ]}
                    onPress={() => setSelectedInventoryItem({ item, cosmeticItem })}
                  >
                    <View style={styles.inventoryItemMediaWrapper}>
                      <View 
                        style={[
                          styles.radiatingEnergyLarge,
                          { 
                            backgroundColor: 
                            rarity === 'uncommon' ? 'rgba(34, 197, 94, 0.2)' :
                            rarity === 'rare' ? 'rgba(59, 130, 246, 0.3)' :
                            rarity === 'epic' ? 'rgba(168, 85, 247, 0.4)' :
                            rarity === 'legendary' ? 'rgba(255, 255, 0, 0.4)' :
                            rarity === 'monarch' ? 'rgba(255, 215, 0, 0.7)' :
                            'transparent'
                          }
                        ]}
                      />
                      
                      <View style={styles.inventoryItemMediaContainer}>
                        <ShopItemMedia item={item} style={[styles.inventoryItemMedia, { borderRadius: 2 }]} />
                      </View>
                    </View>

                    <Text style={styles.inventoryItemName}>
                      {item.name}
                    </Text>

                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleEquipCosmetic(cosmeticItem.id, !cosmeticItem.equipped);
                      }}
                      style={[
                        styles.equipUnequipButton,
                        cosmeticItem.equipped ? styles.unequipButton : styles.equipButton,
                      ]}
                    >
                      <Text style={styles.equipUnequipButtonText}>
                        {cosmeticItem.equipped ? 'UNEQUIP' : 'EQUIP'}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>
      </SafeAreaView>

      {/* Item Detail Modal */}
      {selectedInventoryItem && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={!!selectedInventoryItem}
          onRequestClose={() => setSelectedInventoryItem(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.itemDetailModalContent}>
              <TouchableOpacity onPress={() => setSelectedInventoryItem(null)} style={styles.closeModalButton}>
                <XIcon size={24} color="#9ca3af" />
              </TouchableOpacity>
              <View style={styles.itemDetailImageWrapper}>
                <ShopItemMedia item={selectedInventoryItem.item} style={styles.itemDetailImage} />
              </View>
              <Text style={styles.itemDetailName}>{selectedInventoryItem.item.name}</Text>
              <Text style={styles.itemDetailSlot}>{selectedInventoryItem.item.slot?.replace(/_/g, ' ')}</Text>

              {(selectedInventoryItem.item.min_level && selectedInventoryItem.item.min_level > 1) ||
               (selectedInventoryItem.item.class_req && selectedInventoryItem.item.class_req !== 'All') ||
               (selectedInventoryItem.item.gender &&
                ((Array.isArray(selectedInventoryItem.item.gender) && !selectedInventoryItem.item.gender.includes('unisex')) ||
                 (!Array.isArray(selectedInventoryItem.item.gender) && selectedInventoryItem.item.gender !== 'unisex'))) ? (
                <View style={styles.itemRequirementsContainer}>
                  {selectedInventoryItem.item.min_level && selectedInventoryItem.item.min_level > 1 && (
                    <View style={styles.requirementBadgeYellow}>
                      <Text style={styles.requirementBadgeText}>⚡ Lv. {selectedInventoryItem.item.min_level} Required</Text>
                    </View>
                  )}
                  {selectedInventoryItem.item.class_req && selectedInventoryItem.item.class_req !== 'All' && (
                    <View style={styles.requirementBadgeBlue}>
                      <Text style={styles.requirementBadgeText}>🛡️ {selectedInventoryItem.item.class_req} Only</Text>
                    </View>
                  )}
                  {selectedInventoryItem.item.gender &&
                   ((Array.isArray(selectedInventoryItem.item.gender) && !selectedInventoryItem.item.gender.includes('unisex')) ||
                    (!Array.isArray(selectedInventoryItem.item.gender) && selectedInventoryItem.item.gender !== 'unisex')) && (
                    <View style={styles.requirementBadgePink}>
                      <Text style={styles.requirementBadgeText}>👤 {Array.isArray(selectedInventoryItem.item.gender) ? selectedInventoryItem.item.gender.join('/') : selectedInventoryItem.item.gender} Only</Text>
                    </View>
                  )}
                </View>
              ) : null}

              <Text style={styles.itemDetailDescription}>{selectedInventoryItem.item.description || 'Visual item'}</Text>

              {((selectedInventoryItem.item.bonuses && Array.isArray(selectedInventoryItem.item.bonuses) && selectedInventoryItem.item.bonuses.length > 0) ||
                selectedInventoryItem.item.bonus_type) && (
                <Text style={styles.itemDetailBonuses}>
                  {getFullDescription(selectedInventoryItem.item)}
                </Text>
              )}

              {selectedInventoryItem.item.is_animated && (
                <Text style={styles.itemDetailAnimated}>✨ ANIMATED EFFECT</Text>
              )}

              <Text style={styles.itemDetailRarity}>{selectedInventoryItem.item.rarity || 'common'} rarity</Text>

              <Text style={styles.itemDetailEquippedStatus}>
                {selectedInventoryItem.cosmeticItem.equipped ? (
                  <Text style={{ color: '#34d399' }}>✅ EQUIPPED</Text>
                ) : (
                  <Text style={{ color: '#6b7280' }}>❌ NOT EQUIPPED</Text>
                )}
              </Text>

              <TouchableOpacity
                onPress={() => setSelectedInventoryItem(null)}
                style={styles.closeButtonPrimary}
              >
                <Text style={styles.closeButtonPrimaryText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Avatar Customization Modal */}
      {showAvatarModal && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={showAvatarModal}
          onRequestClose={() => setShowAvatarModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.customizationModalContent}>
              <TouchableOpacity onPress={() => setShowAvatarModal(false)} style={styles.closeModalButtonAbsolute}>
                <XIcon size={24} color="#9ca3af" />
              </TouchableOpacity>
              <View style={styles.customizationModalHeaderContainer}>
                <Image source={require('../../assets/changeavatar.png')} style={styles.customizationModalIcon} />
                <Text style={styles.customizationModalHeader}>Avatar Customization</Text>
              </View>
              <Text style={styles.customizationModalSubHeader}>Choose your hunter's appearance</Text>

              {(user.cosmetics?.filter((cosmetic: UserCosmetic) => cosmetic.shop_items?.slot === 'avatar').length === 0) ? (
                <View style={styles.emptyCustomizationPanel}>
                  <Text style={styles.emptyCustomizationEmoji}>🎭</Text>
                  <Text style={styles.emptyCustomizationText}>No holographic avatars in inventory</Text>
                  <Text style={styles.emptyCustomizationSubText}>Acquire new forms from the Hunter Shop</Text>
                </View>
              ) : (
                <ScrollView contentContainerStyle={styles.customizationGridContainer} showsVerticalScrollIndicator={false}>
                  <View style={styles.customizationGrid}>
                    {user.cosmetics?.filter((cosmetic: UserCosmetic) => cosmetic.shop_items?.slot === 'avatar').map((cosmetic: UserCosmetic) => {
                      const item = cosmetic.shop_items;
                      const isEquipped = cosmetic.equipped;
                      const rarityColor = RANK_COLORS[item.rarity.charAt(0).toUpperCase()] || '#9ca3af';

                      return (
                        <TouchableOpacity
                          key={cosmetic.id}
                          style={[
                            styles.customizationItemCard,
                            isEquipped ? styles.customizationItemCardEquipped : null,
                            { borderColor: rarityColor },
                          ]}
                          onPress={() => setSelectedInventoryItem({ item, cosmeticItem: cosmetic })}
                        >
                          <View style={styles.customizationItemImageWrapper}>
                            <View style={[styles.customizationItemPulse, { backgroundColor: isEquipped ? rarityColor : 'transparent' }]} />
                            <Image
                              source={{ uri: item.image_url }}
                              style={[styles.customizationItemImage, { borderColor: rarityColor }]} 
                            />
                          </View>
                          <Text style={styles.customizationItemName}>{item.name}</Text>
                          <Text style={styles.customizationItemRarity}>{item.rarity || 'common'} class</Text>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              handleEquipCosmetic(cosmetic.id, !cosmetic.equipped);
                            }}
                            style={[
                              styles.customizationEquipButton,
                              isEquipped ? styles.customizationUnequipButton : styles.customizationEquipButtonActive,
                            ]}
                          >
                            <Text style={styles.customizationEquipButtonText}>
                              {isEquipped ? 'UNEQUIP' : 'CHANGE AVATAR'}
                            </Text>
                          </TouchableOpacity>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      )}

      {showBackgroundModal && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={showBackgroundModal}
          onRequestClose={() => setShowBackgroundModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.customizationModalContent}>
              <TouchableOpacity onPress={() => setShowBackgroundModal(false)} style={styles.closeModalButtonAbsolute}>
                <XIcon size={24} color="#9ca3af" />
              </TouchableOpacity>
              <View style={styles.customizationModalHeaderContainer}>
                <Image source={require('../../assets/backgroundicon.png')} style={styles.customizationModalIcon} />
                <Text style={styles.customizationModalHeader}>Background Customization</Text>
              </View>
              <Text style={styles.customizationModalSubHeader}>Choose your hunter's background</Text>

              {(user.cosmetics?.filter((cosmetic: UserCosmetic) => cosmetic.shop_items?.slot === 'background').length === 0) ? (
                <View style={styles.emptyCustomizationPanel}>
                  <Text style={styles.emptyCustomizationEmoji}>🏞️</Text>
                  <Text style={styles.emptyCustomizationText}>No holographic backgrounds in inventory</Text>
                  <Text style={styles.emptyCustomizationSubText}>Acquire new backgrounds from the Hunter Shop</Text>
                </View>
              ) : (
                <ScrollView contentContainerStyle={styles.customizationGridContainer} showsVerticalScrollIndicator={false}>
                  <View style={styles.customizationGrid}>
                    {user.cosmetics?.filter((cosmetic: UserCosmetic) => cosmetic.shop_items?.slot === 'background').map((cosmetic: UserCosmetic) => {
                      const item = cosmetic.shop_items;
                      const isEquipped = cosmetic.equipped;
                      const rarityColor = RANK_COLORS[item.rarity.charAt(0).toUpperCase()] || '#9ca3af';

                      return (
                        <TouchableOpacity
                          key={cosmetic.id}
                          style={[
                            styles.customizationItemCard,
                            isEquipped ? styles.customizationItemCardEquipped : null,
                            { borderColor: rarityColor },
                          ]}
                          onPress={() => setSelectedInventoryItem({ item, cosmeticItem: cosmetic })}
                        >
                          <View style={styles.customizationItemImageWrapper}>
                            <View style={[styles.customizationItemPulse, { backgroundColor: isEquipped ? rarityColor : 'transparent', borderRadius: 8 }]} />
                            <ShopItemMedia
                              item={item}
                              style={[styles.customizationItemImage, { borderColor: rarityColor, borderRadius: 8 }]} 
                            />
                          </View>
                          <Text style={styles.customizationItemName}>{item.name}</Text>
                          <Text style={styles.customizationItemRarity}>{item.rarity || 'common'} class</Text>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              handleEquipCosmetic(cosmetic.id, !cosmetic.equipped);
                            }}
                            style={[
                              styles.customizationEquipButton,
                              isEquipped ? styles.customizationUnequipButton : styles.customizationEquipButtonActive,
                            ]}
                          >
                            <Text style={styles.customizationEquipButtonText}>
                              {isEquipped ? 'UNEQUIP' : 'CHANGE BG'}
                            </Text>
                          </TouchableOpacity>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollViewContent: {
    flexGrow: 1,
    // Removed paddingBottom here as it's now set directly on contentContainerStyle
  },
  loadingText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },

  // Avatar Section
  avatarSection: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarButtonsContainer: {
    position: 'absolute',
    top: 8,
    right: -48,
    flexDirection: 'column',
    gap: 8,
  },
  avatarButton: {
    padding: 8,
    backgroundColor: 'rgba(202, 138, 4, 0.8)', // yellow-600/80
    borderColor: 'rgba(202, 138, 4, 0.5)', // yellow-500/50
    borderWidth: 1,
    borderRadius: 4,
    shadowColor: 'rgba(202, 138, 4, 0.2)', // shadow-yellow-500/20
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 5, // For Android shadow
    // clip-tech-button - approximated with borderRadius and manual shadow
  },
  backgroundButton: {
    padding: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.8)', // slate-900/80
    borderColor: 'rgba(255, 255, 255, 0.1)', // white/10
    borderWidth: 1,
    borderRadius: 4,
    shadowColor: 'transparent', // No specific shadow in original for this
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  avatarButtonIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  userName: {
    marginTop: 16,
    fontSize: 20,
    // fontFamily: 'Avenir-Heavy', // Example font, replace with actual font if available
    fontWeight: '900',
    textTransform: 'uppercase',
    textAlign: 'center',
    color: '#06b6d4', // cyan-400
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    color: '#06b6d4', // cyan-400
    // fontFamily: 'Avenir-Heavy',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 16,
    // fontFamily: 'Avenir-Heavy',
    fontWeight: '900',
    color: '#3b82f6', // blue-400, for level
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#1f2937', // gray-800
    alignSelf: 'center',
  },

  // Section General
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 10,
    // fontFamily: 'Avenir-Heavy',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    // color: '#22c55e', // green-500 - will be dynamic
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.7)', // system-glass like effect
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    borderRadius: 4,
  },

  // Equipped Items Grid
  equippedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  equippedSlot: {
    flex: 1,
    aspectRatio: 1,
    minWidth: width < 640 ? '18%' : '19%', // Approx 1/5 with some gap, responsive
    maxWidth: width < 640 ? '19%' : '19%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 2,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.8)', // slate-900/80
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 2, 
  },
  emptySlot: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // black/40
    borderColor: '#1f2937', // gray-800
    borderStyle: 'dashed',
  },
  equippedItemContent: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiatingEnergy: {
    position: 'absolute',
    width: '130%', 
    height: '130%', 
    borderRadius: 9999, 
    opacity: 0.15,
  },
  equippedItemMediaContainer: {
    position: 'relative',
    zIndex: 10,
    width: 40, 
    height: 40, 
  },
  equippedItemMedia: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  slotLabel: {
    position: 'absolute',
    bottom: 4,
    fontSize: 6,
    // fontFamily: 'Avenir-Heavy',
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#6b7280', // gray-500
    letterSpacing: 0.5,
  },
  equipmentStatsContainer: {
    marginTop: 12,
    textAlign: 'center',
  },
  equipmentStatsLabel: {
    fontSize: 8,
    color: '#6b7280', // gray-500
    // fontFamily: 'Avenir-Heavy',
    fontWeight: '900',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  equipmentStatText: {
    fontSize: 7,
    color: '#34d399', // green-400
    // fontFamily: 'Avenir-Heavy',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },

  // Multi-Accessory Slot
  multiAccessorySlot: {
    flex: 1,
    aspectRatio: 1,
    minWidth: width < 640 ? '18%' : '19%',
    maxWidth: width < 640 ? '19%' : '19%',
    flexDirection: 'column',
    padding: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.8)', // slate-900/80
    borderColor: 'rgba(168, 85, 247, 0.5)', // purple-500/50
    borderWidth: 1,
    borderRadius: 2,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: 'rgba(168, 85, 247, 0.15)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 3,
  },
  multiAccessoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    width: '100%',
    height: 'auto',
    marginBottom: 8,
  },
  miniAccessorySlot: {
    width: '31%', 
    aspectRatio: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', 
    borderColor: 'rgba(255, 255, 255, 0.05)', 
    borderWidth: 1,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  radiatingEnergyMicro: {
    position: 'absolute',
    width: '116%', 
    height: '116%', 
    borderRadius: 9999, 
    opacity: 0.4,
  },
  miniAccessoryMediaContainer: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    height: '100%',
    padding: 2, 
  },
  miniAccessoryMedia: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },

  // Inventory Section
  inventoryHeader: {
    fontSize: 10,
    // fontFamily: 'Avenir-Heavy',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    // color: '#fb923c', // orange-400 - will be dynamic
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  inventoryIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    flex: 1,
  },
  inventoryFilterButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(15, 23, 42, 0.6)', 
  },
  inventoryFilterButtonActive: {
    backgroundColor: 'rgba(234, 88, 12, 0.8)', 
    borderColor: 'rgba(234, 88, 12, 0.5)', 
    shadowColor: 'rgba(234, 88, 12, 0.2)', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 5,
  },
  inventoryFilterButtonText: {
    fontSize: 8,
    // fontFamily: 'Avenir-Heavy',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#e2e8f0', 
  },
  sortButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(15, 23, 42, 0.6)', 
  },
  sortButtonActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.8)', 
    borderColor: 'rgba(37, 99, 235, 0.5)', 
    shadowColor: 'rgba(37, 99, 235, 0.2)', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 5,
  },
  sortButtonText: {
    fontSize: 8,
    // fontFamily: 'Avenir-Heavy',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#e2e8f0', 
  },
  inventoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 12,
  },
  noItemsText: {
    fontSize: 10,
    color: '#6b7280', 
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'center',
    marginTop: 20,
  },
  inventoryItemCard: {
    width: width < 640 ? '30%' : '23%', // Responsive width for grid items
    aspectRatio: 1,
    padding: 12,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)', 
    backgroundColor: 'rgba(15, 23, 42, 0.8)', 
    overflow: 'hidden',
  },
  inventoryItemCardEquipped: {
    backgroundColor: 'rgba(22, 101, 52, 0.2)', 
    shadowColor: 'rgba(34, 197, 94, 0.2)', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  inventoryItemMediaWrapper: {
    position: 'relative',
    width: 48,
    height: 48,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiatingEnergyLarge: {
    position: 'absolute',
    width: '150%', 
    height: '150%', 
    borderRadius: 9999,
    opacity: 0.2,
  },
  inventoryItemMediaContainer: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    height: '100%',
    padding: 4,
  },
  inventoryItemMedia: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  inventoryItemName: {
    fontSize: 9,
    // fontFamily: 'Avenir-Heavy',
    fontWeight: '900',
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 12,
    color: '#fff',
    marginBottom: 12,
  },
  equipUnequipButton: {
    width: '100%',
    paddingVertical: 6,
    borderBottomWidth: 2, 
    borderBottomColor: 'rgba(0, 0, 0, 0.4)', 
  },
  equipButton: {
    backgroundColor: 'rgba(22, 163, 74, 0.8)', 
  },
  unequipButton: {
    backgroundColor: 'rgba(71, 85, 105, 0.8)', 
  },
  equipUnequipButtonText: {
    fontSize: 8,
    // fontFamily: 'Avenir-Heavy',
    fontWeight: '900',
    textTransform: 'uppercase',
    textAlign: 'center',
    color: '#fff',
  },

  // Modals General
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)', 
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },

  // Item Detail Modal
  itemDetailModalContent: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
    borderColor: 'rgba(255, 255, 255, 0.1)', 
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    maxWidth: width * 0.9, 
    width: '100%',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
    borderBottomWidth: 4, 
    borderBottomColor: '#0f172a', 
    transform: [{ skewX: '-2deg' }], 
  },
  closeModalButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 8,
  },
  itemDetailImageWrapper: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#1f2937', 
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)', 
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 12,
  },
  itemDetailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  itemDetailName: {
    fontSize: 20,
    // fontFamily: 'Avenir-Heavy',
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#fff',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  itemDetailSlot: {
    fontSize: 12,
    color: '#a78bfa', 
    // fontFamily: 'Avenir-Heavy',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  itemRequirementsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  requirementBadgeYellow: {
    backgroundColor: 'rgba(202, 138, 4, 0.4)', 
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(202, 138, 4, 0.6)', 
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  requirementBadgeBlue: {
    backgroundColor: 'rgba(37, 99, 235, 0.4)', 
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.6)', 
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  requirementBadgePink: {
    backgroundColor: 'rgba(236, 72, 153, 0.4)', 
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.6)', 
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  requirementBadgeText: {
    fontSize: 12,
    // fontFamily: 'Avenir-Heavy',
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#fff',
  },
  itemDetailDescription: {
    fontSize: 14,
    color: '#3b82f6', 
    marginBottom: 12,
    lineHeight: 20,
    textAlign: 'center',
  },
  itemDetailBonuses: {
    fontSize: 12,
    color: '#34d399', 
    // fontFamily: 'Avenir-Heavy',
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  itemDetailAnimated: {
    fontSize: 12,
    color: '#06b6d4', 
    // fontFamily: 'Avenir-Heavy',
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  itemDetailRarity: {
    fontSize: 12,
    color: '#fbbf24', 
    // fontFamily: 'Avenir-Heavy',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 12,
    textAlign: 'center',
  },
  itemDetailEquippedStatus: {
    fontSize: 12,
    // fontFamily: 'Avenir-Heavy',
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  closeButtonPrimary: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: '#4b5563', 
    borderRadius: 4,
    borderBottomWidth: 4,
    borderBottomColor: '#1f2937', 
    marginTop: 12,
    overflow: 'hidden',
  },
  closeButtonPrimaryText: {
    fontSize: 12,
    // fontFamily: 'Avenir-Heavy',
    fontWeight: '900',
    textTransform: 'uppercase',
    textAlign: 'center',
    color: '#fff',
  },
  // Customization Modals (Avatar & Background)
  customizationModalContent: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
    borderColor: 'rgba(255, 255, 255, 0.1)', 
    borderWidth: 1,
    borderRadius: 8,
    padding: 24,
    maxWidth: width * 0.9, 
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
    borderBottomWidth: 4, 
    borderBottomColor: '#0f172a', 
    transform: [{ skewX: '-2deg' }], 
  },
  closeModalButtonAbsolute: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 210,
    padding: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.6)', 
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)', 
  },
  customizationModalHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 4,
  },
  customizationModalHeader: {
    fontSize: 20,
    // fontFamily: 'Avenir-Heavy',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#eab308', // yellow-400 equivalent for avatar modal
    textShadowColor: 'rgba(234,179,8,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  customizationModalIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  customizationModalSubHeader: {
    fontSize: 10,
    color: '#6b7280', 
    // fontFamily: 'Avenir-Heavy',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 24,
  },
  emptyCustomizationPanel: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)', 
    borderColor: '#4b5563', 
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 40,
    alignItems: 'center',
    borderRadius: 8,
  },
  emptyCustomizationEmoji: {
    fontSize: 40,
    marginBottom: 12,
    opacity: 0.5,
  },
  emptyCustomizationText: {
    fontSize: 14,
    color: '#9ca3af', 
    // fontFamily: 'Avenir-Heavy',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  emptyCustomizationSubText: {
    fontSize: 10,
    color: '#6b7280', 
    marginTop: 4,
    // fontFamily: 'Avenir-Heavy',
    textTransform: 'uppercase',
  },
  customizationGridContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  customizationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 16,
  },
  customizationItemCard: {
    width: width < 640 ? '46%' : '30%', // Responsive width for grid items
    padding: 16,
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#4b5563', 
    backgroundColor: 'rgba(15, 23, 42, 0.7)', 
    position: 'relative',
    overflow: 'hidden',
    borderBottomWidth: 4, 
    borderBottomColor: '#0f172a', 
    transform: [{ skewX: '-2deg' }], 
  },
  customizationItemCardEquipped: {
    backgroundColor: 'rgba(22, 101, 52, 0.2)', 
    shadowColor: 'rgba(234,179,8,0.2)', // yellow-500/20 for avatar
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 20,
    borderColor: 'rgba(234,179,8,0.5)', 
  },
  customizationItemImageWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    marginBottom: 12,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customizationItemPulse: {
    position: 'absolute',
    inset: 0,
    borderRadius: 9999,
    opacity: 0.2,
  },
  customizationItemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: 'rgba(234,179,8,0.5)', 
    position: 'relative',
    zIndex: 10,
  },
  customizationItemName: {
    fontSize: 12,
    // fontFamily: 'Avenir-Heavy',
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#eab308', 
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  customizationItemRarity: {
    fontSize: 8,
    color: '#6b7280', 
    // fontFamily: 'Avenir-Heavy',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 12,
    lineHeight: 12,
  },
  customizationEquipButton: {
    width: '100%',
    paddingVertical: 8,
    borderBottomWidth: 4,
    borderBottomColor: '#1f2937', 
    transform: [{ skewX: '-2deg' }], 
  },
  customizationUnequipButton: {
    backgroundColor: '#4b5563', 
    // color: '#e2e8f0', 
  },
  customizationEquipButtonActive: {
    backgroundColor: '#16a34a', 
    // color: '#fff',
    shadowColor: 'rgba(34, 197, 94, 0.3)', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  customizationEquipButtonText: {
    fontSize: 9,
    // fontFamily: 'Avenir-Heavy',
    fontWeight: '900',
    textTransform: 'uppercase',
    textAlign: 'center',
    color: '#fff',
  },
});