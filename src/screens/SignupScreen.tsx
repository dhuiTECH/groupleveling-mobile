import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { RootStackScreenProps } from '../types/navigation';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { playHunterSound } from '../utils/audio';

// Import UI components
import OnboardingView from '../components/views/OnboardingView';

export default function SignupScreen() {
  const navigation = useNavigation<RootStackScreenProps<'Signup'>['navigation']>();
  const { signInWithOtp, verifyOtp, checkProfileExists } = useAuth();
  
  // Track email for verification step
  const emailRef = React.useRef('');

  const handleAwaken = async (data: { name: string, email: string, gender: string }) => {
    try {
      emailRef.current = data.email;
      
      // Check duplicate name
      const existingName = await checkProfileExists(data.name);
      if (existingName) {
        return { success: false, error: 'This hunter name is already in use.' };
      }

      // Check duplicate email
      const existingEmail = await checkProfileExists(data.email);
      if (existingEmail) {
        return { success: false, error: 'This email is already registered.' };
      }

      await signInWithOtp(data.email);
      playHunterSound('click');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return { success: true };
    } catch (e: any) {
      playHunterSound('error');
      return { success: false, error: e.message || 'Failed to send OTP.' };
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    try {
      if (!emailRef.current) {
        return { success: false, error: 'Email context lost. Please try again.' };
      }
      
      await verifyOtp(emailRef.current, otp);
      playHunterSound('loginSuccess');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return { success: true };
    } catch (e: any) {
      playHunterSound('error');
      return { success: false, error: e.message || 'OTP verification failed.' };
    }
  };

  const handleClassAwaken = async (selectedClass: string) => {
    try {
      // Finalize awakening logic
      playHunterSound('levelUp');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to finalize awakening.' };
    }
  };

  return (
    <View style={styles.container}>
      <OnboardingView
        onLogin={() => navigation.navigate('Login')}
        onAdminLogin={() => navigation.navigate('Admin' as any)}
        onComplete={() => {
          // Navigation handled inside handleClassAwaken
        }}
        handleAwaken={handleAwaken}
        handleVerifyOTP={handleVerifyOTP}
        handleClassAwaken={handleClassAwaken}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
