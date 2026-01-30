// Converted React Native api file
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import React from 'react';

// Define a base URL for your API.  Consider using environment variables.
const BASE_URL = 'https://your-api-endpoint.com'; // Replace with your actual API endpoint

// Utility function to handle API errors
const handleApiError = async (response: Response) => {
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} - ${response.statusText}`;
    try {
      const errorBody = await response.json();
      errorMessage += ` - ${errorBody.message || JSON.stringify(errorBody)}`;
    } catch (jsonError) {
      errorMessage += ' (Failed to parse error body)';
    }
    throw new Error(errorMessage);
  }
  return response;
};

// Utility function to check network connectivity (optional, requires a library like `@react-native-community/netinfo`)
// import NetInfo from "@react-native-community/netinfo";
// const isNetworkAvailable = async () => {
//   const netInfoState = await NetInfo.fetch();
//   return netInfoState.isConnected;
// };

// Example API functions
export const api = {
  getProducts: async () => {
    try {
      // if (!await isNetworkAvailable()) {
      //   throw new Error("No internet connection");
      // }

      const response = await fetch(`${BASE_URL}/products`);
      await handleApiError(response);
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching products:', error.message);
      throw error; // Re-throw to allow the calling component to handle the error
    }
  },

  getProductById: async (id: string) => {
    try {
      // if (!await isNetworkAvailable()) {
      //   throw new Error("No internet connection");
      // }

      const response = await fetch(`${BASE_URL}/products/${id}`);
      await handleApiError(response);
      return await response.json();
    } catch (error: any) {
      console.error(`Error fetching product with ID ${id}:`, error.message);
      throw error;
    }
  },

  createOrder: async (orderData: any) => {
    try {
      // if (!await isNetworkAvailable()) {
      //   throw new Error("No internet connection");
      // }

      const response = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      await handleApiError(response);
      return await response.json();
    } catch (error: any) {
      console.error('Error creating order:', error.message);
      throw error;
    }
  },

  // Example of using AsyncStorage for caching data
  getCachedProducts: async () => {
    try {
      const cachedProducts = await AsyncStorage.getItem('products');
      if (cachedProducts) {
        return JSON.parse(cachedProducts);
      }
      return null; // Or an empty array, depending on your needs
    } catch (error: any) {
      console.error('Error retrieving cached products:', error.message);
      return null;
    }
  },

  setCachedProducts: async (products: any) => {
    try {
      await AsyncStorage.setItem('products', JSON.stringify(products));
    } catch (error: any) {
      console.error('Error caching products:', error.message);
    }
  },

  // Example of file upload (using FormData) - requires expo-document-picker and expo-file-system
  uploadImage: async (imageUri: string) => {
    try {
      // if (!await isNetworkAvailable()) {
      //   throw new Error("No internet connection");
      // }

      // Create FormData
      const formData = new FormData();

      // Append the image file to the FormData
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg', // Adjust the type based on your image format
        name: 'image.jpg', // Provide a filename
      } as any);

      const response = await fetch(`${BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData as any,
      });

      await handleApiError(response);
      return await response.json();
    } catch (error: any) {
      console.error('Error uploading image:', error.message);
      throw error;
    }
  },

  // Example of authentication using AsyncStorage
  login: async (credentials: any) => {
    try {
      // if (!await isNetworkAvailable()) {
      //   throw new Error("No internet connection");
      // }

      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      await handleApiError(response);
      const data = await response.json();

      // Store the token in AsyncStorage
      await AsyncStorage.setItem('authToken', data.token);
      return data;
    } catch (error: any) {
      console.error('Login failed:', error.message);
      throw error;
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('authToken');
    } catch (error: any) {
      console.error('Logout failed:', error.message);
      throw error;
    }
  },

  getAuthToken: async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return token;
    } catch (error: any) {
      console.error('Error getting auth token:', error.message);
      return null;
    }
  },

  // Example of using platform specific code
  getPlatform: () => {
    return Platform.OS; // Returns 'ios' or 'android'
  },
};