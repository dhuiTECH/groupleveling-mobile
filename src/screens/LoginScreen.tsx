import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image, Alert, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { RootStackScreenProps } from '../types/navigation';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import UI components
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { theme } from '../constants/theme';

// Import assets
import logo from '../../assets/icon.png';

interface LoginScreenProps {}

export const LoginScreen: React.FC<LoginScreenProps> = () => {
  const navigation = useNavigation<RootStackScreenProps<'Login'>['navigation']>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
    loadRememberMe();
    loadBiometricPreference();
  }, []);

  const checkBiometricAvailability = async () => {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(types.length > 0 && isEnrolled);
  };

  const loadRememberMe = async () => {
    try {
      const value = await AsyncStorage.getItem('rememberMe');
      if (value !== null) {
        setRememberMe(value === 'true');
        if (value === 'true') {
          const storedEmail = await AsyncStorage.getItem('email');
          const storedPassword = await AsyncStorage.getItem('password');
          if (storedEmail && storedPassword) {
            setEmail(storedEmail);
            setPassword(storedPassword);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load remember me preference.', e);
    }
  };

  const loadBiometricPreference = async () => {
    try {
      const value = await AsyncStorage.getItem('biometricLogin');
      if (value !== null) {
        setBiometricEnabled(value === 'true');
        if (value === 'true') {
          authenticateWithBiometrics();
        }
      }
    } catch (e) {
      console.error('Failed to load biometric preference.', e);
    }
  };

  const saveBiometricPreference = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('biometricLogin', value.toString());
    } catch (e) {
      console.error('Failed to save biometric preference.', e);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Simulate API call (replace with actual Supabase/NextAuth logic)
    setTimeout(() => {
      setLoading(false);
      if (email === 'test@example.com' && password === 'password') {
        Alert.alert('Login Successful');
        navigation.navigate('Home'); // Replace 'Home' with your actual home screen name

        if (rememberMe) {
          AsyncStorage.setItem('rememberMe', 'true');
          AsyncStorage.setItem('email', email);
          AsyncStorage.setItem('password', password);
        } else {
          AsyncStorage.setItem('rememberMe', 'false');
          AsyncStorage.removeItem('email');
          AsyncStorage.removeItem('password');
        }
      } else {
        Alert.alert('Login Failed', 'Invalid credentials');
      }
    }, 2000);
  };

  const authenticateWithBiometrics = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to login',
      fallbackLabel: 'Enter Password',
    });

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Biometric Login Successful');
      navigation.navigate('Home'); // Replace 'Home' with your actual home screen name
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Biometric Authentication Failed', result.error);
    }
  };

  const toggleBiometricLogin = async (value: boolean) => {
    setBiometricEnabled(value);
    saveBiometricPreference(value);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.logoContainer}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
            <Text style={styles.titleText}>HUNTER LOGIN</Text>
          </View>

          <Card variant="cyan" style={styles.formContainer}>
            <Input
              label="System ID"
              placeholder="Enter your email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Input
              label="Access Code"
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <View style={styles.rememberMeContainer}>
              <Switch
                value={rememberMe}
                onValueChange={(value) => {
                  setRememberMe(value);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                trackColor={{ false: '#334155', true: '#00ffff' }}
                thumbColor={rememberMe ? '#ffffff' : '#f4f3f4'}
              />
              <Text style={styles.rememberMeText}>Stay Authorized</Text>
            </View>

            <Button 
              variant="cyan" 
              onPress={handleLogin} 
              loading={loading}
              style={styles.loginButton}
            >
              INITIALIZE LOGIN
            </Button>

            <Button 
              variant="outline" 
              onPress={() => navigation.navigate('ForgotPassword' as any)}
              size="sm"
              style={styles.forgotButton}
            >
              FORGOT ACCESS CODE?
            </Button>

            {biometricAvailable && (
              <View style={styles.biometricContainer}>
                <Text style={styles.biometricText}>BIOMETRIC AUTH:</Text>
                <Switch
                  value={biometricEnabled}
                  onValueChange={toggleBiometricLogin}
                  trackColor={{ false: '#334155', true: '#00ffff' }}
                  thumbColor={biometricEnabled ? '#ffffff' : '#f4f3f4'}
                />
              </View>
            )}
          </Card>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              NEW RECRUIT?{' '}
              <Text
                style={styles.signUpLink}
                onPress={() => navigation.navigate('Register' as any)}
              >
                SIGN UP
              </Text>
            </Text>
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
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  titleText: {
    color: '#00ffff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 4,
    marginTop: 10,
  },
  formContainer: {
    width: '100%',
    padding: 24,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeText: {
    marginLeft: 12,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    letterSpacing: 1,
  },
  loginButton: {
    marginBottom: 16,
  },
  forgotButton: {
    alignSelf: 'center',
    borderWidth: 0,
  },
  footerContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1,
  },
  signUpLink: {
    color: '#00ffff',
    fontWeight: '900',
  },
  biometricContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  biometricText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
});

export default LoginScreen;