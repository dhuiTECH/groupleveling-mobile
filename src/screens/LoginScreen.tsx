import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableOpacity
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { RootStackScreenProps } from '../types/navigation';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { Video, ResizeMode } from 'expo-av';
import { playHunterSound } from '../utils/audio';

// Import UI components
import { TechButton } from '../components/ui/TechButton';
import Input from '../components/ui/Input';
import { GlowText } from '../components/ui/GlowText';
import { SystemGlass } from '../components/ui/SystemGlass';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<RootStackScreenProps<'Login'>['navigation']>();
  const { signInWithOtp, verifyOtp, checkProfileExists } = useAuth();

  const [identifier, setIdentifier] = useState(''); // Email or Hunter Name
  const [email, setEmail] = useState(''); // The actual email to send OTP to
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Enter ID, 2: Verify OTP
  const [hunterName, setHunterName] = useState('');

  const handleSendCode = async () => {
    if (!identifier) {
      Alert.alert('Error', 'Please enter your email or hunter name.');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const profile = await checkProfileExists(identifier);
      
      if (!profile || !profile.email) {
        Alert.alert('Hunter Not Found', 'No profile matches this ID. Please register first.');
        setLoading(false);
        return;
      }

      setEmail(profile.email);
      setHunterName(profile.hunter_name);
      await signInWithOtp(profile.email);
      setStep(2);
      playHunterSound('click');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      playHunterSound('error');
      Alert.alert('Connection Failed', error.message || 'Could not send login code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the verification code.');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      await verifyOtp(email, otp);
      playHunterSound('loginSuccess');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error: any) {
      playHunterSound('error');
      Alert.alert('Verification Failed', error.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.rootContainer}>
      <Video
        source={require('../../assets/Hologram.mp4')}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
        opacity={0.4}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View className="flex-1 items-center justify-center px-6">
            <GlowText className="text-4xl mb-2">HUNTER LOGIN</GlowText>
            <Text 
              style={{ color: 'rgba(255, 255, 255, 0.6)', letterSpacing: 3, fontSize: 12, marginBottom: 32 }}
            >
              REESTABLISH CONNECTION
            </Text>

            <SystemGlass className="w-full max-w-md">
              <View className="p-4 items-center">
                <Text className="text-neon-cyan font-ui tracking-widest text-sm mb-4">
                  ENTER YOUR CREDENTIALS
                </Text>
                {step === 2 && (
                  <View className="text-sm text-neon-cyan font-bold mb-2">
                    <Text className="text-neon-cyan font-ui font-bold text-center">
                      Welcome back, Hunter {hunterName}
                    </Text>
                  </View>
                )}

                {step === 1 ? (
                  <>
                    <Input
                      label="Email or Hunter Name"
                      placeholder="hunter@email.com or YourHunterName"
                      value={identifier}
                      onChangeText={setIdentifier}
                      keyboardType="email-address"
                    />
                    <TechButton 
                      title="Send Login Code" 
                      onPress={handleSendCode} 
                      className="mt-4"
                      variant="primary"
                    />
                  </>
                ) : (
                  <>
                    <Input
                      label="Verification Code"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="numeric"
                    />
                    <TechButton 
                      title="Verify & Enter" 
                      onPress={handleVerify} 
                      className="mt-4"
                      variant="accent"
                    />
                    <TouchableOpacity onPress={() => setStep(1)} className="mt-4">
                      <Text className="text-white/40 font-ui text-xs">BACK TO LOGIN</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </SystemGlass>

            <View className="mt-12 items-center">
              <Text className="text-white/40 font-ui text-xs tracking-widest mb-4">
                NEW HUNTER?
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup' as any)}>
                <Text className="text-neon-cyan font-header font-bold tracking-widest">
                  CREATE NEW ACCOUNT →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#050505',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});

export default LoginScreen;