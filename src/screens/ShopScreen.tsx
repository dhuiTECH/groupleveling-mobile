import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Image, Alert, FlatList, RefreshControl, Dimensions, Platform,  } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { RootStackScreenProps } from '../types/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';

// Import assets
import logo from '../../assets/icon.png'; // Example logo import
import placeholderImage from '../../assets/icon.png'; // Example placeholder image

// Define item interface
interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isCosmetic?: boolean;
}

const initialShopItems: ShopItem[] = [
  {
    id: '1',
    name: 'Basic Sword',
    description: 'A simple sword for beginners.',
    price: 10,
    imageUrl: 'https://via.placeholder.com/150', // Replace with actual image URL
  },
  {
    id: '2',
    name: 'Health Potion',
    description: 'Restores a small amount of health.',
    price: 5,
    imageUrl: 'https://via.placeholder.com/150', // Replace with actual image URL
  },
  {
    id: '3',
    name: 'Cool Hat',
    description: 'A stylish hat to customize your character.',
    price: 20,
    imageUrl: 'https://via.placeholder.com/150', // Replace with actual image URL
    isCosmetic: true,
  },
  {
    id: '4',
    name: 'Strength Amulet',
    description: 'Increases your strength stat.',
    price: 15,
    imageUrl: 'https://via.placeholder.com/150', // Replace with actual image URL
  },
  {
    id: '5',
    name: 'Shiny Boots',
    description: 'Boots that make you run faster.',
    price: 25,
    imageUrl: 'https://via.placeholder.com/150', // Replace with actual image URL
    isCosmetic: true,
  },
];

interface ShopScreenProps {}

export const ShopScreen: React.FC<ShopScreenProps> = () => {
  const navigation = useNavigation<RootStackScreenProps<'Shop'>['navigation']>();
  const insets = useSafeAreaInsets();

  const [shopItems, setShopItems] = useState<ShopItem[]>(initialShopItems);
  const [wishlist, setWishlist] = useState<string[]>([]); // Array of item IDs
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const numColumns = 2; // Number of columns for the grid layout
  const screenWidth = Dimensions.get('window').width;
  const itemWidth = (screenWidth - 40) / numColumns; // Adjust 40 for padding/margin

  // Simulate fetching data (replace with actual API call)
  const fetchData = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay
    // In a real app, you would fetch data from an API here
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate refresh delay
    // In a real app, you would re-fetch data from an API here
    setIsRefreshing(false);
  }, []);

  const toggleWishlist = (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (wishlist.includes(itemId)) {
      setWishlist(wishlist.filter((id) => id !== itemId));
    } else {
      setWishlist([...wishlist, itemId]);
    }
  };

  const handlePurchase = (item: ShopItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Confirm Purchase',
      `Are you sure you want to purchase ${item.name} for $${item.price}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Purchase',
          onPress: () => {
            // Implement purchase logic here (e.g., call payment API)
            Alert.alert('Purchase Successful', `You have purchased ${item.name}!`);
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: ShopItem }) => (
    <TouchableOpacity
      style={[styles.itemContainer, { width: itemWidth }]}
      onPress={() => handlePurchase(item)}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.itemImage}
        defaultSource={placeholderImage} // Use placeholder image
      />
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemPrice}>${item.price}</Text>
      <TouchableOpacity
        style={styles.wishlistButton}
        onPress={() => toggleWishlist(item.id)}
      >
        <Text>{wishlist.includes(item.id) ? '❤️' : '🤍'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Image source={logo} style={styles.logo} />
        <Text style={styles.headerTitle}>Shop</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={shopItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#3498db',
    paddingBottom: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2980b9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  listContainer: {
    padding: 10,
  },
  itemContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    margin: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
    borderRadius: 8,
    marginBottom: 5,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  itemPrice: {
    fontSize: 14,
    color: '#27ae60',
  },
  wishlistButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ShopScreen;