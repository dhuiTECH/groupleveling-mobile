import React, { useState, useMemo } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { User } from '@/types/user';
import { X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SkillTreeTab } from '@/components/tabs/SkillTreeTab';
import { calculateDerivedStats } from '@/utils/stats';
import { supabase } from '@/lib/supabase';
import { useNotification } from '@/contexts/NotificationContext';

const BASE_ATTRS: { label: string; statKey: keyof User; desc: string; classRec: string; color: string }[] = [
  { label: 'STR', statKey: 'str_stat', desc: '+2 Physical Attack (ATK) per point', classRec: 'Fighter, Tanker', color: '#f87171' },
  { label: 'SPD', statKey: 'spd_stat', desc: '+0.5% Crit Chance per point', classRec: 'Assassin', color: '#60a5fa' },
  { label: 'END', statKey: 'end_stat', desc: '+5 Max HP per point', classRec: 'Tanker', color: '#4ade80' },
  { label: 'INT', statKey: 'int_stat', desc: '+10 Max MP & Magic Attack (MATK)', classRec: 'Mage', color: '#a78bfa' },
  { label: 'VIT', statKey: 'wil_stat', desc: '+1 HP & faster HP/MP regen', classRec: 'Healer', color: '#f472b6' },
  { label: 'LCK', statKey: 'lck_stat', desc: 'Drop rate & gold', classRec: 'All classes', color: '#fbbf24' },
  { label: 'PER', statKey: 'per_stat', desc: '+0.2% Crit Chance & +0.5% Crit Damage per point', classRec: 'Ranger', color: '#fb923c' },
];

interface StatusWindowModalProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  setUser: (user: User | null) => void;
}

