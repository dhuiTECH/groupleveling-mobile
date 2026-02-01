import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, AnimatePresence } from 'moti';
import { ArrowLeft, User, ShieldCheck, Lock, AlertCircle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

// --- REUSABLE CYBER COMPONENTS ---

// 1. Cyber Input (Updated to match Onboarding Navy Style)
const CyberInput = ({ 
  value, 
  onChangeText, 
  placeholder, 
  icon: Icon, 
  secureTextEntry, 
  keyboardType,
  autoCapitalize 
}: any) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[
      styles.inputContainer, 
      isFocused && styles.inputContainerFocused
    ]}>
      {Icon && <Icon size={18} color={isFocused ? "#22d3ee" : "#64748b"} style={{ marginRight: 12 }} />}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(34, 211, 238, 0.4)"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize || "none"}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
};

// 2. Cyber Button (3D Press effect)
const CyberButton = ({ onPress, text, loading, color = 'blue', disabled }: any) => {
  const bgColors = color === 'green' ? ['#16a34a', '#15803d'] : ['#2563eb', '#1d4ed8'];
  const shadowColor = color === 'green' ? '#14532d' : '#1e3a8a';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={[
        styles.cyberBtn,
        { borderBottomColor: shadowColor },
        disabled && styles.cyberBtnDisabled
      ]}
    >
      <LinearGradient
        colors={bgColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {loading ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ActivityIndicator color="#fff" size="small" />
          <Text style={styles.cyberBtnText}>PROCESSING...</Text>
        </View>
      ) : (
        <Text style={styles.cyberBtnText}>{text}</Text>
      )}
    </TouchableOpacity>
  );
};

// --- MAIN PAGE ---

interface LoginPageProps {
  onBack: () => void;
  onSignup: () => void;
  onAuthenticated: (userData: any) => void;
  handleSendLoginOTP: (identifier: string) => Promise<{ success: boolean; email?: string; name?: string; error?: string }>;
  handleVerifyLoginOTP: (email: string, otp: string) => Promise<{ success: boolean; user?: any; error?: string }>;
}

