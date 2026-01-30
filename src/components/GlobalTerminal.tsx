import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { User } from '../types/user';

interface GlobalTerminalProps {
  userProfile: User;
}

export const GlobalTerminal: React.FC<GlobalTerminalProps> = ({ userProfile }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>GLOBAL TERMINAL</Text>
      <ScrollView style={styles.content}>
        <Text style={styles.systemMessage}>System initialized...</Text>
        <Text style={styles.systemMessage}>Connected to Hunter Net...</Text>
        <Text style={styles.message}>
          <Text style={styles.username}>{userProfile.name || 'Hunter'}: </Text>
          <Text style={styles.text}>Ready for duty.</Text>
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)', // cyan-400/20
  },
  header: {
    fontSize: 10,
    color: '#22d3ee', // cyan-400
    fontWeight: '900',
    marginBottom: 4,
    letterSpacing: 1,
  },
  content: {
    flex: 1,
  },
  systemMessage: {
    fontSize: 10,
    color: '#64748b', // slate-500
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  message: {
    fontSize: 10,
    color: '#fff',
    marginBottom: 2,
  },
  username: {
    color: '#fbbf24', // amber-400
    fontWeight: 'bold',
  },
  text: {
    color: '#e2e8f0', // slate-200
  },
});
