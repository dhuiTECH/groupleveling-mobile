import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Modal, Image, ScrollView, ActivityIndicator } from 'react-native';
import { InteractionModal } from '@/components/modals/InteractionModal';
import Toast from 'react-native-toast-message';
import { LevelUpModal } from '@/components/modals/LevelUpModal';
import { RaidCombatModal } from '@/components/modals/RaidCombatModal';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';


import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useExploration } from '@/hooks/useExploration';
import { useStepTracker } from '@/hooks/useStepTracker';
import LayeredAvatar from '@/components/LayeredAvatar';
import { TravelMenu } from '@/components/modals/TravelMenu';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const TILE_SIZE = width / 5; // Grid is 5 tiles wide

// 📐 ASPECT RATIO MATH (9:16 Vertical)
// We set width to 2000px virtual size. Height is calculated to match 9:16 ratio.
const MAP_WIDTH = 2000;
const MAP_HEIGHT = MAP_WIDTH * (16 / 9);

export const WorldMapScreen = () => {
  const navigation = useNavigation<any>();
  const { user, setUser } = useAuth();
  const [activeMapUrl, setActiveMapUrl] = useState<string | null>(null);
  const [travelMenuVisible, setTravelMenuVisible] = useState(false);
  const [encounter, setEncounter] = useState<any | null>(null);
  const [interactionVisible, setInteractionVisible] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(user?.level || 1);
  const [levelUpVisible, setLevelUpVisible] = useState(false);
  const [raidModalVisible, setRaidModalVisible] = useState(false);
  const [activeRaid, setActiveRaid] = useState<any | null>(null);
  const [systemNews, setSystemNews] = useState<any[]>([]);
  const [navigationTarget, setNavigationTarget] = useState<any | null>(null);

  const {
    move,
    refreshVision,
    visionGrid,
    fastTravel,
    bankSteps,
    autoTravelReport,
    setAutoTravelReport,
    checkpointAlert,
    setCheckpointAlert
  } = useExploration(setEncounter, setInteractionVisible, setActiveRaid, setRaidModalVisible);

  const { pendingSteps, setPendingSteps } = useStepTracker();

  useEffect(() => {
    const fetchActiveMap = async () => {
      try {
        const { data, error } = await supabase
          .from('maps')
          .select('image_url')
          .eq('is_active', true)
          .single();

        if (error) throw error;
        if (data) setActiveMapUrl(data.image_url);
      } catch (err) {
        console.error("Error fetching active map:", err);
      }
    };

    fetchActiveMap();
    if (user) refreshVision(user.world_x || 0, user.world_y || 0);
  }, [user]); // Added user dependency to ensuring refreshVision has the latest user object

  useEffect(() => {
    if (user && user.level > previousLevel) {
      setLevelUpVisible(true);
      setPreviousLevel(user.level);
    }
  }, [user?.level]);

  useEffect(() => {
    // 1. Fetch History for Catch-up
    const fetchNewsHistory = async () => {
      const { data } = await supabase
        .from('global_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
      if (data) setSystemNews(data);
    };
    fetchNewsHistory();

    // 2. Subscribe to Live Discovery Broadcasts
    const channel = supabase
      .channel('world-news')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'global_notifications' },
        (payload) => {
          setSystemNews(prev => [payload.new, ...prev].slice(0, 3));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); // "System Alert" haptic
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleTravelSuccess = (newX: number, newY: number, cost: number) => {
    if (!user) return;
    const newSteps = (user.steps_banked || 0) - cost;

    setUser({
      ...user,
      world_x: newX,
      world_y: newY,
      steps_banked: newSteps
    });

    refreshVision(newX, newY);
  };

  const handleSystemChoice = async (choice: 'AUTO' | 'MANUAL') => {
    if (choice === 'AUTO') await fastTravel(pendingSteps);
    else await bankSteps(pendingSteps);
    setPendingSteps(0);
  };

  // 📷 CAMERA LOGIC
  // This calculates where the background image sits so your player stays in the center
  const mapLeft = -(MAP_WIDTH / 2) - ((user?.world_x || 0) * TILE_SIZE) + (width / 2);
  const mapTop = -(MAP_HEIGHT / 2) + ((user?.world_y || 0) * TILE_SIZE) + (height / 2);

  const startTestBattle = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Fetch a random encounter from encounter_pool
      const { data, error } = await supabase
        .from('encounter_pool')
        .select('id')
        .limit(10); // Get a few and pick random or just use first

      if (error) throw error;
      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        const randomId = data[randomIndex].id;
        
        navigation.navigate('Battle', { encounterId: randomId });
      } else {
        Alert.alert('System Error', 'No encounters found in pool.');
      }
    } catch (err) {
      console.error('Error starting test battle:', err);
      Alert.alert('System Error', 'Failed to initialize test combat.');
    }
  };

  const handleNewsTap = (news) => {
    // Parse the '[X, Y]' string we saved in Phase 1
    const coords = news.coordinates.replace(/[\[\]]/g, '').split(', ');
    setNavigationTarget({ x: parseInt(coords[0]), y: parseInt(coords[1]) });

    // Auto-hide the arrow after 10 seconds so it doesn't clutter the UI
    setTimeout(() => setNavigationTarget(null), 10000);
  };

  // Temple / Advancement: current tile and eligibility (matches TempleScreen logic)
  const currentTile = visionGrid.find((t) => t.x === user?.world_x && t.y === user?.world_y);
  const isOnTempleTile = currentTile?.node?.type === 'TEMPLE';
  const currentTier = user?.rank_tier ?? 0;
  const nextMilestone = (currentTier + 1) * 30;
  const isAdvancementLocked = Boolean(
    user?.next_advancement_attempt && new Date(user.next_advancement_attempt).getTime() > Date.now()
  );
  const canAttemptAdvancement = (user?.level || 0) >= nextMilestone && !isAdvancementLocked;

  const renderSystemNews = () => {
    if (systemNews.length === 0) return null;

    return (
      <View style={styles.newsContainer}>
        {systemNews.map((news) => (
          <TouchableOpacity key={news.id} onPress={() => handleNewsTap(news)}>
            <MotiView
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              style={styles.newsItem}
            >
              <Text style={styles.newsText}>
                <Text style={{ color: '#22d3ee' }}>[SYSTEM]</Text> {news.message} {news.coordinates}
              </Text>
            </MotiView>
          </TouchableOpacity>
        ))}
        {/* Clear Button */}
        <TouchableOpacity style={styles.clearNewsBtn} onPress={() => setSystemNews([])}>
          <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>

      {/* 1. THE MAP LAYER (Moving Background) */}
      <View style={styles.mapLayer}>
        {activeMapUrl ? (
          <Image
            source={{ uri: activeMapUrl }}
            style={{
              width: MAP_WIDTH,
              height: MAP_HEIGHT,
              transform: [
                { translateX: mapLeft },
                { translateY: mapTop }
              ]
            }}
            resizeMode="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]} />
        )}
      </View>

      {/* 2. THE GRID LAYER (Stationary Grid) */}
      <View style={styles.gridLayer}>
        {visionGrid.map((tile, i) => {
          const isPlayer = tile.x === user?.world_x && tile.y === user?.world_y;

          return (
            <View key={i} style={[styles.tile, { width: TILE_SIZE, height: TILE_SIZE }]}>

              {/* 1. LOCATIONS (Always visible now) */}
              {tile.node && (
                <View style={styles.nodeContainer}>
                  <Ionicons
                    name={tile.node.type === 'CITY' ? "business" : tile.node.type === 'TEMPLE' ? "flame" : "skull"}
                    size={32}
                    color={tile.node.type === 'CITY' ? "#3b82f6" : "#ef4444"}
                  />
                  <Text style={styles.nodeLabel}>{tile.node.name}</Text>
                </View>
              )}

              {/* 2. PLAYER AVATAR (Centered) */}
              {isPlayer && user && (
                <View style={styles.playerContainer}>
                  <View style={styles.playerAvatar}>
                    <LayeredAvatar user={user} size={72} />
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* 3. HUD & CONTROLS */}

      {/* Stamina Pill */}
      <View style={styles.hudTop}>
        <View style={styles.staminaPill}>
          <Ionicons name="footsteps" size={16} color="#0ea5e9" />
          <Text style={styles.staminaText}>{user?.steps_banked || 0}</Text>
        </View>
        {/* Advancement trial available notification */}
        {canAttemptAdvancement && (
          <TouchableOpacity
            style={styles.advancementBanner}
            onPress={() => navigation.navigate('Temple')}
            activeOpacity={0.9}
          >
            <Ionicons name="flame" size={18} color="#eab308" />
            <Text style={styles.advancementBannerText}>Advancement trial available — Tap to enter Temple</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Floating Compass Button */}
      <TouchableOpacity
        style={styles.floatingMapBtn}
        onPress={() => setTravelMenuVisible(true)}
      >
        <Ionicons name="compass" size={24} color="#22d3ee" />
        <Text style={styles.mapBtnText}>WORLD</Text>
      </TouchableOpacity>

      {/* TEST BATTLE BUTTON */}
      <TouchableOpacity
        style={[styles.floatingMapBtn, { top: 120, borderColor: '#ef4444' }]}
        onPress={startTestBattle}
      >
        <Ionicons name="skull" size={24} color="#ef4444" />
        <Text style={[styles.mapBtnText, { color: '#ef4444' }]}>BATTLE</Text>
      </TouchableOpacity>

      {/* Enter Temple — only when standing on a Temple tile */}
      {isOnTempleTile && (
        <TouchableOpacity
          style={[styles.floatingMapBtn, { top: 180, borderColor: '#eab308' }]}
          onPress={() => navigation.navigate('Temple')}
        >
          <Ionicons name="flame" size={24} color="#eab308" />
          <Text style={[styles.mapBtnText, { color: '#eab308' }]}>ENTER TEMPLE</Text>
        </TouchableOpacity>
      )}

      {/* Invisible Touch Controls (Ghost Buttons) */}
      <View style={styles.controlsLayer} pointerEvents="box-none">
        <TouchableOpacity onPress={() => move('N')} style={[styles.ctrlBtn, { top: '35%' }]}><Ionicons name="chevron-up" size={40} color="#fff" /></TouchableOpacity>
        <TouchableOpacity onPress={() => move('S')} style={[styles.ctrlBtn, { bottom: '35%' }]}><Ionicons name="chevron-down" size={40} color="#fff" /></TouchableOpacity>
        <TouchableOpacity onPress={() => move('W')} style={[styles.ctrlBtn, { left: '15%' }]}><Ionicons name="chevron-back" size={40} color="#fff" /></TouchableOpacity>
        <TouchableOpacity onPress={() => move('E')} style={[styles.ctrlBtn, { right: '15%' }]}><Ionicons name="chevron-forward" size={40} color="#fff" /></TouchableOpacity>
      </View>

      {/* --- MODALS --- */}

      {/* TRAVEL MENU MODAL */}
      <TravelMenu
        visible={travelMenuVisible}
        onClose={() => setTravelMenuVisible(false)}
        user={user}
        onTravelSuccess={handleTravelSuccess}
      />

      {/* Welcome Back / Offline Steps */}
      <Modal visible={pendingSteps > 0} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons name="walk" size={40} color="#22d3ee" style={{ marginBottom: 10 }} />
            <Text style={styles.systemTitle}>ENERGY COLLECTED</Text>
            <Text style={styles.bigCount}>{pendingSteps} STEPS</Text>
            <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
              <TouchableOpacity style={styles.autoBtn} onPress={() => handleSystemChoice('AUTO')}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>AUTO-HUNT</Text>
                <Text style={{ color: '#94a3b8', fontSize: 10 }}>Skip & Loot</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.manualBtn} onPress={() => handleSystemChoice('MANUAL')}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>MANUAL</Text>
                <Text style={{ color: '#94a3b8', fontSize: 10 }}>Explore Map</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Checkpoint Found */}
      <InteractionModal
        visible={!!checkpointAlert}
        onClose={() => setCheckpointAlert(null)}
        activeInteraction={checkpointAlert}
      />

      <InteractionModal
        visible={interactionVisible}
        onClose={() => setInteractionVisible(false)}
        activeInteraction={encounter}
      />

      <LevelUpModal
        visible={levelUpVisible}
        user={user}
        previousLevel={previousLevel}
        onClose={() => setLevelUpVisible(false)}
      />

      {activeRaid && (
        <RaidCombatModal
          visible={raidModalVisible}
          raidId={activeRaid.id}
          userId={user.id}
          bossImage={activeRaid.boss_image}
          bossName={activeRaid.boss_name}
          maxHp={activeRaid.max_hp}
          onClose={() => setRaidModalVisible(false)}
        />
      )}
      {renderSystemNews()}
      {navigationTarget && (
        <MotiView
          from={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          style={styles.compassContainer}
        >
          <Ionicons name="arrow-up" size={24} color="#facc15" style={{ transform: [{ rotate: `${Math.atan2(navigationTarget.x - user.world_x, navigationTarget.y - user.world_y) * 180 / Math.PI}deg` }] }} />
          <Text style={styles.compassText}>
            🎯 BOSS DETECTED: {navigationTarget.x}, {navigationTarget.y}
          </Text>
        </MotiView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#cbd5e1' }, // Light Grey background for map edges

  // MAP LAYERS
  mapLayer: { position: 'absolute', width: width, height: height, zIndex: 0 },
  gridLayer: {
    flexDirection: 'row', flexWrap: 'wrap',
    width: width, height: width,
    marginTop: (height - width) / 2,
    justifyContent: 'center', zIndex: 1
  },

  tile: { justifyContent: 'center', alignItems: 'center' },

  playerContainer: {
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  playerAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  nodeContainer: {
    alignItems: 'center',
    zIndex: 6,
  },

  nodeLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 4,
    borderRadius: 2,
  },

  hudTop: { position: 'absolute', top: 60, width: '100%', alignItems: 'center', zIndex: 20 },
  staminaPill: { flexDirection: 'row', gap: 6, backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 30, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  staminaText: { color: '#0f172a', fontWeight: '900', fontSize: 16 },
  advancementBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: 'rgba(234, 179, 8, 0.2)', borderRadius: 10, borderWidth: 1, borderColor: '#eab308', maxWidth: '90%' },
  advancementBannerText: { color: '#eab308', fontWeight: 'bold', fontSize: 12 },

  floatingMapBtn: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(2, 6, 23, 0.9)',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#22d3ee',
    zIndex: 40,
    shadowColor: '#22d3ee',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  mapBtnText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: 1,
  },

  controlsLayer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 30 },
  ctrlBtn: { position: 'absolute', padding: 20, textShadowColor: '#000', textShadowRadius: 5 },

  // MODALS
  modalOverlay: { flex: 1, backgroundColor: 'rgba(5, 10, 20, 0.85)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '80%', backgroundColor: '#0f172a', padding: 24, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },

  travelMenuCard: {
    width: '90%',
    height: '70%',
    backgroundColor: '#020617',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3b82f6',
    padding: 20,
    shadowColor: '#3b82f6',
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  travelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.2)',
    paddingBottom: 10,
  },
  travelTitle: {
    color: '#3b82f6',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  locationList: {
    flex: 1,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  locIconBg: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  locCoords: {
    color: '#64748b',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  travelAction: {
    alignItems: 'flex-end',
  },
  travelBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  travelCost: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 8,
    fontWeight: 'bold',
  },
  travelBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
  },
  currentBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  currentText: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: 'bold',
  },
  noLocationsText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 40,
    fontStyle: 'italic',
  },

  systemTitle: { color: '#22d3ee', fontSize: 18, fontWeight: '900', letterSpacing: 1, marginBottom: 5 },
  bigCount: { color: '#fff', fontSize: 32, fontWeight: '900', marginBottom: 20 },
  autoBtn: { flex: 1, backgroundColor: '#334155', padding: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#ef4444' },
  manualBtn: { flex: 1, backgroundColor: '#334155', padding: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#22d3ee' },
  closeBtn: { marginTop: 20, backgroundColor: '#22d3ee', paddingVertical: 10, paddingHorizontal: 30, borderRadius: 8 },
  newsContainer: {
    position: 'absolute',
    top: 140, // Moved down from 120
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    padding: 10,
    zIndex: 50, // Ensure it sits above map but below modals
  },
  clearNewsBtn: {
    position: 'absolute',
    right: 5,
    top: 5,
    zIndex: 10,
  },
  newsItem: {
    marginBottom: 5,
  },
  newsText: {
    color: '#fff',
    fontSize: 12,
  },
  compassContainer: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  compassText: {
    color: '#facc15',
    marginLeft: 10,
  },
});

export default WorldMapScreen;
