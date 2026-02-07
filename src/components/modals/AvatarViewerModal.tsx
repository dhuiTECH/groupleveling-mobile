import React from 'react';
import { Modal, View, TouchableOpacity, Text, Dimensions, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { PlayerCallingCard } from '@/components/PlayerCallingCard';
import { LayeredAvatar } from '@/components/LayeredAvatar';
import { User } from '@/types/user';

interface AvatarViewerModalProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  currentUser?: User | null;
}

export const AvatarViewerModal: React.FC<AvatarViewerModalProps> = ({ 
  visible, 
  onClose, 
  user,
  currentUser 
}) => {
  if (!user) return null;

  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;
  const avatarSize = windowWidth < 640 ? Math.min(windowWidth - 16, 450) : 512;

  // Check if this is the user's own avatar
  const isOwnCard = currentUser?.id === user.id;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <BlurView intensity={50} tint="dark" style={styles.backdrop}>
        <View style={[styles.modalContent, { width: avatarSize, height: avatarSize }]}>
          
          {/* Header with Calling Card and Close Button */}
          <View style={styles.header} pointerEvents="box-none">
            <View pointerEvents="auto">
              <PlayerCallingCard 
                user={user} 
                size="md"
                isOwnCard={isOwnCard}
              />
            </View>
            
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.closeButton}
              activeOpacity={0.8}
            >
              <Text style={styles.closeButtonText}>CLOSE</Text>
            </TouchableOpacity>
          </View>

          {/* Full Avatar Display */}
          <View style={styles.avatarContainer}>
            <LayeredAvatar 
              user={user} 
              size={avatarSize}
              square={true}
            />
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
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  modalContent: {
    position: 'relative',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#020617',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
    zIndex: 50,
  },
  closeButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  closeButtonText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  avatarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AvatarViewerModal;
