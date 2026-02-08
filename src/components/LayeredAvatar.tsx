import React, { useState, useEffect, useRef } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, ViewStyle, Animated, Easing } from 'react-native';
import { User } from '@/types/user';
import { ShopItemMedia } from './ShopItemMedia';

const FALLBACK_STATIC_SIZE = 512;

/** Static overlay layer that sizes by image intrinsic dimensions (matches Next.js: natural size × scale × scaleRatio). */
const StaticOverlayLayer: React.FC<{
  cosmetic: any;
  item: any;
  leftPercent: number;
  topPercent: number;
  zIndex: number;
  dbScale: number;
  scaleRatio: number;
}> = ({ cosmetic, item, leftPercent, topPercent, zIndex, dbScale, scaleRatio }) => {
  const [intrinsicSize, setIntrinsicSize] = useState<number | null>(null);
  const uri = item?.image_url;

  useEffect(() => {
    if (!uri || typeof uri !== 'string') return;
    Image.getSize(
      uri,
      (width, height) => setIntrinsicSize(Math.max(width, height)),
      () => setIntrinsicSize(FALLBACK_STATIC_SIZE)
    );
  }, [uri]);

  const baseSize = intrinsicSize ?? FALLBACK_STATIC_SIZE;
  const finalSize = baseSize * dbScale * scaleRatio;

  return (
    <View
      style={{
        position: 'absolute',
        zIndex: zIndex,
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
        width: finalSize,
        height: finalSize,
        transform: [
          { translateX: -finalSize / 2 },
          { translateY: -finalSize / 2 },
        ],
      }}
      pointerEvents="none"
    >
      <ShopItemMedia
        item={item}
        animate={false}
        forceFullImage={true}
        style={{ width: finalSize, height: finalSize }}
        resizeMode="contain"
      />
    </View>
  );
};

interface LayeredAvatarProps {
  user: User;
  size?: number;
  onAvatarClick?: (user: User) => void;
  style?: ViewStyle;
  hideBackground?: boolean;
  square?: boolean;
}

