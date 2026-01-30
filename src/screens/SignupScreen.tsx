import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Image, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableOpacity, 
  Dimensions,
  ScrollView,
  LayoutAnimation
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { RootStackScreenProps } from '../types/navigation';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { Video, ResizeMode } from 'expo-av';
import { MotiView } from 'moti';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

// Import UI components
import { TechButton } from '../components/ui/TechButton';
import Input from '../components/ui/Input';
import { GlowText } from '../components/ui/GlowText';
import { SystemGlass } from '../components/ui/SystemGlass';
import { cn } from '../utils/cn';

const { width, height } = Dimensions.get('window');

const CLASSES = [
  { id: 'Assassin', name: 'Assassin', desc: 'Precision & Speed focused. Engineered for silent execution and rapid movement.', color: ['rgba(147, 51, 234, 0.4)', 'black'], image: require('../../assets/classes/assassin.webp'), icon: '🗡️' },
  { id: 'Fighter', name: 'Fighter', desc: 'Intensity & Strength. Peak physical power. Balanced offensive and defensive capabilities.', color: ['rgba(220, 38, 38, 0.4)', 'black'], image: require('../../assets/classes/fighter.webp'), icon: '⚔️' },
  { id: 'Tanker', name: 'Tanker', desc: 'Unyielding Defense. Engineered for endurance and survival. The ultimate shield.', color: ['rgba(37, 99, 235, 0.4)', 'black'], image: require('../../assets/classes/tanker.webp'), icon: '🛡️' },
  { id: 'Ranger', name: 'Ranger', desc: 'Perception & Range. Long-distance specialist. Master of survival and tracking.', color: ['rgba(234, 88, 12, 0.4)', 'black'], image: require('../../assets/classes/ranger.webp'), icon: '🏹' },
  { id: 'Mage', name: 'Mage', desc: 'Intellect & Power. Arcane energy specialist. Master of elemental control.', color: ['rgba(79, 70, 229, 0.4)', 'black'], image: require('../../assets/classes/mage.webp'), icon: '🔮' },
  { id: 'Healer', name: 'Healer', desc: 'Spirit & Support. Vitality specialist. Master of life-preserving arts.', color: ['rgba(22, 163, 74, 0.4)', 'black'], image: require('../../assets/classes/healer.webp'), icon: '✨' }
];

