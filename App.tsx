import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AppProviders } from './src/contexts/AppProviders';
import Notification from './src/components/Notification';
import { useNotification } from './src/contexts/NotificationContext';

function NotificationWrapper() {
  const { notification, hideNotification } = useNotification();
  return (
    <>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onHide={hideNotification}
        />
      )}
    </>
  );
}

export default function App(): JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProviders>
          <NotificationWrapper />
          <NavigationContainer>
            <AppNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}