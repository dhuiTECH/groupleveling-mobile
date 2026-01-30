import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { User } from '../types/user';
import { LayeredAvatar } from './LayeredAvatar';
import { theme } from '../constants/theme';

interface PlayerCallingCardProps {
  user: User;
  onPress?: () => void;
}

export const PlayerCallingCard: React.FC<PlayerCallingCardProps> = ({ user, onPress }) => {
  // Determine avatar source - fallback to local asset if profilePicture is null/undefined
  // Note: Adjust the fallback path as needed based on where this component is used
  const avatarSource = user.profilePicture 
    ? (typeof user.profilePicture === 'string' ? { uri: user.profilePicture } : user.profilePicture)
    : require('../../assets/NoobMan.png');

  return (
    <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.8}>
      <View style={styles.avatarContainer}>
        <LayeredAvatar 
          user={user} 
          size={50}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{user.name}</Text>
        <Text style={styles.title}>Hunter</Text> 
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)', // Slate with opacity
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 140,
  },
  avatarContainer: {
    marginRight: 10,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: theme.colors.dark,
    borderWidth: 1,
    borderColor: theme.colors.cyan,
  },
  info: {
    flex: 1,
  },
  name: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    color: theme.colors.cyan,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
