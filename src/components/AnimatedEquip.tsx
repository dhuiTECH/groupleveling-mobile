import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface AnimatedEquipProps {
  src: string;
  frameWidth: number;
  frameHeight: number;
  totalFrames: number;
  fps?: number;
  style?: any;
}

export default function AnimatedEquip({
  src,
  frameWidth,
  frameHeight,
  totalFrames,
  fps = 10,
  style
}: AnimatedEquipProps) {
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    if (totalFrames <= 1) return;

    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % totalFrames);
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [totalFrames, fps]);

  return (
    <View style={[styles.container, style, { overflow: 'hidden' }]}>
      <Image
        source={{ uri: src }}
        style={{
          height: '100%',
          width: `${totalFrames * 100}%`, // Stretch image to be N times the container width
          transform: [
             // Shift the image left based on current frame
             { translateX: -(currentFrame * (100 / totalFrames)) + '%' } 
          ]
        }}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Default size if not overridden
    width: 100, 
    height: 100,
  }
});
