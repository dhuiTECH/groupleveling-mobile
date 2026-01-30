// Converted React Native api file
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import React from 'react';

const API_BASE_URL = 'YOUR_API_BASE_URL'; // Replace with your actual API base URL

// Helper function for making API requests
const apiRequest = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body: any = null,
  headers: Record<string, string> = {}
) => {
  try {
    const url = `${API_BASE_URL}/${endpoint}`;

    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body) {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('API request error:', error.message);
    throw error; // Re-throw the error for the calling function to handle
  }
};

// Example API functions for social features
export const api = {
  // Get user profile
  getUserProfile: async (userId: string) => {
    try {
      const profile = await apiRequest(`users/${userId}`, 'GET');
      return profile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  // Update user profile
  updateUserProfile: async (userId: string, profileData: any) => {
    try {
      const updatedProfile = await apiRequest(`users/${userId}`, 'PUT', profileData);
      return updatedProfile;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Get user's posts
  getUserPosts: async (userId: string) => {
    try {
      const posts = await apiRequest(`users/${userId}/posts`, 'GET');
      return posts;
    } catch (error) {
      console.error('Error fetching user posts:', error);
      throw error;
    }
  },

  // Create a new post
  createPost: async (postData: any) => {
    try {
      const newPost = await apiRequest('posts', 'POST', postData);
      return newPost;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  // Like a post
  likePost: async (postId: string) => {
    try {
      const likedPost = await apiRequest(`posts/${postId}/like`, 'POST');
      return likedPost;
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  },

  // Unlike a post
  unlikePost: async (postId: string) => {
    try {
      const unlikedPost = await apiRequest(`posts/${postId}/unlike`, 'POST');
      return unlikedPost;
    } catch (error) {
      console.error('Error unliking post:', error);
      throw error;
    }
  },

  // Get comments for a post
  getPostComments: async (postId: string) => {
    try {
      const comments = await apiRequest(`posts/${postId}/comments`, 'GET');
      return comments;
    } catch (error) {
      console.error('Error fetching post comments:', error);
      throw error;
    }
  },

  // Add a comment to a post
  addComment: async (postId: string, commentData: any) => {
    try {
      const newComment = await apiRequest(`posts/${postId}/comments`, 'POST', commentData);
      return newComment;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  // Follow a user
  followUser: async (userIdToFollow: string) => {
    try {
      const followResult = await apiRequest(`users/follow/${userIdToFollow}`, 'POST');
      return followResult;
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  },

  // Unfollow a user
  unfollowUser: async (userIdToUnfollow: string) => {
    try {
      const unfollowResult = await apiRequest(`users/unfollow/${userIdToUnfollow}`, 'POST');
      return unfollowResult;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  },

  // Get followers of a user
  getUserFollowers: async (userId: string) => {
    try {
      const followers = await apiRequest(`users/${userId}/followers`, 'GET');
      return followers;
    } catch (error) {
      console.error('Error fetching user followers:', error);
      throw error;
    }
  },

  // Get users a user is following
  getUserFollowing: async (userId: string) => {
    try {
      const following = await apiRequest(`users/${userId}/following`, 'GET');
      return following;
    } catch (error) {
      console.error('Error fetching user following:', error);
      throw error;
    }
  },

  // Store data securely using AsyncStorage
  storeData: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error storing data:', error);
      throw error;
    }
  },

  // Retrieve data securely using AsyncStorage
  getData: async (key: string) => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value;
    } catch (error) {
      console.error('Error retrieving data:', error);
      throw error;
    }
  },

  // Remove data from AsyncStorage
  removeData: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing data:', error);
      throw error;
    }
  },

  // Example of platform-specific code
  getPlatform: () => {
    return Platform.OS; // Returns 'ios' or 'android'
  },
};