export const StatusWindowModal: React.FC<StatusWindowModalProps> = ({ visible, onClose, user, setUser }) => {
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('stats');
  const [allocating, setAllocating] = useState(false);
  const derivedStats = useMemo(() => user ? calculateDerivedStats(user) : {}, [user]);
  const displayHP = useMemo(() => {
    const max = derivedStats.maxHP || 1;
    const current = user?.current_hp ?? max;
    return { current: Math.min(current, max), max };
  }, [user?.current_hp, derivedStats.maxHP]);
  const displayMP = useMemo(() => {
    const max = derivedStats.maxMP || 1;
    const current = user?.current_mp ?? max;
    return { current: Math.min(current, max), max };
  }, [user?.current_mp, derivedStats.maxMP]);

  const handleAllocStat = async (statKey: keyof User) => {
    if (!user || !setUser) return;
    const points = user.unassigned_stat_points ?? 0;
    if (points <= 0) return;
    const currentVal = (user[statKey] as number) ?? 10;
    const newVal = currentVal + 1;
    const newPoints = points - 1;
    const updatedUser: User = {
      ...user,
      [statKey]: newVal,
      unassigned_stat_points: newPoints,
    };
    const derived = calculateDerivedStats(updatedUser);
    updatedUser.max_hp = derived.maxHP;
    updatedUser.max_mp = derived.maxMP;
    updatedUser.current_hp = derived.maxHP;
    updatedUser.current_mp = derived.maxMP;
    setUser(updatedUser);
    setAllocating(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        [statKey]: newVal,
        unassigned_stat_points: newPoints,
        max_hp: derived.maxHP,
        max_mp: derived.maxMP,
        current_hp: derived.maxHP,
        current_mp: derived.maxMP,
      })
      .eq('id', user.id);
    setAllocating(false);
    if (error) {
      setUser(user);
      showNotification('Failed to save stat.', 'error');
      return;
    }
    const label = BASE_ATTRS.find(a => a.statKey === statKey)?.label ?? statKey;
    showNotification(`${label} +1 (now ${newVal})`, 'success');
  };

  if (!user) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <BlurView intensity={30} style={styles.backdrop}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{user.current_title || 'Novice Hunter'}</Text>
            <Text style={styles.level}>Level {user.level} {user.current_class}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={16} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'stats' && styles.activeTab]}
              onPress={() => setActiveTab('stats')}
            >
              <Text style={styles.tabText}>Stats</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'skills' && styles.activeTab]}
              onPress={() => setActiveTab('skills')}
            >
              <Text style={styles.tabText}>Skills</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabContent}>
          {activeTab === 'stats' ? (
            <ScrollView contentContainerStyle={styles.statsContent}>
              {/* Derived Stats */}
              <View style={styles.derivedStatsContainer}>
                <Text style={styles.sectionTitle}>Derived Stats</Text>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>HP</Text>
                  <View style={styles.progressBarContainer}>
                    <LinearGradient
                      colors={['#ef4444', '#b91c1c']}
                      style={[styles.progressBar, { width: `${(displayHP.current / displayHP.max) * 100}%` }]}
                    />
                    <Text style={styles.progressText}>{displayHP.current} / {displayHP.max}</Text>
                  </View>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>MP</Text>
                  <View style={styles.progressBarContainer}>
                    <LinearGradient
                      colors={['#3b82f6', '#1d4ed8']}
                      style={[styles.progressBar, { width: `${(displayMP.current / displayMP.max) * 100}%` }]}
                    />
                    <Text style={styles.progressText}>{displayMP.current} / {displayMP.max}</Text>
                  </View>
                </View>
              </View>

              {/* Base Attributes */}
              <View style={styles.baseAttributesContainer}>
                 <Text style={styles.sectionTitle}>Hunter Attributes</Text>
                 <View style={styles.attributesList}>
                    {BASE_ATTRS.map((attr) => {
                      const value = (user[attr.statKey] as number) ?? 10;
                      const canAdd = (user.unassigned_stat_points ?? 0) > 0 && !allocating;
                      return (
                        <View key={attr.label} style={styles.attributeRow}>
                          <View style={styles.attributeInfo}>
                            <Text style={styles.attributeLabel}>{attr.label}</Text>
                            <Text style={styles.attributeDesc}>{attr.desc}</Text>
                            <Text style={styles.attributeClassRec}>Best for: {attr.classRec}</Text>
                          </View>
                          <View style={styles.attributeValueRow}>
                            <Text style={[styles.attributeValue, { color: attr.color }]}>{value}</Text>
                            {canAdd && (
                              <TouchableOpacity
                                style={styles.allocButton}
                                onPress={() => handleAllocStat(attr.statKey)}
                                disabled={allocating}
                              >
                                <Text style={styles.allocButtonText}>+</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      );
                    })}
                 </View>
                 {(user.unassigned_stat_points ?? 0) > 0 && (
                   <View style={styles.unassignedBanner}>
                     <Text style={styles.unassignedText}>
                       {user.unassigned_stat_points} Unassigned Point{(user.unassigned_stat_points ?? 0) !== 1 ? 's' : ''}
                     </Text>
                     <Text style={styles.unassignedHint}>Tap + to allocate</Text>
                   </View>
                 )}
                 
                 {/* EXP Bar */}
                 <View style={[styles.statRow, { marginTop: 20 }]}>
                    <Text style={styles.statLabel}>EXP</Text>
                    <View style={styles.progressBarContainer}>
                      <LinearGradient
                        colors={['#fbbf24', '#d97706']}
                        style={[styles.progressBar, { width: `${Math.min((user.exp % 1000) / 10, 100)}%` }]}
                      />
                      <Text style={styles.progressText}>{user.exp % 1000} / 1000</Text>
                    </View>
                 </View>
              </View>
            </ScrollView>
          ) : (
            <SkillTreeTab />
          )}
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    modalContent: {
        width: '95%',
        maxWidth: 500,
        height: Math.min(Dimensions.get('window').height * 0.88, 700),
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
    },
    title: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    level: {
        color: '#94a3b8',
        fontSize: 14,
    },
    closeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        padding: 8,
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    tabContent: {
        flex: 1,
        minHeight: 400,
    },
    tabButton: {
        padding: 12,
        alignItems: 'center',
        flex: 1,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#38bdf8',
    },
    tabText: {
        color: 'white',
        fontWeight: 'bold',
    },
    statsContent: {
        padding: 16,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    derivedStatsContainer: {
        marginBottom: 20,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statLabel: {
        color: '#cbd5e1',
        width: 60,
    },
    progressBarContainer: {
        flex: 1,
        height: 20,
        backgroundColor: '#1e293b',
        borderRadius: 10,
        overflow: 'hidden',
        justifyContent: 'center',
    },
    progressBar: {
        height: '100%',
    },
    progressText: {
        position: 'absolute',
        width: '100%',
        textAlign: 'center',
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    baseAttributesContainer: {
        marginTop: 10,
    },
    attributesList: {
        gap: 10,
    },
    attributeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    attributeInfo: {
        flex: 1,
        marginRight: 12,
    },
    attributeLabel: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '900',
        marginBottom: 2,
    },
    attributeDesc: {
        color: '#64748b',
        fontSize: 10,
    },
    attributeClassRec: {
        color: '#94a3b8',
        fontSize: 10,
        fontStyle: 'italic',
        marginTop: 2,
    },
    attributeValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    attributeValue: {
        fontSize: 18,
        fontWeight: '900',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        minWidth: 28,
        textAlign: 'right',
    },
    allocButton: {
        width: 32,
        height: 32,
        borderRadius: 6,
        backgroundColor: '#22c55e',
        alignItems: 'center',
        justifyContent: 'center',
    },
    allocButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
    },
    unassignedBanner: {
        marginTop: 14,
        padding: 12,
        backgroundColor: 'rgba(234, 179, 8, 0.15)',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(234, 179, 8, 0.4)',
        alignItems: 'center',
    },
    unassignedText: {
        color: '#fbbf24',
        fontSize: 14,
        fontWeight: '900',
    },
    unassignedHint: {
        color: 'rgba(251, 191, 36, 0.8)',
        fontSize: 11,
        marginTop: 4,
    },
});
