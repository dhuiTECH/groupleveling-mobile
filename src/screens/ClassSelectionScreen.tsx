import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, Alert, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, AnimatePresence } from 'moti'; // Using Moti for the smooth flex transition

// Assets
const classImages = {
  Assassin: require('../../assets/classes/assassin.webp'),
  Fighter: require('../../assets/classes/fighter.webp'),
  Tanker: require('../../assets/classes/tanker.webp'),
  Ranger: require('../../assets/classes/ranger.webp'),
  Mage: require('../../assets/classes/mage.webp'),
  Healer: require('../../assets/classes/healer.webp'),
};

const CLASSES = [
  { id: 'Assassin', name: 'ASSASSIN', subtitle: 'VELOCITY & PRECISION', desc: 'Precision & Speed. Silent execution.', image: classImages.Assassin, color: ['#9333ea', '#000000'], stats: { agility: 95, strength: 55, vitality: 50 }, icon: '🗡️' },
  { id: 'Fighter', name: 'FIGHTER', subtitle: 'INTENSITY & STRENGTH', desc: 'Intensity & Strength. Peak power.', image: classImages.Fighter, color: ['#dc2626', '#000000'], stats: { agility: 55, strength: 95, vitality: 70 }, icon: '⚔️' },
  { id: 'Tanker', name: 'TANKER', subtitle: 'STAMINA & ENDURANCE', desc: 'Unyielding Defense. Ultimate shield.', image: classImages.Tanker, color: ['#2563eb', '#000000'], stats: { agility: 40, strength: 75, vitality: 95 }, icon: '🛡️' },
  { id: 'Ranger', name: 'RANGER', subtitle: 'PERCEPTION & FOCUS', desc: 'Perception & Range. Survival master.', image: classImages.Ranger, color: ['#ea580c', '#000000'], stats: { agility: 80, strength: 60, vitality: 60 }, icon: '🏹' },
  { id: 'Mage', name: 'MAGE', subtitle: 'TECHNICAL & CORE', desc: 'Intellect & Power. Arcane control.', image: classImages.Mage, color: ['#4f46e5', '#000000'], stats: { agility: 60, strength: 40, vitality: 50 }, icon: '🔮' },
  { id: 'Healer', name: 'HEALER', subtitle: 'RECOVERY & CONSISTENCY', desc: 'Spirit & Support. Life preservation.', image: classImages.Healer, color: ['#16a34a', '#000000'], stats: { agility: 50, strength: 45, vitality: 85 }, icon: '✨' },
];

