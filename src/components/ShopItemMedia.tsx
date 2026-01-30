import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import AnimatedEquip from './AnimatedEquip';

interface ShopItemMediaProps {
  item: any;
  style?: any; 
  animate?: boolean;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

export const ShopItemMedia = ({ 
  item, 
  style, 
  animate = false,
  resizeMode = 'contain'
}: ShopItemMediaProps) => {

  // --- CONFIG PARSING ---
  let config = item.animation_config;
  
  if (typeof config === 'string') {
    try {
      config = JSON.parse(config);
      if (typeof config === 'string') {
        config = JSON.parse(config);
      }
    } catch (e) {
      console.error('Error parsing animation_config:', item.name, e);
      config = null;
    }
  }

  const isValidConfig = config && 
    (typeof config.frameWidth === 'number' || typeof config.frameWidth === 'string') &&
    (typeof config.frameHeight === 'number' || typeof config.frameHeight === 'string');

  const isAnimated = item.is_animated && isValidConfig;
  const imageSrc = item.image_url;

  // --- ANIMATED RENDER ---
  if (isAnimated && animate) {
    const frameWidth = Number(config.frameWidth);
    const frameHeight = Number(config.frameHeight);
    const totalFrames = Number(config.totalFrames || 1);
    const fps = Number(config.fps || 10);

    return (
      <AnimatedEquip
        src={imageSrc}
        frameWidth={frameWidth}
        frameHeight={frameHeight}
        totalFrames={totalFrames}
        fps={fps}
        style={style}
      />
    );
  }

  // --- STATIC RENDER ---
  return (
    <Image
      source={imageSrc ? { uri: imageSrc } : require('../../assets/NoobMan.png')}
      style={style}
      resizeMode={resizeMode}
    />
  );
};
