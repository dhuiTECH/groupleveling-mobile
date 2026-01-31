import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const SkillTreeTab = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Skill Tree - Coming Soon!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: 'white',
    fontSize: 18,
  },
});