export const LayeredAvatar: React.FC<LayeredAvatarProps> = ({ 
  user, 
  size = 64, 
  onAvatarClick,
  style,
  hideBackground = false,
  square = false
}) => {
  // Create the breathing value
  const breatheAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [breatheAnim]);

  // Interpolate for scale and translation
  const translateY = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1.25], // Increased lift
  });
  const scaleY = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.0125], // Increased stretch to 1.5%
  });

  const equippedCosmetics = user?.cosmetics?.filter((c: any) => c.equipped) || [];

  // Helper to normalize slot names
  const getSlot = (item: any) => item?.slot?.trim().toLowerCase();
  
  // Define what counts as a "body replacement" slot
  const isAvatarSlot = (slot: string | undefined) => {
    return slot === 'avatar' || slot === 'fullbody' || slot === 'skin' || slot === 'character' || slot === 'base_body';
  };

  // 1. Find the equipped skin
  const equippedShopSkinItem = equippedCosmetics.find((c: any) => isAvatarSlot(getSlot(c.shop_items)));
  const equippedShopSkin = equippedShopSkinItem?.shop_items?.image_url;

  // 2. Priority: Equipped Skin > Base Body > User Avatar > Default
  // When base_body_silhouette_url + base_body_tint_hex are set, use silhouette as tinted base layer
  const useTintedSilhouette = !!(user?.base_body_silhouette_url && user?.base_body_tint_hex);
  const baseBodyLayer = equippedShopSkin || user?.base_body_url || user?.avatar_url || user?.profilePicture;
  const silhouetteUrl = user?.base_body_silhouette_url;
  const baseTintHex = user?.base_body_tint_hex;

  const baseSource = useTintedSilhouette && typeof silhouetteUrl === 'string' && silhouetteUrl.startsWith('http')
    ? { uri: silhouetteUrl }
    : typeof baseBodyLayer === 'string' && baseBodyLayer.startsWith('http')
      ? { uri: baseBodyLayer }
      : (baseBodyLayer || require('../../assets/NoobMan.png'));

  // 3. Filter overlays (exclude the equipped skin)
  const overlayLayers = equippedCosmetics
    .filter((c: any) => c.shop_items?.image_url && !isAvatarSlot(getSlot(c.shop_items)))
    .sort((a: any, b: any) => Number(a.shop_items.z_index || 1) - Number(b.shop_items.z_index || 1));

  const ADMIN_CONTAINER_SIZE = 512;
  const ADMIN_ANCHOR_POINT = 128;
  const scaleRatio = size / ADMIN_CONTAINER_SIZE;

  const Container = onAvatarClick ? TouchableOpacity : View;

  return (
    <Container 
      style={[styles.container, { width: size, height: size, borderRadius: square ? 16 : size / 2 }, style]}
      onPress={() => onAvatarClick?.(user)}
      activeOpacity={0.9}
    >
      {/* STATIC BACKGROUND (Outside breathing) */}
      {!hideBackground && equippedCosmetics.filter((c: any) => getSlot(c.shop_items) === 'background').map((cosmetic: any) => (
        <View key={cosmetic.id} style={StyleSheet.absoluteFill}>
          <ShopItemMedia 
            item={cosmetic.shop_items} 
            style={styles.fullSize} 
            animate={true} 
            resizeMode="cover"
          />
        </View>
      ))}

      {/* BREATHING CONTAINER (Everything else inside here) */}
      <Animated.View 
        style={[
          StyleSheet.absoluteFill, 
          { 
            transform: [{ translateY }, { scaleY }],
            // @ts-ignore - transformOrigin is available in newer RN versions or Expo
            transformOrigin: 'bottom' 
          }
        ]}
      >
        {/* Base Body Layer (lowest z-index: silhouette / tint) */}
        <View style={[StyleSheet.absoluteFill, { zIndex: 0 }]}>
          <Image
            source={baseSource}
            style={[
              styles.fullSize,
              useTintedSilhouette && baseTintHex ? { tintColor: baseTintHex } : undefined
            ]}
            resizeMode="cover"
            defaultSource={require('../../assets/NoobMan.png')}
          />
        </View>

        {/* Base body image_url in front of silhouette only (zIndex 1), behind all overlays so outline doesn't show over body slot */}
        {useTintedSilhouette && equippedShopSkinItem?.shop_items?.image_url && (
          <View style={[StyleSheet.absoluteFill, { zIndex: 1 }]}>
            <Image
              source={{ uri: equippedShopSkinItem.shop_items.image_url }}
              style={styles.fullSize}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Overlay Layers (eyes, mouth, hair, face, body) — all above base body outline */}
        {overlayLayers.map((cosmetic: any) => {
            const item = cosmetic.shop_items;
            const dbScale = parseFloat(item.scale || "1");

            const leftPercent = ((ADMIN_ANCHOR_POINT + (item.offset_x || 0)) / ADMIN_CONTAINER_SIZE) * 100;
            const topPercent = ((ADMIN_ANCHOR_POINT + (item.offset_y || 0)) / ADMIN_CONTAINER_SIZE) * 100;

            const zIndex = Number(item.z_index || 10);
            
            // Fix for "Non-whitespace character found after end of conversion" error
            // The error typically happens when JSON.parse parses a number followed by chars, or double parsing
            let isAnimated = false;
            let frameWidth = 96;
            let frameHeight = 96;
            
            if (item.is_animated && item.animation_config) {
              try {
                let config = item.animation_config;
                
                // Handle case where it might be double stringified or just a string
                if (typeof config === 'string') {
                  // Check if it looks like a JSON object before parsing to avoid generic string errors
                  if (config.trim().startsWith('{')) {
                      config = JSON.parse(config);
                      // Handle double stringification
                      if (typeof config === 'string' && config.trim().startsWith('{')) {
                          config = JSON.parse(config);
                      }
                  } else {
                      // It's a string but not JSON? Fallback or ignore
                      config = {}; 
                  }
                }
                
                if (config && typeof config === 'object') {
                    if (config.frameWidth) frameWidth = Number(config.frameWidth);
                    if (config.frameHeight) frameHeight = Number(config.frameHeight);
                    isAnimated = true;
                }
              } catch (e) {
                console.warn('Animation config parse error:', e);
                // Use defaults if parsing fails
              }
            }

            // Match Next.js behavior:
            // - Animated items: use exact frame dimensions with dbScale * scaleRatio
            // - Static items: use scale transform like web's 1px container trick
            
            if (isAnimated) {
              // Animated items: use frame dimensions (don't touch this - works perfectly)
              const finalWidth = frameWidth * dbScale * scaleRatio;
              const finalHeight = frameHeight * dbScale * scaleRatio;
              
              return (
                <View
                  key={cosmetic.id}
                  style={{
                    position: 'absolute',
                    zIndex: zIndex,
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                    width: finalWidth,
                    height: finalHeight,
                    transform: [
                      { translateX: -finalWidth / 2 },
                      { translateY: -finalHeight / 2 }
                    ],
                  }}
                  pointerEvents="none"
                >
                  <ShopItemMedia 
                    item={item} 
                    animate={true} 
                    forceFullImage={true}
                    style={styles.fullSize}
                    resizeMode="contain"
                  />
                </View>
              );
            } else {
              // Static items: match Next.js — visual size = natural image size × dbScale × scaleRatio
              return (
                <StaticOverlayLayer
                  key={cosmetic.id}
                  cosmetic={cosmetic}
                  item={item}
                  leftPercent={leftPercent}
                  topPercent={topPercent}
                  zIndex={zIndex}
                  dbScale={dbScale}
                  scaleRatio={scaleRatio}
                />
              );
            }
        })}
      </Animated.View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#1e293b', // Fallback color
    position: 'relative',
  },
  fullSize: {
    width: '100%',
    height: '100%',
  }
});

export default LayeredAvatar;
