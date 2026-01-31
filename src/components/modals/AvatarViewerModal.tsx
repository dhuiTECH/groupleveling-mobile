import React from 'react';
import { Modal, View, TouchableOpacity, Text, Dimensions, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { PlayerCallingCard } from '../PlayerCallingCard';
import { LayeredAvatar } from '../LayeredAvatar';
import { User } from '../../types/user';
import { X } from 'lucide-react-native';

interface AvatarViewerModalProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
}

export const AvatarViewerModal: React.FC<AvatarViewerModalProps> = ({ visible, onClose, user }) => {
  if (!user) return null;

  const windowWidth = Dimensions.get('window').width;
  const avatarSize = windowWidth < 640 ? Math.min(windowWidth - 16, 450) : 512;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <BlurView intensity={30} style={styles.backdrop}>
        <View style={[styles.modalContent, { width: avatarSize, height: avatarSize }]}>
          {/* Header */}
          <View style={styles.header} pointerEvents="box-none">
            <PlayerCallingCard user={user} style={styles.callingCard} isOwnCard={true} pointerEvents="auto" />
            <TouchableOpacity onPress={onClose} style={styles.closeButton} pointerEvents="auto">
              <X size={16} color="white" />
            </TouchableOpacity>
          </View>

          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <LayeredAvatar user={user} size={avatarSize} />
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <Text style={styles.statText}>LEVEL: {user.level}</Text>
            <Text style={styles.statText}>COMBAT POWER: {user.combat_power || 0}</Text>
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
    position: 'relative',
    flexDirection: 'column',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
  },
  header: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 10,
  },
  callingCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.5)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  avatarContainer: {
    flex: 1,
  },
  statsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 8,
  },
  statText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
