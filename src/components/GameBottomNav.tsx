import React, { useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ImageSourcePropType
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

// Props Interface
interface NavItemProps {
  id: string;
  icon: ImageSourcePropType;
  label: string;
  isActive: boolean;
  onPress: () => void;
}

// Reusable Nav Item Component
const NavItem = ({ id, icon, label, isActive, onPress }: NavItemProps) => {
  // Shared values for animations
  const scale = useSharedValue(isActive ? 1.3 : 0.9);
  const translateY = useSharedValue(isActive ? -20 : 0); // Move up significantly when active
  const opacity = useSharedValue(isActive ? 1 : 0.5);
  const labelOpacity = useSharedValue(isActive ? 1 : 0);
  
  // Update animations when active state changes
  useEffect(() => {
    scale.value = withSpring(isActive ? 1.4 : 0.9, { damping: 15, stiffness: 200 });
    translateY.value = withSpring(isActive ? -25 : 0, { damping: 15, stiffness: 200 });
    opacity.value = withTiming(isActive ? 1 : 0.4, { duration: 200 });
    labelOpacity.value = withTiming(isActive ? 1 : 0, { duration: 200 });
  }, [isActive]);

  // Animated styles
  const iconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value }
      ],
      opacity: opacity.value,
      // Strong blue glow for selected item
      shadowColor: isActive ? '#00E8FF' : 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: isActive ? 1 : 0,
      shadowRadius: isActive ? 20 : 0,
      elevation: isActive ? 15 : 0,
    };
  });

  const labelStyle = useAnimatedStyle(() => {
    return {
      opacity: labelOpacity.value,
      transform: [{ translateY: isActive ? -5 : 0 }], 
    };
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.navItem}
      activeOpacity={1}
    >
      <Animated.View style={[styles.iconContainer, iconStyle]}>
        <Image 
          source={icon} 
          style={[
            styles.icon, 
            !isActive && { tintColor: 'rgba(255, 255, 255, 0.2)' }, // Faint white instead of solid black
          ]} 
          resizeMode="contain"
        />
      </Animated.View>
      
      <Animated.Text style={[styles.label, labelStyle]}>
        {label}
      </Animated.Text>
    </TouchableOpacity>
  );
};

export default function GameBottomNav({ state, descriptors, navigation }: BottomTabBarProps) {
  // Map route names to icons and labels
  const getIcon = (routeName: string) => {
    switch (routeName) {
      case 'Temple': return require('../../assets/temple.png');
      case 'Hunter': return require('../../assets/huntericon.png');
      case 'System': return require('../../assets/system.png');
      case 'Shop': return require('../../assets/shopicon.png');
      case 'Social': return require('../../assets/leaderboard.png');
      default: return require('../../assets/system.png');
    }
  };

  return (
    <View style={styles.rootContainer} pointerEvents="box-none">
      {/* Background Container (Clipped) */}
      <View style={styles.backgroundContainer}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        <LinearGradient
            colors={['rgba(15, 23, 42, 0.8)', 'rgba(2, 6, 23, 0.95)']}
            style={StyleSheet.absoluteFill}
        />
        {/* Border Top Line */}
        <View style={styles.borderTop} />
      </View>

      {/* Nav Content (Unclipped for pop-out) */}
      <View style={styles.navContent} pointerEvents="box-none">
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name;

            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate({ name: route.name, merge: true } as any);
              }
            };

            return (
              <NavItem
                  key={route.key}
                  id={route.name}
                  icon={getIcon(route.name)}
                  label={label as string}
                  isActive={isFocused}
                  onPress={onPress}
              />
            );
          })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100, // Increased height to prevent clipping when popped up
    elevation: 0, 
    zIndex: 100,
  },
  backgroundContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80, // Solid background part
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  borderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  navContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end', 
    height: '100%',
    paddingBottom: 25, 
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 120, // Tall enough for animation
  },
  iconContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 35,
    height: 35,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: '#00E8FF', // neon cyan
    textTransform: 'uppercase',
    letterSpacing: 1,
    position: 'absolute',
    bottom: 5,
  },
});
