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
  const scale = useSharedValue(isActive ? 1.5 : 1);
  const translateY = useSharedValue(isActive ? -12 : 0);
  const opacity = useSharedValue(isActive ? 1 : 0.4);
  const labelScale = useSharedValue(isActive ? 1.05 : 1);
  const labelOpacity = useSharedValue(isActive ? 1 : 0);
  
  // Update animations when active state changes
  useEffect(() => {
    scale.value = withSpring(isActive ? 1.5 : 1, { damping: 12, stiffness: 100 });
    translateY.value = withSpring(isActive ? -12 : 0, { damping: 12, stiffness: 100 });
    opacity.value = withTiming(isActive ? 1 : 0.4, { duration: 300 });
    labelScale.value = withTiming(isActive ? 1.05 : 1, { duration: 300 });
    labelOpacity.value = withTiming(isActive ? 1 : 0, { duration: 300 });
  }, [isActive]);

  // Animated styles
  const iconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value }
      ],
      opacity: opacity.value,
      shadowColor: isActive ? '#3b82f6' : 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: isActive ? 0.7 : 0,
      shadowRadius: isActive ? 8 : 0,
      elevation: isActive ? 10 : 0,
      zIndex: isActive ? 10 : 0,
    };
  });

  const labelStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: labelScale.value }],
      opacity: labelOpacity.value,
    };
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.navItem}
      activeOpacity={0.8}
    >
      <Animated.View style={[styles.iconContainer, iconStyle]}>
        <Image 
          source={icon} 
          style={[
            styles.icon, 
            !isActive && { tintColor: '#94a3b8' } // Grayscale effect
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
  // Route names in AppNavigator: Temple, Hunter, System, Shop, Social
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
    <View style={styles.container}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        <LinearGradient
            colors={['rgba(15, 23, 42, 0.6)', 'rgba(2, 6, 23, 0.9)']}
            style={StyleSheet.absoluteFill}
        />
        
        {/* Border Top Line */}
        <View style={styles.borderTop} />

        <View style={styles.navContent}>
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
                  // The `merge: true` option makes sure that the params inside the tab screen are preserved
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
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 85, // Equivalent to h-20 plus padding
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    elevation: 20,
    zIndex: 100,
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
    alignItems: 'center',
    height: '100%',
    paddingBottom: 10, // Safe area padding
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 28,
    height: 28,
  },
  label: {
    position: 'absolute',
    bottom: 12,
    fontSize: 10,
    fontWeight: '900',
    color: '#60a5fa', // blue-400
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
});
