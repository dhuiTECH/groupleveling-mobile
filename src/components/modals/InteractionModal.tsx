import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { VictoryBanner } from '@/components/VictoryBanner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export const InteractionModal = ({ visible, onClose, activeInteraction }) => {
  const { user } = useAuth();
  const [showVictory, setShowVictory] = useState(false);

  const handleVictory = async (encounterMetadata) => {
    const { rewards } = encounterMetadata; // This pulls the exp, coins, and gems you set in Admin

    // Update the user's profile using increment logic to avoid overwriting data
    const { error } = await supabase.rpc('increment_profile_stats', {
      row_id: user.id,
      inc_exp: rewards.exp || 0,
      inc_coins: rewards.coins || 0,
      inc_gems: rewards.gems || 0
    });

    if (!error) {
      console.log("Stats Updated! Exp:", rewards.exp, "Coins:", rewards.coins);
      setShowVictory(true);
      // You can trigger a small animation or toast here
      setTimeout(() => {
        setShowVictory(false);
        onClose();
      }, 3000);
    }
  };

  if (!activeInteraction) return null;

  // Guard against missing metadata to prevent crashes
  if (!activeInteraction.metadata || !activeInteraction.metadata.visuals) {
    console.warn('InteractionModal: Missing metadata or visuals', activeInteraction);
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {showVictory ? (
          <VictoryBanner rewards={activeInteraction.metadata.rewards} />
        ) : (
          <>
            <Image source={{ uri: activeInteraction.metadata.visuals.bg_url }} style={styles.backgroundImage} />
            <View style={styles.playerSprite}>
              {/* Player Sprite Logic Here */}
            </View>
            <View style={styles.monsterSprite}>
              <Image source={{ uri: activeInteraction.icon_url }} style={{ width: 100, height: 100 }} />
            </View>
            <TouchableOpacity style={styles.winButton} onPress={() => handleVictory(activeInteraction.metadata)}>
              <Text style={styles.winButtonText}>WIN</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  playerSprite: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
  monsterSprite: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  winButton: {
    position: 'absolute',
    bottom: 100,
    padding: 20,
    backgroundColor: 'gold',
    borderRadius: 10,
  },
  winButtonText: {
    fontWeight: 'bold',
  },
});
