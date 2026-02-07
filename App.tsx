import React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from '@/navigation/AppNavigator';
import { AppProviders } from '@/contexts/AppProviders';
import Notification from '@/components/Notification';
import { useNotification } from '@/contexts/NotificationContext';
import HologramOverlay from '@/components/HologramOverlay';
import { navigationRef } from '@/navigation/navigationRef';
import { TutorialProvider } from '@/context/TutorialContext';

import Toast from 'react-native-toast-message';

WebBrowser.maybeCompleteAuthSession();

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
          <NavigationContainer ref={navigationRef}>
            <TutorialProvider>
              <AppNavigator />
              <StatusBar style="auto" />
              <HologramOverlay />
            </TutorialProvider>
          </NavigationContainer>
          <Toast />
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
