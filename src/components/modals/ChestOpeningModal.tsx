import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableWithoutFeedback } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Audio } from 'expo-av';

const chestImages = {
  small: require('../../../assets/icons/smallchestmodal.png'),
  silver: require('../../../assets/icons/silverchestmodal.png'),
  medium: require('../../../assets/icons/mediumchestmodal.png'),
  large: require('../../../assets/icons/largechestmodal.png'),
};

interface ChestOpeningModalProps {
  isOpen: boolean;
  chestType: 'small' | 'silver' | 'medium' | 'large';
  onAnimationComplete: () => void;
}

export const ChestOpeningModal: React.FC<ChestOpeningModalProps> = ({
  isOpen,
  chestType,
  onAnimationComplete,
}) => {
  const [phase, setPhase] = useState<'idle' | 'shaking' | 'exploding'>('idle');
  const [sound, setSound] = useState<Audio.Sound>();
  
  const rotation = useSharedValue(0);
  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const brightness = useSharedValue(1);
  const flashOpacity = useSharedValue(0);

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  useEffect(() => {
    if (isOpen) {
      setPhase('shaking');
    } else {
      setPhase('idle');
      // Reset animations
      cancelAnimation(rotation);
      cancelAnimation(translationX);
      cancelAnimation(translationY);
      scale.value = 1;
      opacity.value = 1;
      brightness.value = 1;
      flashOpacity.value = 0;
    }
  }, [isOpen]);

  useEffect(() => {
    if (phase === 'shaking') {
      rotation.value = withRepeat(
        withSequence(
          withTiming(-2, { duration: 50 }),
          withTiming(2, { duration: 50 }),
        ), -1, true);
      translationX.value = withRepeat(
        withSequence(
          withTiming(-2, { duration: 50 }),
          withTiming(2, { duration: 50 }),
        ), -1, true);
      translationY.value = withRepeat(
        withSequence(
          withTiming(2, { duration: 50 }),
          withTiming(-2, { duration: 50 }),
        ), -1, true);
    } else {
      cancelAnimation(rotation);
      cancelAnimation(translationX);
      cancelAnimation(translationY);
      rotation.value = 0;
      translationX.value = 0;
      translationY.value = 0;
    }
  }, [phase]);

  const handleChestClick = async () => {
    if (phase !== 'shaking') return;
    
    setPhase('exploding');
    
    try {
      const { sound } = await Audio.Sound.createAsync(
         require('../../../assets/sounds/chestopening.mp3')
      );
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.error("Could not play sound", error);
    }

    scale.value = withTiming(1.5, { duration: 300 });
    opacity.value = withTiming(0, { duration: 200 });
    brightness.value = withTiming(2, { duration: 200 });
    flashOpacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(0, { duration: 350 })
    );

    setTimeout(() => {
      onAnimationComplete();
    }, 500);
  };
  
  const animatedChestStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translationX.value },
      { translateY: translationY.value },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value }
    ],
    opacity: opacity.value,
  }));
  
  const animatedFlashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  if (!isOpen) return null;

  return (
    <TouchableWithoutFeedback onPress={handleChestClick}>
      <View style={styles.container}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        
        <Animated.Text style={[styles.instructionText, animatedFlashStyle]}>
          TAP TO OPEN
        </Animated.Text>

        <View style={styles.burstContainer}>
          <Animated.View style={[styles.burst, styles.burstBlue]} />
          <Animated.View style={[styles.burst, styles.burstPurple]} />
        </View>

        <Animated.View style={[styles.chestWrapper, animatedChestStyle]}>
          <Image 
            source={chestImages[chestType]}
            style={styles.chestImage}
          />
        </Animated.View>

        <Animated.View style={[styles.flash, animatedFlashStyle]} />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  instructionText: {
    position: 'absolute',
    top: '30%',
    color: '#22d3ee',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 4,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  burstContainer: {
    position: 'absolute',
  },
  burst: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 250,
  },
  burstBlue: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  burstPurple: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
  },
  chestWrapper: {
    width: 256,
    height: 256,
  },
  chestImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
    pointerEvents: 'none',
  },
});
