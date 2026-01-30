import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { RootStackScreenProps } from '../types/navigation';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import UI components
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { theme } from '../constants/theme';

// Import assets
import logo from '../../assets/icon.png';

interface SignupScreenProps {}

export const SignupScreen: React.FC<SignupScreenProps> = () => {
  const navigation = useNavigation<RootStackScreenProps<'Signup'>['navigation']>();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async () => {
    setError(null); // Clear any previous errors
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!termsAccepted) {
      setError('Please accept the terms of service.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    try {
      // Simulate signup process (replace with actual API call)
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate network request

      // Successful signup
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Signup Successful!', 'You can now login.');
      navigation.navigate('Login'); // Navigate to login screen
    } catch (e: any) {
      setError(e.message || 'Signup failed. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignup = (provider: string) => {
    // Implement social signup logic here (e.g., using Firebase, AWS Cognito, etc.)
    Alert.alert(`Signing up with ${provider}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0} // Adjust as needed
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>NEW RECRUIT REGISTRATION</Text>

            <Card variant="cyan" style={styles.formContainer}>
              {error && <Text style={styles.error}>{error}</Text>}

              <Input
                label="Codename"
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <Input
                label="System ID"
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
              <Input
                label="Access Code"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <Input
                label="Verify Access Code"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              <Button
                variant="cyan"
                onPress={handleSignup}
                loading={loading}
                style={styles.signupButton}
              >
                INITIALIZE ACCOUNT
              </Button>

              <View style={styles.socialButtonsContainer}>
                <Button
                  variant="outline"
                  onPress={() => handleSocialSignup('Google')}
                  style={styles.socialButton}
                  size="sm"
                >
                  GOOGLE AUTH
                </Button>
                <Button
                  variant="outline"
                  onPress={() => handleSocialSignup('Apple')}
                  style={styles.socialButton}
                  size="sm"
                >
                  APPLE ID
                </Button>
              </View>

              <View style={styles.loginLinkContainer}>
                <Text style={styles.loginLinkText}>ALREADY REGISTERED? </Text>
                <Text 
                  style={styles.loginLink}
                  onPress={() => navigation.navigate('Login' as any)}
                >
                  LOG IN
                </Text>
              </View>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 30,
    textAlign: 'center',
    color: '#00ffff',
    letterSpacing: 2,
  },
  formContainer: {
    padding: 24,
  },
  signupButton: {
    marginTop: 10,
    marginBottom: 24,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 10,
  },
  socialButton: {
    flex: 1,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  loginLinkText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    letterSpacing: 1,
  },
  loginLink: {
    color: '#00ffff',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
  error: {
    color: '#ff0000',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default SignupScreen;