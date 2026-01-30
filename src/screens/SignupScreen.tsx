import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { RootStackScreenProps } from '../types/navigation';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { Feather } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';

// Import UI components
import Input from '../components/ui/Input'; 

interface SignupScreenProps {}

const { width, height } = Dimensions.get('window');

export const SignupScreen: React.FC<SignupScreenProps> = () => {
  const navigation = useNavigation<RootStackScreenProps<'Signup'>['navigation']>();
  const insets = useSafeAreaInsets();
  const { signInWithOtp, verifyOtp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Non-binary'>('Male');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1: Enter email/name, 2: Verify OTP

  // Animation values
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Pulsating animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, [glowAnim]);

  const handleContinue = async () => {
    setError(null);

    if (step === 1) {
      // Step 1: Request OTP
      if (!name || !email) {
        setError('Please fill in your character name and email.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      setLoading(true);
      try {
        await signInWithOtp(email);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('OTP Sent', 'Check your email for the verification code!');
        setStep(2);
      } catch (e: any) {
        setError(e.message || 'Failed to send OTP. Please try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    if (!otp) {
      setError('Please enter the OTP.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(email, otp);
      // Upon successful OTP verification, Supabase should automatically log the user in
      // AuthContext's onAuthStateChange will handle setting the user and navigating
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Awakening Successful', 'Proceed to class selection.');
      
      // Navigate to ClassSelection. The name and gender will be stored in the profiles table.
      navigation.navigate('ClassSelection' as any, { gender, name });
    } catch (e: any) {
      setError(e.message || 'OTP verification failed. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarSource = () => {
    switch(gender) {
        case 'Female': return require('../../assets/NoobWoman.png');
        case 'Non-binary': return require('../../assets/Noobnonbinary.png');
        default: return require('../../assets/NoobMan.png');
    }
  };

  const getTShirtSource = () => {
    return gender === 'Female' 
      ? require('../../assets/White T-Shirt (F).png') 
      : require('../../assets/White T-Shirt (Unisex).png');
  };

  return (
    <View style={styles.container}>
      {/* Background Video Layer */}
      <Video
        source={require('../../assets/Hologram.mp4')}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />
      
      {/* Dark Overlay for Readability */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]} />

      {/* Blue Blur Effects */}
      <View style={StyleSheet.absoluteFill}>
        {/* Vertical Tech Lines */}
        <View style={[styles.verticalLine, { left: '20%' }]} />
        <View style={[styles.verticalLine, { right: '20%' }]} />
        
        {/* Glow Effects */}
        <View style={styles.blueBlurLeft} />
        <View style={styles.blueBlurRight} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.systemTitle}>SYSTEM</Text>
              <Text style={styles.systemSubtitle}>INITIAL CONNECTION ESTABLISHED</Text>
            </View>

            {/* Main Tech Panel */}
            <View style={styles.techPanel}>
              
              {/* Hunter Awakens Banner */}
              <View style={styles.bannerContainer}>
                <Animated.Image 
                  source={require('../../assets/exclamation.png')} 
                  style={[styles.exclamationIcon, { opacity: glowAnim }]} 
                />
                <Animated.View style={[styles.bannerTextContainer, { opacity: glowAnim }]}>
                    <Text style={styles.bannerText}>HUNTER AWAKENS</Text>
                </Animated.View>
              </View>

              {/* Error Message */}
              {error && <Text style={styles.errorText}>{error}</Text>}

              {/* Form */}
              <View style={styles.formContainer}>
                {step === 1 ? (
                  <>
                    {/* Character Name */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>CHARACTER NAME</Text>
                      <Input
                        value={name}
                        onChangeText={setName}
                        placeholder="Hunter Name..."
                        style={styles.inputStyle}
                        placeholderTextColor="rgba(59, 130, 246, 0.5)" // Darker blue placeholder
                      />
                    </View>

                    {/* Email */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>EMAIL ADDRESS <Text style={styles.required}>*</Text></Text>
                      <Input
                        value={email}
                        onChangeText={setEmail}
                        placeholder="hunter@email.com"
                        keyboardType="email-address"
                        style={styles.inputStyle}
                        placeholderTextColor="rgba(59, 130, 246, 0.5)"
                      />
                    </View>

                    {/* Gender Choice */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, !gender && styles.errorLabel]}>
                        GENDER CHOICE <Text style={styles.required}>*</Text>
                      </Text>
                      <View style={styles.genderGrid}>
                        {['Male', 'Female', 'Non-binary'].map((g) => (
                          <TouchableOpacity
                            key={g}
                            onPress={() => setGender(g as any)}
                            style={[
                              styles.genderButton,
                              gender === g && styles.genderButtonActive
                            ]}
                          >
                            <Text style={[
                              styles.genderButtonText,
                              gender === g && styles.genderButtonTextActive
                            ]}>{g}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Avatar Preview */}
                    <View style={styles.avatarContainer}>
                      <View style={styles.rankPlasmaContainer}>
                        <View style={styles.avatarInner}>
                          <Image source={getAvatarSource()} style={styles.avatarImage} />
                          <Image source={getTShirtSource()} style={styles.shirtImage} />
                        </View>
                      </View>
                    </View>
                  </>
                ) : (
                  // Step 2: OTP Verification
                  <>
                    <Text style={styles.otpInfoText}>Enter the code sent to {email}</Text>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>VERIFICATION CODE <Text style={styles.required}>*</Text></Text>
                      <Input
                        value={otp}
                        onChangeText={setOtp}
                        placeholder="••••••"
                        keyboardType="number-pad"
                        secureTextEntry
                        style={styles.inputStyle}
                        placeholderTextColor="rgba(59, 130, 246, 0.5)"
                        maxLength={6}
                      />
                    </View>
                  </>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={step === 1 ? handleContinue : handleVerifyOtp}
                  disabled={loading || (step === 1 && (!name || !email)) || (step === 2 && !otp)}
                  style={[styles.enterButton, loading && styles.enterButtonDisabled]}
                >
                  <Text style={styles.enterButtonText}>
                    {loading ? 'ESTABLISHING CONNECTION...' : (step === 1 ? 'REQUEST OTP' : 'VERIFY & AWAKEN')}
                  </Text>
                </TouchableOpacity>

                {/* Footer Login Link */}
                <View style={styles.footerContainer}>
                  <Text style={styles.footerText}>ALREADY AWAKENED?</Text>
                  <TouchableOpacity 
                    style={styles.reAwakenButton}
                    onPress={() => navigation.navigate('Login')}
                  >
                    <Text style={styles.reAwakenText}>LOGIN & RE-AWAKEN</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  verticalLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.3)', // Faint blue line
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  blueBlurLeft: {
    position: 'absolute',
    top: '30%',
    left: -100,
    width: 300,
    height: 300,
    backgroundColor: 'rgba(30, 58, 138, 0.4)',
    borderRadius: 150,
    transform: [{ scale: 1.5 }],
    opacity: 0.6,
  },
  blueBlurRight: {
    position: 'absolute',
    bottom: '10%',
    right: -100,
    width: 300,
    height: 300,
    backgroundColor: 'rgba(30, 58, 138, 0.3)',
    borderRadius: 150,
    transform: [{ scale: 1.5 }],
    opacity: 0.5,
  },
  // Removed adminButton and adminButtonText styles
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  systemTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
    textShadowColor: '#3b82f6',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30, // Increased glow
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', 
    elevation: 10, // Android glow attempt
  },
  systemSubtitle: {
    fontSize: 10,
    color: '#bfdbfe',
    opacity: 0.9,
    letterSpacing: 4,
    marginTop: 8,
    textTransform: 'uppercase',
    fontWeight: '700',
    textShadowColor: 'rgba(59, 130, 246, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  techPanel: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(5, 5, 15, 0.85)', // Slightly darker/more opaque
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    borderRadius: 2, 
    padding: 24,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 15,
  },
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8, 
  },
  exclamationIcon: {
    width: 60, 
    height: 60,
    resizeMode: 'contain',
    tintColor: '#ffffff',
  },
  bannerTextContainer: {
    height: 38, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center', 
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  bannerText: {
    color: '#ffffff',
    fontWeight: 'normal', 
    fontSize: 16,
    letterSpacing: 3,
    textShadowColor: '#3b82f6',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    textTransform: 'uppercase',
  },
  errorText: {
    color: '#f87171',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 12,
    fontWeight: 'bold',
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 8,
    marginLeft: 2,
    textTransform: 'uppercase',
  },
  errorLabel: {
    color: '#f87171',
  },
  required: {
    color: '#f87171',
  },
  inputStyle: {
    marginBottom: 0, 
    backgroundColor: 'rgba(0, 0, 0, 0.6)', 
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    color: '#ffffff', 
    fontWeight: 'bold',
  },
  genderGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20, // Pill shape like in screenshot
    alignItems: 'center',
  },
  genderButtonActive: {
    borderColor: '#3b82f6', // blue-500
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  genderButtonText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94a3b8', // slate-400
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  genderButtonTextActive: {
    color: '#60a5fa', // blue-400
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  rankPlasmaContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', 
    borderWidth: 2,
    borderColor: '#06b6d4', // Cyan border
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  avatarInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    resizeMode: 'cover',
  },
  shirtImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    resizeMode: 'contain',
    zIndex: 10,
  },
  enterButton: {
    backgroundColor: '#2563eb', // blue-600
    paddingVertical: 18,
    borderRadius: 6, 
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    borderBottomWidth: 4,
    borderBottomColor: '#1e3a8a', // blue-900
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  enterButtonDisabled: {
    opacity: 0.6,
  },
  enterButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  footerContainer: {
    alignItems: 'center',
    gap: 10,
  },
  footerText: {
    fontSize: 10,
    color: '#94a3b8', 
    letterSpacing: 2,
    fontWeight: '700',
  },
  reAwakenButton: {
    backgroundColor: '#2563eb', // blue-600
    paddingVertical: 14,
    width: '100%',
    borderRadius: 6,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#1e3a8a', // blue-900
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  reAwakenText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  otpInfoText: {
    color: '#bfdbfe',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
});

export default SignupScreen;