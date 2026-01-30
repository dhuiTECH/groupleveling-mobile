import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { RootStackParamList, RootTabParamList } from '../types/navigation';

import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import DashboardScreen from '../screens/DashboardScreen';
import TrainingScreen from '../screens/TrainingScreen';
import DungeonScreen from '../screens/DungeonScreen';
import ShopScreen from '../screens/ShopScreen';
import SocialScreen from '../screens/SocialScreen';
import InventoryScreen from '../screens/InventoryScreen';
import AdminScreen from '../screens/AdminScreen';
import ClassSelectionScreen from '../screens/ClassSelectionScreen';

import GameBottomNav from '../components/GameBottomNav';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

function BottomTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <GameBottomNav {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // We are using a custom tab bar
      }}
      initialRouteName="System"
    >
      <Tab.Screen name="Temple" component={TrainingScreen} />
      <Tab.Screen name="Hunter" component={InventoryScreen} />
      <Tab.Screen name="System" component={HomeScreen} />
      <Tab.Screen name="Shop" component={ShopScreen} />
      <Tab.Screen name="Social" component={SocialScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator(): JSX.Element {
  return (
    <Stack.Navigator 
      initialRouteName="Home"
      screenOptions={{
        headerShown: false, // Hide header for all stack screens by default
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={BottomTabNavigator}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
      />
      <Stack.Screen 
        name="Signup" 
        component={SignupScreen}
      />
      <Stack.Screen 
        name="Admin" 
        component={AdminScreen}
      />
      <Stack.Screen 
        name="ClassSelection" 
        component={ClassSelectionScreen}
      />
      {/* 
        Screens accessible from within the app but not part of the main tabs.
        Usually detail views or modals.
      */}
       <Stack.Screen 
        name="Dungeon" 
        component={DungeonScreen}
        options={{ title: 'Dungeon' }}
      />
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
    </Stack.Navigator>
  );
}