import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Image, Alert, RefreshControl, FlatList, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { RootStackScreenProps } from '../types/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import logo from '../../assets/icon.png'; // Example asset import

// Dummy Data - Replace with actual API calls
const dummyFriends = [
  { id: '1', name: 'Alice', status: 'Online' },
  { id: '2', name: 'Bob', status: 'Offline' },
  { id: '3', name: 'Charlie', status: 'Online' },
];

const dummyAssociations = [
  { id: 'a1', name: 'Gaming Guild', memberCount: 50 },
  { id: 'a2', name: 'Art Collective', memberCount: 25 },
];

const dummyLeaderboard = [
  { id: 'l1', name: 'Player 1', score: 1000 },
  { id: 'l2', name: 'Player 2', score: 950 },
  { id: 'l3', name: 'Player 3', score: 900 },
];

interface Friend {
  id: string;
  name: string;
  status: string;
}

interface Association {
  id: string;
  name: string;
  memberCount: number;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
}

interface SocialScreenProps {}

export const SocialScreen: React.FC<SocialScreenProps> = () => {
  const navigation = useNavigation<RootStackScreenProps<'Social'>['navigation']>();
  const insets = useSafeAreaInsets();

  const [friends, setFriends] = useState<Friend[]>(dummyFriends);
  const [associations, setAssociations] = useState<Association[]>(dummyAssociations);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(dummyLeaderboard);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate data fetching
    setTimeout(() => {
      setRefreshing(false);
      // In a real app, fetch data here
    }, 1000);
  }, []);

  const handleFriendPress = (friend: Friend) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Chat', { userId: friend.id, userName: friend.name });
  };

  const handleAssociationPress = (association: Association) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Association Details', `You selected ${association.name}`);
  };

  const renderFriendItem = ({ item }: { item: Friend }) => (
    <TouchableOpacity style={styles.listItem} onPress={() => handleFriendPress(item)}>
      <Text>{item.name}</Text>
      <Text style={styles.statusText}>{item.status}</Text>
    </TouchableOpacity>
  );

  const renderAssociationItem = ({ item }: { item: Association }) => (
    <TouchableOpacity style={styles.listItem} onPress={() => handleAssociationPress(item)}>
      <Text>{item.name}</Text>
      <Text>Members: {item.memberCount}</Text>
    </TouchableOpacity>
  );

  const renderLeaderboardItem = ({ item }: { item: LeaderboardEntry }) => (
    <View style={styles.listItem}>
      <Text>{item.name}</Text>
      <Text>Score: {item.score}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0} // Adjust as needed
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Image source={logo} style={styles.logo} />

          <Text style={styles.header}>Social Hub</Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Search for friends or associations"
            value={searchText}
            onChangeText={setSearchText}
          />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Friends</Text>
            <FlatList
              data={friends}
              renderItem={renderFriendItem}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={<Text>No friends found.</Text>}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Associations</Text>
            <FlatList
              data={associations}
              renderItem={renderAssociationItem}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={<Text>No associations found.</Text>}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Leaderboard</Text>
            <FlatList
              data={leaderboard}
              renderItem={renderLeaderboardItem}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={<Text>Leaderboard is empty.</Text>}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginTop: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  searchInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 20,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  section: {
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  listItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  statusText: {
    color: 'green', // Or red for offline
  },
});

export default SocialScreen;