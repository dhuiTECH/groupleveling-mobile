// Converted React Native hooks file
import React, { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { AppState } from 'react-native';

interface GameData {
  score: number;
  level: number;
  // Add other game data properties as needed
}

const defaultGameData: GameData = {
  score: 0,
  level: 1,
};

export const useGameData = () => {
  const [gameData, setGameData] = useState<GameData>(defaultGameData);
  const [loading, setLoading] = useState<boolean>(true);

  const GAME_DATA_KEY = 'gameData'; // Key for storing game data in AsyncStorage

  // Load game data from AsyncStorage on component mount and app focus
  const loadGameData = useCallback(async () => {
    try {
      const storedData = await AsyncStorage.getItem(GAME_DATA_KEY);
      if (storedData) {
        setGameData(JSON.parse(storedData));
      } else {
        // If no data is found, initialize with default values
        setGameData(defaultGameData);
        await AsyncStorage.setItem(GAME_DATA_KEY, JSON.stringify(defaultGameData));
      }
    } catch (error) {
      console.error('Failed to load game data:', error);
      // Handle error appropriately, e.g., show an error message to the user
    } finally {
      setLoading(false);
    }
  }, []);

  // Save game data to AsyncStorage whenever it changes
  useEffect(() => {
    const saveGameData = async () => {
      try {
        await AsyncStorage.setItem(GAME_DATA_KEY, JSON.stringify(gameData));
      } catch (error) {
        console.error('Failed to save game data:', error);
        // Handle error appropriately, e.g., show an error message to the user
      }
    };

    saveGameData();
  }, [gameData]);

  // Load game data when the component mounts
  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

  // Reload game data when the app comes into focus (e.g., after being in the background)
  useFocusEffect(
    useCallback(() => {
      loadGameData();
    }, [loadGameData])
  );

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: 'active' | 'background' | 'inactive') => {
      if (nextAppState === 'active') {
        // Reload game data when the app becomes active
        loadGameData();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove(); // Clean up the event listener
    };
  }, [loadGameData]);

  // Function to update game data
  const updateGameData = (newData: Partial<GameData>) => {
    setGameData((prevData) => ({ ...prevData, ...newData }));
  };

  // Function to reset game data to default values
  const resetGameData = async () => {
    try {
      await AsyncStorage.removeItem(GAME_DATA_KEY);
      setGameData(defaultGameData);
    } catch (error) {
      console.error('Failed to reset game data:', error);
      // Handle error appropriately
    }
  };

  return {
    gameData,
    loading,
    updateGameData,
    resetGameData,
  };
};