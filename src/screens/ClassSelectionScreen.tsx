import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Image, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackScreenProps } from '../types/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';

// Assets
const classImages = {
  Assassin: require('../../assets/classes/assassin.webp'),
  Fighter: require('../../assets/classes/fighter.webp'),
  Tanker: require('../../assets/classes/tanker.webp'),
  Ranger: require('../../assets/classes/ranger.webp'),
  Mage: require('../../assets/classes/mage.webp'),
  Healer: require('../../assets/classes/healer.webp'),
};

interface ClassOption {
  id: string;
  name: string;
  desc: string;
  image: any;
  color: string[];
  stats: {
    strength: number; // roughly mapped to agility/strength/vitality for display
    agility: number;
    vitality: number;
  };
  icon: string;
}

const CLASSES: ClassOption[] = [
  { id: 'Assassin', name: 'Assassin', desc: 'Precision & Speed. Silent execution.', image: classImages.Assassin, color: ['#9333ea', '#000000'], stats: { agility: 95, strength: 55, vitality: 50 }, icon: '🗡️' },
  { id: 'Fighter', name: 'Fighter', desc: 'Intensity & Strength. Peak power.', image: classImages.Fighter, color: ['#dc2626', '#000000'], stats: { agility: 55, strength: 95, vitality: 70 }, icon: '⚔️' },
  { id: 'Tanker', name: 'Tanker', desc: 'Unyielding Defense. Ultimate shield.', image: classImages.Tanker, color: ['#2563eb', '#000000'], stats: { agility: 40, strength: 75, vitality: 95 }, icon: '🛡️' },
  { id: 'Ranger', name: 'Ranger', desc: 'Perception & Range. Survival master.', image: classImages.Ranger, color: ['#ea580c', '#000000'], stats: { agility: 80, strength: 60, vitality: 60 }, icon: '🏹' },
  { id: 'Mage', name: 'Mage', desc: 'Intellect & Power. Arcane control.', image: classImages.Mage, color: ['#4f46e5', '#000000'], stats: { agility: 60, strength: 40, vitality: 50 }, icon: '🔮' },
  { id: 'Healer', name: 'Healer', desc: 'Spirit & Support. Life preservation.', image: classImages.Healer, color: ['#16a34a', '#000000'], stats: { agility: 50, strength: 45, vitality: 85 }, icon: '✨' },
];

const { width } = Dimensions.get('window');

