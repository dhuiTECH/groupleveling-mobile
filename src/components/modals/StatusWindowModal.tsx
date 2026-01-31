import React, { useState, useMemo } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { User } from '../../types/user';
import { X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SkillTreeTab } from '../tabs/SkillTreeTab';
import { calculateDerivedStats } from '../../utils/stats';

interface StatusWindowModalProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
}

export const StatusWindowModal: React.FC<StatusWindowModalProps> = ({ visible, onClose, user }) => {
  const [activeTab, setActiveTab] = useState('stats');
  const derivedStats = useMemo(() => user ? calculateDerivedStats(user) : {}, [user]);

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
                      style={[styles.progressBar, { width: `${((user.current_hp || 0) / (derivedStats.maxHP || 1)) * 100}%` }]}
                    />
                    <Text style={styles.progressText}>{user.current_hp} / {derivedStats.maxHP}</Text>
                  </View>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>MP</Text>
                  <View style={styles.progressBarContainer}>
                    <LinearGradient
                      colors={['#3b82f6', '#1d4ed8']}
                      style={[styles.progressBar, { width: `${((user.current_mp || 0) / (derivedStats.maxMP || 1)) * 100}%` }]}
                    />
                     <Text style={styles.progressText}>{user.current_mp} / {derivedStats.maxMP}</Text>
                  </View>
                </View>
              </View>

              {/* Base Attributes */}
              <View style={styles.baseAttributesContainer}>
                 <Text style={styles.sectionTitle}>Base Attributes</Text>
                 {/* ... implementation for base attributes */}
              </View>
            </ScrollView>
          ) : (
            <SkillTreeTab />
          )}
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
        maxHeight: '80%',
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
        // styles for this container
    }
});
