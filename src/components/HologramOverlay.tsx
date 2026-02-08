import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useTutorial } from '@/context/TutorialContext';
import { useAuth } from '@/contexts/AuthContext';
import { playHunterSound } from '@/utils/audio';
import TypewriterText from './TypewriterText';
import SpriteSheetAnimator from './SpriteSheetAnimator';

const { width, height } = Dimensions.get('window');

export default function HologramOverlay() {
  const { user } = useAuth();
  const { step, nextStep, position } = useTutorial();
  const [isTypingDone, setIsTypingDone] = useState(false);

  if (step === 'IDLE' || step === 'COMPLETED') return null;

  const getScript = () => {
    const name = user?.name || 'Hunter';
    switch (step) {
      case 'INTRO_HOME': return `Welcome, ${name}. I am your System Guide. Let's initialize your interface.`;
      case 'TRAINING_CARD': return "This is your Daily Training Log. You can track your progress and set goals here. Let me show you the interface.";
      case 'TRAINING_LOG_MODAL': return "In this log, you can record your workouts and daily diet. AI-powered analysis features cost more, but staying consistent earns you daily rewards!";
      case 'NAV_SHOP': return "The Item Shop. Purchase gear, potions, and upgrades here.";
      case 'NAV_INVENTORY': return "Your Inventory. Equip items and manage your loot here.";
      case 'NAV_STATS': return "This is your Status Window. Check your stats and manage your Skill Tree here. As you grow stronger, you'll unlock powerful abilities!";
      case 'NAV_SOCIAL': return "The Social Hub! Join Guilds, prepare for future PvP battles, and vote for the best-dressed Hunter of the month to earn rewards!";
      case 'NAV_MAP': return "The World Map! This is where your real-world steps turn into progress. Traverse the world to discover cities, meet other Hunters, and challenge monsters in the wild. Every step makes you stronger, earns you legendary loot, and helps you look like a true S-Rank Hunter!";
      default: return "";
    }
  };

  // Logic to flip text to top if highlight is at the bottom
  const isTargetLow = (position?.y || 0) > height / 2;
  const dialogPosition = isTargetLow ? { top: 60 } : { bottom: 120 };

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 10001 }]} pointerEvents="box-none">
      
      {/* 1. Dark Background Dimmer */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)' }]} pointerEvents="none" />

      {/* 2. The Spotlight Border */}
      {position && (
        <View 
          style={{
            position: 'absolute',
            top: position.y - 4,
            left: position.x - 4,
            width: position.width + 8,
            height: position.height + 8,
            borderWidth: 2,
            borderColor: '#00ffff',
            borderRadius: 8,
            shadowColor: '#00ffff', shadowOpacity: 0.8, shadowRadius: 10, elevation: 10
          }}
        />
      )}

      {/* 3. The Hologram Pet & Text */}
      <View style={[{ position: 'absolute', left: 40, right: 40, alignItems: 'center', overflow: 'visible' }, dialogPosition]}>
        
        {/* Animated Pet */}
        <View style={{ transform: [{ scale: 0.5 }], marginBottom: -130, marginTop: -130 }}>
          <SpriteSheetAnimator
            spriteSheet={require('../../assets/pet.png')}
            frameCount={9}
            frameWidth={4483 / 9}
            frameHeight={512}
            fps={9}
          />
        </View>

        <View style={styles.dialogBox}>
          <View style={styles.dialogTextWrap}>
            <TypewriterText 
              text={getScript()} 
              style={styles.dialogText}
              speed={25}
              onComplete={() => setIsTypingDone(true)}
            />
          </View>
          {isTypingDone && (
            <TouchableOpacity 
              onPress={() => { 
                playHunterSound('clickA');
                setIsTypingDone(false); 
                nextStep(); 
              }} 
              style={styles.button}
            >
              <Text style={styles.buttonText}>NEXT &gt;</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dialogBox: {
    backgroundColor: 'rgba(5, 15, 30, 0.95)',
    borderWidth: 1,
    borderColor: '#00ffff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    overflow: 'visible',
  },
  dialogTextWrap: {
    minHeight: 40,
    overflow: 'visible',
    paddingLeft: 4,
  },
  dialogText: {
    color: '#00ffff',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
    textShadowColor: 'rgba(0, 255, 255, 0.5)',
    textShadowRadius: 4,
    flexShrink: 0,
    alignSelf: 'flex-start',
    paddingLeft: 2,
  },
  button: {
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.3)',
    borderRadius: 4
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 12 }
});