export const ClassSelectionScreen: React.FC = () => {
  const navigation = useNavigation<RootStackScreenProps<'ClassSelection'>['navigation']>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Params passed from SignupScreen
  const { gender, name } = route.params || {};

  useEffect(() => {
    // Wait for auth to settle if user is null (race condition with signup)
    if (user) {
      setIsCheckingAuth(false);
    } else {
      const timer = setTimeout(() => {
        setIsCheckingAuth(false);
      }, 2000); // Give it 2s to sync
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleClassSelect = (classId: string) => {
    Haptics.selectionAsync();
    setSelectedClass(classId);
  };

  const handleConfirm = async () => {
    if (!selectedClass) return;
    
    // Check user again
    if (!user) {
        // Try to get session one last time
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
            Alert.alert('Authentication Error', 'Session not found. Please log in again.', [
                { text: 'OK', onPress: () => navigation.navigate('Login') }
            ]);
            return;
        }
    }

    // Use current user or session user
    const userId = user?.id || (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId) {
         Alert.alert('Error', 'Critical: No user ID found.');
         return;
    }

    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
        // Determine avatar based on gender
        let avatarUrl = '/NoobMan.png';
        if (gender === 'Female') avatarUrl = '/NoobWoman.png';
        else if (gender === 'Non-binary') avatarUrl = '/Noobnonbinary.png';

        // Update profile in Supabase
        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                hunter_name: name || user?.name || 'Hunter', 
                email: user?.email, // Might be undefined if user is null, but upsert merges
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
        console.error('Class selection error:', error);
        Alert.alert('Error', 'Failed to finalize class selection: ' + error.message);
    } finally {
        setLoading(false);
    }
  };

  if (isCheckingAuth) {
      return (
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color="#06b6d4" />
              <Text style={{ color: '#06b6d4', marginTop: 20, fontWeight: 'bold' }}>SYNCHRONIZING SYSTEM...</Text>
          </View>
      );
  }

  // If still no user after waiting, show login prompt
  if (!user) {
      return (
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>
                  CONNECTION LOST
              </Text>
              <Text style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 30 }}>
                  Hunter signal not found. Please re-establish connection.
              </Text>
              <TouchableOpacity 
                  style={styles.confirmButton} 
                  onPress={() => navigation.navigate('Login')}
              >
                  <Text style={styles.confirmButtonText}>LOGIN SYSTEM</Text>
              </TouchableOpacity>
          </View>
      );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#020617']}
        style={styles.background}
      />
      
      <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
        <View style={styles.header}>
            <Text style={styles.headerTitle}>CLASS AWAKENING</Text>
            <Text style={styles.headerSubtitle}>CHOOSE YOUR PATH</Text>
        </View>

        <ScrollView 
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
        >
            {CLASSES.map((cls) => {
                const isSelected = selectedClass === cls.id;
                return (
                    <TouchableOpacity
                        key={cls.id}
                        style={[
                            styles.classCard,
                            isSelected && styles.classCardSelected,
                            { borderColor: isSelected ? '#06b6d4' : 'rgba(255,255,255,0.1)' }
                        ]}
                        onPress={() => handleClassSelect(cls.id)}
                        activeOpacity={0.9}
                    >
                        <Image source={cls.image} style={styles.classImage} />
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.8)', '#000']}
                            style={styles.gradientOverlay}
                        />
                        
                        {/* Selected Indicator/Border Effect */}
                        {isSelected && <View style={styles.selectedBorder} />}

                        <View style={styles.cardContent}>
                            <View style={styles.iconContainer}>
                                <Text style={styles.icon}>{cls.icon}</Text>
                            </View>
                            <Text style={[styles.className, isSelected && { color: '#06b6d4' }]}>{cls.name.toUpperCase()}</Text>
                            
                            {isSelected && (
                                <View style={styles.selectedContent}>
                                    <Text style={styles.description}>{cls.desc}</Text>
                                    <View style={styles.statsContainer}>
                                        <Text style={styles.statText}>STR: {cls.stats.strength}</Text>
                                        <Text style={styles.statText}>AGI: {cls.stats.agility}</Text>
                                        <Text style={styles.statText}>VIT: {cls.stats.vitality}</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity
                style={[styles.confirmButton, !selectedClass && styles.confirmButtonDisabled]}
                disabled={!selectedClass || loading}
                onPress={handleConfirm}
            >
                {loading ? (
                    <ActivityIndicator color="#000" />
                ) : (
                    <Text style={styles.confirmButtonText}>
                        {selectedClass ? 'CONFIRM SELECTION' : 'SELECT A CLASS'}
                    </Text>
                )}
            </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#06b6d4',
    letterSpacing: 2,
    textShadowColor: 'rgba(6, 182, 212, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
    letterSpacing: 4,
    marginTop: 5,
  },
  gridContainer: {
    padding: 16,
    paddingBottom: 100,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  classCard: {
    width: (width - 48) / 2,
    height: 200, // Taller cards
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    position: 'relative',
  },
  classCardSelected: {
    height: 220, // Grow slightly when selected? Or just visual pop
    transform: [{ scale: 1.02 }],
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 10,
  },
  classImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.8,
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  selectedBorder: {
    position: 'absolute',
    inset: 0,
    borderWidth: 2,
    borderColor: '#06b6d4',
    borderRadius: 8,
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 4,
  },
  icon: {
    fontSize: 16,
  },
  className: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 4,
  },
  selectedContent: {
    alignItems: 'center',
    width: '100%',
  },
  description: {
    fontSize: 8,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 4,
  },
  statText: {
    fontSize: 8,
    color: '#06b6d4',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: 'rgba(2, 6, 23, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  confirmButton: {
    backgroundColor: '#06b6d4',
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: 'center',
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  confirmButtonDisabled: {
    backgroundColor: '#334155',
    shadowOpacity: 0,
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
});

export default ClassSelectionScreen;