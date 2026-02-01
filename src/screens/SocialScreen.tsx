import React, { useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  Platform, 
  KeyboardAvoidingView, 
  RefreshControl,
  ScrollView,
  Modal,
  TouchableOpacity,
  Text
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';

import { useAuth } from '../contexts/AuthContext';
import { useSocialData } from '../hooks/useSocialData';
import SocialHub from '../components/SocialHub';
import { User } from '../types/user';
import { PlayerCallingCard } from '../components/PlayerCallingCard';

import { useNotification } from '../contexts/NotificationContext';

export const SocialScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const socialData = useSocialData();
  const [selectedAvatar, setSelectedAvatar] = useState<User | null>(null);
  const [associationName, setAssociationName] = useState('');
  const [selectedEmblem, setSelectedEmblem] = useState('');

  const onRefresh = useCallback(async () => {
    await socialData.refreshAllData();
  }, [socialData]);

  if (!user) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={['#020617', '#0f172a', '#020617']}
          style={StyleSheet.absoluteFill}
        />
        
        <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? insets.top : 0 }}>
          <View style={{ flex: 1 }}>
            <SocialHub
              user={user}
              {...socialData}
              onRefresh={onRefresh}
              associationName={associationName}
              setAssociationName={setAssociationName}
              selectedEmblem={selectedEmblem}
              setSelectedEmblem={setSelectedEmblem}
              showNotification={showNotification}
              setSelectedAvatar={setSelectedAvatar}
              emblemOptions={[
                'https://wyatvubfobfshqyfobqy.supabase.co/storage/v1/object/public/emblems/dagger.png',
                'https://wyatvubfobfshqyfobqy.supabase.co/storage/v1/object/public/emblems/shield.png',
                'https://wyatvubfobfshqyfobqy.supabase.co/storage/v1/object/public/emblems/crown.png',
                'https://wyatvubfobfshqyfobqy.supabase.co/storage/v1/object/public/emblems/sword.png',
                'https://wyatvubfobfshqyfobqy.supabase.co/storage/v1/object/public/emblems/skull.png',
              ]}
            />
          </View>
        </SafeAreaView>

        {/* Player Detail Modal */}
        <Modal
          visible={!!selectedAvatar}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedAvatar(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.closeModal} 
                onPress={() => setSelectedAvatar(null)}
              >
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
              {selectedAvatar && (
                <View style={styles.cardContainer}>
                  <PlayerCallingCard user={selectedAvatar} />
                  <View style={styles.statsOverview}>
                    <Text style={styles.modalStatText}>LEVEL: {selectedAvatar.level}</Text>
                    <Text style={styles.modalStatText}>CLASS: {selectedAvatar.current_class || 'None'}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    position: 'relative',
  },
  closeModal: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  cardContainer: {
    alignItems: 'center',
    gap: 20,
  },
  statsOverview: {
    width: '100%',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    gap: 8,
  },
  modalStatText: {
    color: '#22d3ee',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  }
});

export default SocialScreen;
