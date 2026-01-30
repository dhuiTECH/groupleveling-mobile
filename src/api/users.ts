// Converted React Native api file
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_BASE_URL = 'https://your-api-base-url.com'; // Replace with your actual API base URL

// Helper function for making API requests
const makeRequest = async (url: string, method: string = 'GET', body: any = null) => {
  try {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
    };

    const token = await AsyncStorage.getItem('authToken'); // Example: Retrieve auth token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const requestOptions: RequestInit = {
      method,
      headers,
    };

    if (body) {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${url}`, requestOptions);

    if (!response.ok) {
      // Handle HTTP errors
      console.error(`API Error: ${response.status} - ${response.statusText}`);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    // Handle network errors and other exceptions
    console.error('API Request Error:', error.message, error);

    // Provide a more user-friendly error message based on the platform
    const errorMessage = Platform.OS === 'ios'
      ? 'A network error occurred. Please check your internet connection.'
      : 'Network error. Ensure you have a stable internet connection.';

    throw new Error(errorMessage); // Re-throw the error for the calling function to handle
  }
};

// React Native API functions
export const api = {
  // Get all users
  getUsers: async () => {
    try {
      const users = await makeRequest('/users', 'GET');
      return users;
    } catch (error: any) {
      console.error('Error fetching users:', error.message);
      throw error; // Re-throw to allow component-level error handling
    }
  },

  // Get a single user by ID
  getUserById: async (id: string) => {
    try {
      const user = await makeRequest(`/users/${id}`, 'GET');
      return user;
    } catch (error: any) {
      console.error(`Error fetching user with ID ${id}:`, error.message);
      throw error;
    }
  },

  // Create a new user
  createUser: async (userData: any) => {
    try {
      const newUser = await makeRequest('/users', 'POST', userData);
      return newUser;
    } catch (error: any) {
      console.error('Error creating user:', error.message);
      throw error;
    }
  },

  // Update an existing user
  updateUser: async (id: string, userData: any) => {
    try {
      const updatedUser = await makeRequest(`/users/${id}`, 'PUT', userData);
      return updatedUser;
    } catch (error: any) {
      console.error(`Error updating user with ID ${id}:`, error.message);
      throw error;
    }
  },

  // Delete a user
  deleteUser: async (id: string) => {
    try {
      await makeRequest(`/users/${id}`, 'DELETE');
      return true; // Indicate successful deletion
    } catch (error: any) {
      console.error(`Error deleting user with ID ${id}:`, error.message);
      throw error;
    }
  },

  // Example: Authentication (Login)
  loginUser: async (credentials: any) => {
    try {
      const response = await makeRequest('/auth/login', 'POST', credentials);

      // Store the authentication token securely using AsyncStorage
      if (response.token) {
        await AsyncStorage.setItem('authToken', response.token);
      }

      return response;
    } catch (error: any) {
      console.error('Login failed:', error.message);
      throw error;
    }
  },

  // Example: Logout
  logoutUser: async () => {
    try {
      // Remove the authentication token from AsyncStorage
      await AsyncStorage.removeItem('authToken');
      return true;
    } catch (error: any) {
      console.error('Logout failed:', error.message);
      throw error;
    }
  },

  // Add more API methods as needed
};