export default function LoginPage({
  onBack,
  onSignup,
  onAuthenticated,
  handleSendLoginOTP,
  handleVerifyLoginOTP,
}: LoginPageProps) {
  // State
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [isLoading, setIsLoading] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [characterData, setCharacterData] = useState<{ name: string; email: string } | null>(null);

  // Handlers
  const onSendOTP = async () => {
    if (!identifier) return setError('Please enter your email or hunter name');
    setIsLoading(true);
    setError(null);
    try {
      const result = await handleSendLoginOTP(identifier);
      if (result.success) {
        setCharacterData({ name: result.name || 'Hunter', email: result.email || '' });
        setStep('otp');
      } else {
        setError(result.error || 'Profile not found');
      }
    } catch (e: any) {
      setError('System connection failed');
    }
    setIsLoading(false);
  };

  const onVerifyOTP = async () => {
    if (otpToken.length !== 6) return setError('Invalid key length');
    setIsLoading(true);
    setError(null);
    try {
      const result = await handleVerifyLoginOTP(characterData?.email || '', otpToken);
      if (result.success) {
        onAuthenticated(result.user);
      } else {
        setError(result.error || 'Verification failed');
      }
    } catch (e: any) {
      setError('System connection failed');
    }
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* BACKGROUND VIDEO */}
      <Video
        source={require('../../../assets/Hologram.mp4')}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        shouldPlay isLooping isMuted opacity={0.3}
      />
      {/* Vignette Overlay (Updated to match Onboarding) */}
      <View style={styles.overlay} />

      {/* BACK BUTTON */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <ArrowLeft size={20} color="#94a3b8" />
        <Text style={styles.backText}>BACK</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardView}
      >
        <View style={styles.contentWrapper}>
          
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>HUNTER LOGIN</Text>
            <Text style={styles.subtitle}>REESTABLISH CONNECTION</Text>
          </View>

          {/* TECH PANEL */}
          <View style={styles.techPanel}>
            <AnimatePresence exitBeforeEnter>
              
              {/* STEP 1: CREDENTIALS */}
              {step === 'credentials' && (
                <MotiView
                  key="creds"
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  exit={{ opacity: 0, translateX: 20 }}
                  style={{ width: '100%' }}
                >
                  <View style={{ alignItems: 'center', marginBottom: 24 }}>
                    <Text style={styles.panelTitle}>ENTER CREDENTIALS</Text>
                    <Text style={styles.panelSubtitle}>We'll send a verification code to your email</Text>
                  </View>

                  <View style={{ marginBottom: 24 }}>
                    <Text style={styles.label}>EMAIL OR HUNTER NAME</Text>
                    <CyberInput 
                      value={identifier}
                      onChangeText={setIdentifier}
                      placeholder="hunter@email.com or Name"
                      icon={User}
                    />
                  </View>

                  {error && (
                    <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.errorBox}>
                      <AlertCircle size={14} color="#f87171" />
                      <Text style={styles.errorText}>{error}</Text>
                    </MotiView>
                  )}

                  <CyberButton 
                    text="SEND LOGIN CODE" 
                    onPress={onSendOTP} 
                    loading={isLoading} 
                  />
                </MotiView>
              )}

              {/* STEP 2: OTP */}
              {step === 'otp' && (
                <MotiView
                  key="otp"
                  from={{ opacity: 0, translateX: 20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  exit={{ opacity: 0, translateX: -20 }}
                  style={{ width: '100%' }}
                >
                  <View style={{ alignItems: 'center', marginBottom: 24 }}>
                    <Text style={styles.panelTitle}>VERIFICATION REQUIRED</Text>
                    <View style={styles.welcomeBox}>
                      <Text style={styles.welcomeText}>Welcome back, Hunter {characterData?.name}</Text>
                      <Text style={styles.emailText}>{characterData?.email}</Text>
                    </View>
                  </View>

                  <View style={{ marginBottom: 24 }}>
                    <Text style={styles.label}>ENTER 6-DIGIT KEY</Text>
                    <View style={styles.otpWrapper}>
                      <TextInput
                        value={otpToken}
                        onChangeText={setOtpToken}
                        placeholder="000000"
                        placeholderTextColor="rgba(34, 211, 238, 0.2)"
                        keyboardType="number-pad"
                        maxLength={6}
                        style={styles.otpInput}
                      />
                    </View>
                  </View>

                  {error && (
                    <View style={styles.errorBox}>
                      <AlertCircle size={14} color="#f87171" />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  <CyberButton 
                    text="VERIFY & LOGIN" 
                    color="green"
                    onPress={onVerifyOTP} 
                    loading={isLoading}
                  />

                  <TouchableOpacity 
                    style={styles.backLink}
                    onPress={() => { setStep('credentials'); setError(null); }}
                  >
                    <Text style={styles.backLinkText}>← BACK TO CREDENTIALS</Text>
                  </TouchableOpacity>
                </MotiView>
              )}

            </AnimatePresence>

            {/* FOOTER */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>New Hunter?</Text>
              <TouchableOpacity onPress={onSignup}>
                <Text style={styles.footerLink}>CREATE NEW ACCOUNT →</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  // 1. NAVY BACKGROUND
  container: { flex: 1, backgroundColor: '#0f172a' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(37, 99, 235, 0.05)' },
  
  // BACK BUTTON
  backButton: { 
    position: 'absolute', top: 60, left: 24, zIndex: 50, 
    flexDirection: 'row', alignItems: 'center', gap: 6 
  },
  backText: { color: '#94a3b8', fontSize: 12, fontWeight: '700', letterSpacing: 1 },

  keyboardView: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  contentWrapper: { width: '100%', maxWidth: 450, alignItems: 'center' },

  // HEADER
  header: { alignItems: 'center', marginBottom: 32 },
  title: { 
    fontSize: 36, fontWeight: '300', color: '#fff', letterSpacing: -1,
    textShadowColor: '#3b82f6', textShadowRadius: 20, textShadowOffset: { width: 0, height: 0 }
  },
  subtitle: { 
    fontSize: 10, color: '#bfdbfe', letterSpacing: 4, opacity: 0.8, 
    marginTop: 4, fontWeight: '700' 
  },

  // 2. NAVY TECH PANEL
  techPanel: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.9)', // Deep Navy Glass
    borderColor: 'rgba(30, 58, 138, 0.5)', borderWidth: 1, // Blue 800 Border
    borderTopWidth: 0, borderBottomWidth: 0,
    borderRadius: 0, 
    padding: 32,
    alignItems: 'center',
    overflow: 'hidden'
  },
  panelTitle: { color: '#60a5fa', fontSize: 16, fontWeight: '300', letterSpacing: 1, marginBottom: 4 },
  panelSubtitle: { color: '#94a3b8', fontSize: 10, marginBottom: 16 },

  // 3. NAVY INPUTS
  label: { color: '#cbd5e1', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 8, marginLeft: 2 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)', // Slate 800 input bg
    borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.2)', // Cyan-ish border
    borderRadius: 8, paddingHorizontal: 16, height: 50
  },
  inputContainerFocused: { borderColor: '#22d3ee', backgroundColor: 'rgba(34, 211, 238, 0.05)' },
  input: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600' },

  // OTP INPUT
  otpWrapper: {
    backgroundColor: '#000', borderBottomWidth: 2, borderBottomColor: '#3b82f6',
    width: '100%', height: 60, justifyContent: 'center'
  },
  otpInput: {
    textAlign: 'center', color: '#fff', fontSize: 24, 
    fontWeight: '900', letterSpacing: 8
  },

  // WELCOME BOX
  welcomeBox: { 
    backgroundColor: 'rgba(34, 211, 238, 0.05)', padding: 12, borderRadius: 4, 
    borderWidth: 1, borderColor: 'rgba(34, 211, 238, 0.2)', width: '100%', alignItems: 'center' 
  },
  welcomeText: { color: '#22d3ee', fontWeight: 'bold', fontSize: 12 },
  emailText: { color: 'rgba(34, 211, 238, 0.6)', fontSize: 10, marginTop: 2 },

  // ERRORS
  errorBox: { 
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: 12, borderRadius: 4, marginBottom: 20, width: '100%'
  },
  errorText: { color: '#f87171', fontSize: 11, fontWeight: 'bold' },

  // BUTTON
  cyberBtn: {
    width: '100%', height: 50, borderRadius: 4,
    justifyContent: 'center', alignItems: 'center',
    borderBottomWidth: 4, overflow: 'hidden'
  },
  cyberBtnDisabled: { opacity: 0.5, borderBottomWidth: 0, transform: [{ translateY: 4 }] },
  cyberBtnText: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 2 },

  // LINKS
  backLink: { marginTop: 20, width: '100%', alignItems: 'center' },
  backLinkText: { color: '#60a5fa', fontSize: 10, fontWeight: '700', SletterSpacing: 1 },
  
  footer: { 
    marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', 
    width: '100%', alignItems: 'center' 
  },
  footerText: { color: '#94a3b8', fontSize: 10, marginBottom: 8 },
  footerLink: { color: '#60a5fa', fontSize: 12, fontWeight: '300', letterSpacing: 1 }
});