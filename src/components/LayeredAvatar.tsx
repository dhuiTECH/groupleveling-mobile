import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { User } from '../types/user';
import { ShopItemMedia } from './ShopItemMedia';

interface LayeredAvatarProps {
  user: User;
  size?: number;
  onAvatarClick?: (user: User) => void;
  style?: ViewStyle;
  hideBackground?: boolean;
}

export const LayeredAvatar: React.FC<LayeredAvatarProps> = ({ 
  user, 
  size = 64, 
  onAvatarClick,
  style,
  hideBackground = false
}) => {
  const equippedCosmetics = user?.cosmetics?.filter((c: any) => c.equipped) || [];

  // Helper to normalize slot names
  const getSlot = (item: any) => item?.slot?.trim().toLowerCase();
  
  // Define what counts as a "body replacement" slot
  const isAvatarSlot = (slot: string | undefined) => {
    return slot === 'avatar' || slot === 'fullbody' || slot === 'skin' || slot === 'character';
  };

  // 1. Find the equipped skin
  const equippedShopSkinItem = equippedCosmetics.find((c: any) => isAvatarSlot(getSlot(c.shop_items)));
  const equippedShopSkin = equippedShopSkinItem?.shop_items?.image_url;

  // 2. Priority: Equipped Skin > Base Body > User Avatar > Default
  // Note: user.avatar_url is assumed to be mapped to profilePicture in some contexts, but we use what's on User type
  const baseBodyLayer = equippedShopSkin || user?.base_body_url || user?.avatar_url || user?.profilePicture;
  
  // Fallback for base body if it's a local require (handle specific case if needed) or just string URL
  const baseSource = typeof baseBodyLayer === 'string' && baseBodyLayer.startsWith('http') 
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
      style={[styles.container, { width: size, height: size, borderRadius: size / 2 }, style]}
      onPress={() => onAvatarClick?.(user)}
      activeOpacity={0.9}
    >
      {/* Background Layer */}
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

      {/* Base Body Layer */}
      <View style={[StyleSheet.absoluteFill, { zIndex: 5 }]}>
        <Image
          source={baseSource}
          style={styles.fullSize}
          resizeMode="cover"
          defaultSource={require('../../assets/NoobMan.png')}
        />
      </View>

      {/* Overlay Layers */}
      {overlayLayers.map((cosmetic: any) => {
          const item = cosmetic.shop_items;
          const dbScale = parseFloat(item.scale || "1");

          const leftPercent = ((ADMIN_ANCHOR_POINT + (item.offset_x || 0)) / ADMIN_CONTAINER_SIZE) * 100;
          const topPercent = ((ADMIN_ANCHOR_POINT + (item.offset_y || 0)) / ADMIN_CONTAINER_SIZE) * 100;

          const zIndex = Number(item.z_index || 10);

          // Determine if item is animated and get frame dimensions
          let isAnimated = false;
          let frameWidth = 96; // Default base size for calculation
          let frameHeight = 96;
          
          if (item.is_animated && item.animation_config) {
            try {
              let config = item.animation_config;
              if (typeof config === 'string') {
                config = JSON.parse(config);
                if (typeof config === 'string') {
                  config = JSON.parse(config);
                }
              }
              if (config?.frameWidth && config?.frameHeight) {
                isAnimated = true;
                frameWidth = Number(config.frameWidth);
                frameHeight = Number(config.frameHeight);
              }
            } catch (e) {
              // Use defaults if parsing fails
            }
          }

          // Calculate dimensions and transforms
          // We use the frame dimensions for both static and animated to ensure consistency in RN
          // since we can't easily rely on "natural" size like web.
          
          const finalWidth = frameWidth * dbScale * scaleRatio;
          const finalHeight = frameHeight * dbScale * scaleRatio;

          // For transform, we center it. 
          // Left/Top percents position the top-left of the container.
          // We want that point to be the anchor, so we center relative to it?
          // The web code uses translate(-50%, -50%). 
          // In RN, we can position the View at the percent, then use transform to center.
          
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
                // Center the item on its anchor point
                transform: [
                  { translateX: -finalWidth / 2 },
                  { translateY: -finalHeight / 2 }
                ],
                // For static items that relied on 1px/scale trick, 
                // we are approximating by using frameWidth/Height (96) and scaling.
                // If items look wrong, we might need to adjust default frameWidth.
              }}
              pointerEvents="none"
            >
              <ShopItemMedia 
                item={item} 
                animate={true} 
                style={styles.fullSize}
                resizeMode="contain" // Keep aspect ratio within the frame
              />
            </View>
          );
      })}
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