export default function SignupScreen() {
  const navigation = useNavigation<RootStackScreenProps<'Signup'>['navigation']>();
  const insets = useSafeAreaInsets();
  const { signInWithOtp, verifyOtp, checkProfileExists, setUser } = useAuth();

  const [step, setStep] = useState<'register' | 'verify' | 'class_path'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Non-binary'>('Male');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [hunterNameError, setHunterNameError] = useState<string | null>(null);
  const [genderError, setGenderError] = useState(false);

  // --- HANDLERS ---

  const handleAwaken = async () => {
    if (!name.trim()) return;
    if (!email.trim()) return;
    if (!gender) {
      setGenderError(true);
      return;
    }

    setLoading(true);
    setGenderError(false);
    setHunterNameError(null);
    setSystemError(null);

    try {
      // Check duplicate
      const existing = await checkProfileExists(name);
      if (existing) {
        setHunterNameError('This hunter name is already in use.');
        setLoading(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      const existingEmail = await checkProfileExists(email);
      if (existingEmail) {
        setSystemError('This email is already registered.');
        setLoading(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      await signInWithOtp(email);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('verify');
    } catch (e: any) {
      setSystemError(e.message || 'Failed to send OTP.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) return;

    setLoading(true);
    setSystemError(null);
    try {
      await verifyOtp(email, otp);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('class_path');
    } catch (e: any) {
      setSystemError(e.message || 'OTP verification failed.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassAwaken = async () => {
    if (!selectedClass) return;
    setLoading(true);
    
    try {
      // Here we would create/update the profile in the backend. 
      // Assuming verifyOtp already logged us in, we might need to update the user metadata or profile table.
      // For now, we simulate the completion and navigate home.
      // In a real implementation, you'd call a function to update the user's class and avatar.
      
      // Update local user context if needed (handled by AuthContext generally)
      // await updateProfile({ class: selectedClass, ... });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // setUser logic or refetch profile logic would go here
      
      // Navigate to HomeStack
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (e: any) {
      setSystemError(e.message || 'Failed to finalize awakening.');
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

  const renderClassSelection = () => {
    return (
      <View style={styles.classContainer}>
        <View style={styles.itemsCenter}>
          {loading && <View style={styles.spinner} />} 
          <GlowText className="text-xl mb-2" color="#06b6d4">CLASS PATH SELECTION</GlowText>
          <Text style={styles.subText}>
            Choose your archetype. This determines your character's core strengths and playstyle.
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.classScroll}>
          {CLASSES.map((c) => {
            const isSelected = selectedClass === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setSelectedClass(c.id);
                }}
                activeOpacity={0.9}
                style={[
                  styles.classCard,
                  isSelected ? styles.classCardSelected : styles.classCardInactive
                ]}
              >
                <Image source={c.image} style={StyleSheet.absoluteFill} resizeMode="cover" />
                <LinearGradient
                  colors={c.color}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                />
                
                {!isSelected && (
                  <View style={styles.classTitleVertical}>
                    <Text style={styles.classTitleTextVertical}>{c.name.toUpperCase()}</Text>
                  </View>
                )}

                {isSelected && (
                  <MotiView 
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    style={styles.classSelectedContent}
                  >
                    <View style={styles.classIconRow}>
                      <View style={styles.classIconBadge}>
                        <Text style={{fontSize: 16}}>{c.icon}</Text>
                      </View>
                      <Text style={styles.classSelectedTitle}>{c.name.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.classDesc}>{c.desc}</Text>
                    
                    <TouchableOpacity
                      onPress={handleClassAwaken}
                      disabled={loading}
                      style={styles.confirmClassBtn}
                    >
                      <Text style={styles.confirmClassText}>
                        {loading ? 'FINALIZING...' : 'CONFIRM SELECTION'} <Text style={{color: '#06b6d4'}}>→</Text>
                      </Text>
                    </TouchableOpacity>
                  </MotiView>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        
        {systemError && <Text style={styles.errorText}>{systemError}</Text>}
        
        <TouchableOpacity onPress={() => setStep('verify')} style={styles.backLink}>
          <Text style={styles.backLinkText}>← BACK</Text>
        </TouchableOpacity>
      </View>
    );
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
        opacity={0.3}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {step === 'class_path' ? renderClassSelection() : (
            <View style={styles.flex1} className="px-6 justify-between py-4">
              {/* Header Area */}
              <View style={styles.itemsCenter}>
                <GlowText className="text-5xl">SYSTEM</GlowText>
                <Text 
                  style={{ color: 'rgba(255, 255, 255, 0.6)', letterSpacing: 3, fontSize: 10, marginTop: 4 }}
                >
                  INITIAL CONNECTION ESTABLISHED
                </Text>
              </View>

              {/* Main Content Area */}
              <SystemGlass className="w-full flex-shrink" intensity={30}>
                <View style={styles.itemsCenter} className="py-2">
                  {step === 'verify' ? (
                    // --- VERIFICATION ---
                    <View style={styles.verifyContainer}>
                      <View style={styles.itemsCenter}>
                        {loading && <View style={styles.spinner} />}
                        <GlowText className="text-lg mb-2" color="#60a5fa">SYSTEM VERIFICATION REQUIRED</GlowText>
                        <Text style={styles.subText}>
                          Enter the 6-digit key sent to your communication device.
                        </Text>
                      </View>

                      <View style={{ width: '100%', marginVertical: 20 }}>
                        <Input
                          value={otp}
                          onChangeText={setOtp}
                          placeholder="000000"
                          keyboardType="number-pad"
                          maxLength={6}
                          style={{ textAlign: 'center', fontSize: 24, letterSpacing: 4 }}
                        />
                      </View>

                      <TechButton
                        title="VERIFY & PROCEED"
                        onPress={handleVerifyOtp}
                        variant="secondary" // Greenish/Success variant if available, else secondary
                        style={{ backgroundColor: '#16a34a', borderColor: '#14532d' }} // Custom override for green
                      />
                      
                      <TouchableOpacity onPress={() => setStep('register')} style={styles.backLink}>
                        <Text style={styles.backLinkText}>← RECONNECT TO SYSTEM</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    // --- REGISTER ---
                    <>
                      <View style={styles.statusBadge}>
                        <MotiView
                          from={{ opacity: 0.3 }}
                          animate={{ opacity: 1 }}
                          transition={{ type: 'timing', duration: 1000, loop: true }}
                        >
                          <Image 
                            source={require('../../assets/exclamation.png')} 
                            className="w-4 h-4 mr-2 tint-white" 
                          />
                        </MotiView>
                        <Text className="text-white font-ui tracking-widest text-xs">
                          HUNTER AWAKENS
                        </Text>
                      </View>

                      <View style={styles.fullWidth} className="space-y-4">
                        <View>
                          <Text style={styles.label}>CHARACTER NAME</Text>
                          <Input
                            value={name}
                            onChangeText={setName}
                            placeholder="Hunter Name..."
                            style={styles.inputCompact}
                          />
                        </View>

                        <View>
                          <Text style={styles.label}>EMAIL ADDRESS <Text style={{color:'#f87171'}}>*</Text></Text>
                          <Input
                            value={email}
                            onChangeText={setEmail}
                            placeholder="hunter@email.com"
                            keyboardType="email-address"
                            style={styles.inputCompact}
                          />
                        </View>

                        <View>
                          <Text style={[styles.label, genderError && {color: '#f87171'}]}>
                            GENDER CHOICE <Text style={{color:'#f87171'}}>*</Text>
                          </Text>
                          {genderError && <Text style={styles.errorSmall}>⚠️ Please select a gender to continue</Text>}
                          <View style={[styles.genderRow, genderError && styles.errorBorder]}>
                            {['Male', 'Female', 'Non-binary'].map((g) => (
                              <TouchableOpacity
                                key={g}
                                onPress={() => setGender(g as any)}
                                style={[
                                  styles.genderBtn,
                                  gender === g && styles.genderBtnActive
                                ]}
                              >
                                <Text style={[
                                  styles.genderBtnText, 
                                  gender === g && styles.genderBtnTextActive
                                ]}>
                                  {g.toUpperCase()}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        {/* Compact Avatar Preview */}
                        <View style={styles.avatarContainer}>
                          <View style={styles.avatarGlow}>
                            <View style={styles.avatarInner}>
                              <Image source={getAvatarSource()} style={styles.avatarImage} />
                              <Image source={getTShirtSource()} style={[styles.avatarImage, { zIndex: 10 }]} resizeMode="contain" />
                            </View>
                          </View>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              </SystemGlass>

              {/* Bottom Actions Area (Only for Register step) */}
              {step === 'register' && (
                <View style={styles.itemsCenter} className="w-full mt-4">
                  {systemError && <Text style={styles.errorText}>{systemError}</Text>}
                  {hunterNameError && <Text style={styles.errorText}>{hunterNameError}</Text>}

                  <TechButton 
                    title={loading ? "ESTABLISHING CONNECTION..." : "ENTER THE GATE"} 
                    onPress={handleAwaken}
                    variant="primary"
                  />

                  <View style={styles.itemsCenter} className="mt-6">
                    <Text 
                      style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 8, letterSpacing: 2, marginBottom: 8 }}
                    >
                      ALREADY AWAKENED?
                    </Text>
                    <TouchableOpacity 
                      style={styles.loginBtn}
                      onPress={() => navigation.navigate('Login')}
                    >
                      <Text className="text-white font-header font-bold tracking-widest text-xs">
                        LOGIN & RE-AWAKEN
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#050505',
  },
  safeArea: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  itemsCenter: {
    alignItems: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  label: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Rajdhani-Medium',
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 4,
    marginLeft: 4,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  errorBorder: {
    borderWidth: 1,
    borderColor: '#f87171',
    borderRadius: 8,
    padding: 4,
  },
  errorSmall: {
    fontSize: 8,
    color: '#f87171',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  genderBtnActive: {
    borderColor: '#06b6d4', // cyan-400
    // text-cyan-300 logic handled in text
  },
  genderBtnText: {
    fontSize: 8,
    fontFamily: 'Rajdhani-Medium',
    letterSpacing: 0.5,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: 'bold',
  },
  genderBtnTextActive: {
    color: '#67e8f9', // cyan-300
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  avatarGlow: {
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    // Rank plasma container effect simulated
  },
  avatarInner: {
    width: 112,
    height: 112,
    borderRadius: 999,
    overflow: 'hidden',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  inputCompact: {
    marginBottom: 0,
    height: 48,
  },
  loginBtn: {
    backgroundColor: '#2563eb', // blue-600
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 4,
    borderBottomColor: '#1e3a8a', // blue-900
    shadowColor: '#3b82f6',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  // Verify Step
  verifyContainer: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
  },
  subText: {
    color: '#9ca3af', // gray-400
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  spinner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderTopColor: 'transparent',
    marginBottom: 12,
    // Need animation for spin in RN, handled by Moti or basic View for now
  },
  backLink: {
    marginTop: 16,
  },
  backLinkText: {
    color: '#22d3ee', // cyan-400
    fontSize: 14,
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  // Class Path
  classContainer: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 4,
  },
  classScroll: {
    paddingHorizontal: 10,
    alignItems: 'center',
    height: 500, // Fixed height for the row
  },
  classCard: {
    width: 80, // Default collapsed width
    height: 450,
    marginHorizontal: 4,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
  },
  classCardInactive: {
    opacity: 0.6,
    // grayscale logic would need an overlay
  },
  classCardSelected: {
    width: 300, // Expanded width
    borderColor: '#22d3ee',
    borderWidth: 2,
    shadowColor: '#06b6d4',
    shadowRadius: 20,
    shadowOpacity: 0.6,
    opacity: 1,
  },
  classTitleVertical: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  classTitleTextVertical: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 4,
    transform: [{ rotate: '-90deg' }],
    width: 400, // Ensure enough width for text before rotation
    textAlign: 'center',
  },
  classSelectedContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  classIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  classIconBadge: {
    backgroundColor: '#06b6d4',
    padding: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  classSelectedTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
  },
  classDesc: {
    color: '#e5e7eb', // gray-200
    fontSize: 10,
    fontFamily: 'Rajdhani-Medium',
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  confirmClassBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: '#06b6d4',
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmClassText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
