import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Image, Alert, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { RootStackScreenProps } from '../types/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

// Import assets (if needed)
// import logo from '../../assets/icon.png';

interface Class {
  id: string;
  name: string;
  description: string;
  stats: {
    strength: number;
    dexterity: number;
    intelligence: number;
  };
  image: string; // URL or local asset path
}

const MOCK_CLASSES: Class[] = [
  {
    id: '1',
    name: 'Warrior',
    description: 'A strong and resilient fighter, skilled in melee combat.',
    stats: { strength: 10, dexterity: 5, intelligence: 2 },
    image: 'https://via.placeholder.com/150', // Replace with actual image URL or require('../../assets/icon.png')
  },
  {
    id: '2',
    name: 'Mage',
    description: 'A master of arcane arts, wielding powerful spells.',
    stats: { strength: 2, dexterity: 5, intelligence: 10 },
    image: 'https://via.placeholder.com/150', // Replace with actual image URL
  },
  {
    id: '3',
    name: 'Rogue',
    description: 'A stealthy and agile assassin, skilled in deception.',
    stats: { strength: 5, dexterity: 10, intelligence: 5 },
    image: 'https://via.placeholder.com/150', // Replace with actual image URL
  },
];

interface ClassSelectionScreenProps {}

export const ClassSelectionScreen: React.FC<ClassSelectionScreenProps> = () => {
  const navigation = useNavigation<RootStackScreenProps<'ClassSelection'>['navigation']>();
  const insets = useSafeAreaInsets();

  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setClasses(MOCK_CLASSES);
    } catch (error) {
      console.error('Error fetching classes:', error);
      Alert.alert('Error', 'Failed to load classes. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchClasses();
  }, []);

  const handleClassSelection = (classId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Confirm Class Selection',
      `Are you sure you want to select ${classes.find(c => c.id === classId)?.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: () => {
            // Navigate to next screen or perform action
            navigation.navigate('Home', { classId }); // Example navigation
          },
        },
      ],
      { cancelable: false }
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading Classes...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.header}>Select Your Class</Text>
        {classes.map((classItem) => (
          <TouchableOpacity
            key={classItem.id}
            style={styles.classCard}
            onPress={() => handleClassSelection(classItem.id)}
          >
            <Image source={{ uri: classItem.image }} style={styles.classImage} />
            <View style={styles.classInfo}>
              <Text style={styles.className}>{classItem.name}</Text>
              <Text style={styles.classDescription}>{classItem.description}</Text>
              <View style={styles.classStats}>
                <Text>Strength: {classItem.stats.strength}</Text>
                <Text>Dexterity: {classItem.stats.dexterity}</Text>
                <Text>Intelligence: {classItem.stats.intelligence}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // for Android
  },
  classImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  classDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  classStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default ClassSelectionScreen;