export const ClassSelectionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string>('Fighter'); // Default selection matches Next.js
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Params passed from SignupScreen
  const { gender, name } = route.params || {};

  useEffect(() => {
    if (user) {
      setIsCheckingAuth(false);
    } else {
      const timer = setTimeout(() => setIsCheckingAuth(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleClassSelect = (classId: string) => {
    Haptics.selectionAsync();
    setSelectedClass(classId);
  };

  const handleConfirm = async () => {
    if (!selectedClass) return;
    
    const userId = user?.id || (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) {
       Alert.alert('Error', 'Critical: No user ID found.');
       return;
    }

    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
        let avatarUrl = '/NoobMan.png';
        if (gender === 'Female') avatarUrl = '/NoobWoman.png';
        else if (gender === 'Non-binary') avatarUrl = '/Noobnonbinary.png';

        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                hunter_name: name || user?.name || 'Hunter', 
                email: user?.email,
                current_class: selectedClass,
                gender: gender || 'Male',
                avatar: avatarUrl,
                level: 1,
                coins: 100, 
                onboarding_completed: true,
                updated_at: new Date().toISOString(),
            });

        if (error) throw error;

        Alert.alert('System Message', 'Class Awakening Complete.', [
            { text: 'ENTER', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] }) }
        ]);

    } catch (error: any) {
        Alert.alert('Error', error.message);
    } finally {
        setLoading(false);
    }
  };

  if (isCheckingAuth) {
      return (
          <View style={[styles.container, styles.center]}>
              <ActivityIndicator size="large" color="#06b6d4" />
              <Text style={styles.loadingText}>SYNCHRONIZING SYSTEM...</Text>
          </View>
      );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#020617']} style={StyleSheet.absoluteFill} />
      
      {/* Grid Overlay Effect */}
      <Image 
        source={{ uri: 'https://grainy-gradients.vercel.app/noise.svg' }} // Optional: Use local asset if preferred
        style={[StyleSheet.absoluteFill, { opacity: 0.05 }]}
      />

      <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
        
        {/* HUD Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>SYSTEM_STATUS: ONLINE</Text>
            </View>
            <Text style={styles.modeText}>MODE: SELECTION</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.modeText}>LOCAL_NODE: 04</Text>
          </View>
        </View>

        <View style={styles.titleContainer}>
            <Text style={styles.mainTitle}>CLASS SELECTION</Text>
            <Text style={styles.subTitle}>SELECT YOUR COMBAT ARCHETYPE</Text>
        </View>

        {/* --- VERTICAL WINDOW PANE LOGIC --- */}
        <View style={styles.paneContainer}>
            {CLASSES.map((cls) => {
                const isSelected = selectedClass === cls.id;
                
                return (
                    <MotiView
                        key={cls.id}
                        // This animates the flex value (width) just like Next.js layoutId
                        animate={{ flex: isSelected ? 5 : 1 }}
                        transition={{ type: 'timing', duration: 400 }}
                        style={[
                            styles.pane,
                            isSelected ? styles.paneSelected : styles.paneUnselected
                        ]}
                    >
                        <TouchableOpacity 
                            style={StyleSheet.absoluteFill} 
                            onPress={() => handleClassSelect(cls.id)}
                            activeOpacity={0.9}
                        >
                            <Image source={cls.image} style={styles.paneImage} />
                            <LinearGradient
                                colors={isSelected ? ['transparent', 'rgba(0,0,0,0.9)'] : ['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)']}
                                style={StyleSheet.absoluteFill}
                            />

                            {/* UNSELECTED STATE: Vertical Text */}
                            {!isSelected && (
                                <View style={styles.verticalTitleContainer}>
                                    <Text style={styles.verticalTitle}>{cls.name}</Text>
                                </View>
                            )}

                            {/* SELECTED STATE: Full Details */}
                            {isSelected && (
                                <MotiView 
                                    from={{ opacity: 0, translateY: 10 }}
                                    animate={{ opacity: 1, translateY: 0 }}
                                    transition={{ delay: 100 }}
                                    style={styles.selectedContent}
                                >
                                    <View style={styles.iconBadge}>
                                        <Text style={{ fontSize: 20 }}>{cls.icon}</Text>
                                    </View>
                                    <Text style={styles.selectedTitle}>{cls.name}</Text>
                                    <Text style={styles.selectedSubtitle}>{cls.subtitle}</Text>
                                    <Text style={styles.selectedDesc}>{cls.desc}</Text>

                                    {/* Stats Bars */}
                                    <View style={styles.statsContainer}>
                                        {Object.entries(cls.stats).map(([stat, val]) => (
                                            <View key={stat} style={styles.statRow}>
                                                <View style={styles.statLabelRow}>
                                                    <Text style={styles.statLabel}>{stat}</Text>
                                                    <Text style={styles.statValue}>{val}</Text>
                                                </View>
                                                <View style={styles.statBarBg}>
                                                    <MotiView 
                                                        from={{ width: '0%' }}
                                                        animate={{ width: `${val}%` }}
                                                        transition={{ duration: 1000 }}
                                                        style={styles.statBarFill} 
                                                    />
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </MotiView>
                            )}
                        </TouchableOpacity>
                    </MotiView>
                );
            })}
        </View>

        {/* Footer Button */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
            <TouchableOpacity
                style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
                disabled={loading}
                onPress={handleConfirm}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <View style={styles.btnInner}>
                        <Text style={styles.confirmButtonText}>CONFIRM SELECTION</Text>
                        <Text style={{ color: '#fff', marginLeft: 10 }}>→</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  center: { justifyContent: 'center', alignItems: 'center' },
  safeArea: { flex: 1 },
  loadingText: { color: '#06b6d4', marginTop: 20, fontWeight: 'bold', letterSpacing: 2 },

  // Header HUD
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10, zIndex: 10 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, backgroundColor: '#06b6d4', borderRadius: 3 },
  statusText: { color: 'rgba(34,211,238,0.7)', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: 'bold' },
  modeText: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 2 },

  titleContainer: { alignItems: 'center', marginBottom: 10, zIndex: 10 },
  mainTitle: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 1, textShadowColor: '#3b82f6', textShadowRadius: 15 },
  subTitle: { fontSize: 10, color: '#bfdbfe', letterSpacing: 3, opacity: 0.6, marginTop: 4 },

  // --- VERTICAL PANE LAYOUT ---
  paneContainer: {
    flex: 1,
    flexDirection: 'row', // Horizontal Layout
    paddingHorizontal: 8,
    gap: 4,
    marginBottom: 80, // Space for footer
  },
  pane: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
  },
  paneSelected: {
    borderColor: '#22d3ee',
    zIndex: 10,
    shadowColor: '#22d3ee',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  paneUnselected: {
    borderColor: 'rgba(255,255,255,0.1)',
  },
  paneImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // Vertical Text Logic
  verticalTitleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 4,
    // Rotate text -90 degrees
    transform: [{ rotate: '-90deg' }],
    width: 400, // Ensure width doesn't wrap when rotated
    textAlign: 'center',
  },

  // Selected Content Logic
  selectedContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 40,
  },
  iconBadge: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
    borderWidth: 1, borderColor: '#22d3ee'
  },
  selectedTitle: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  selectedSubtitle: { fontSize: 10, color: '#06b6d4', fontWeight: 'bold', letterSpacing: 2, marginBottom: 8 },
  selectedDesc: { fontSize: 12, color: '#cbd5e1', lineHeight: 16, marginBottom: 20 },

  // Stats
  statsContainer: { gap: 8 },
  statRow: { gap: 4 },
  statLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' },
  statValue: { fontSize: 9, color: '#06b6d4', fontWeight: 'bold' },
  statBarBg: { height: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  statBarFill: { height: '100%', backgroundColor: '#06b6d4' },

  // Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    alignItems: 'center', justifyContent: 'center',
    paddingTop: 10,
  },
  confirmButton: {
    width: '90%',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderWidth: 1, borderColor: '#22d3ee',
    paddingVertical: 15,
    borderRadius: 2, // Slight sharp tech look
    alignItems: 'center',
  },
  confirmButtonDisabled: { opacity: 0.7 },
  confirmButtonText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 3 },
  btnInner: { flexDirection: 'row', alignItems: 'center' },
});