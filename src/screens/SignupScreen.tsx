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
import { playHunterSound } from '../utils/audio';

// Import UI components
import { TechButton } from '../components/ui/TechButton';
import Input from '../components/ui/Input';
import { GlowText } from '../components/ui/GlowText';
import { SystemGlass } from '../components/ui/SystemGlass';
import { cn } from '../utils/cn';

const { width, height } = Dimensions.get('window');

const CLASSES = [
  { 
    id: 'Assassin', 
    name: 'ASSASSIN', 
    subtitle: 'VELOCITY & PRECISION',
    desc: 'Specializes in high-velocity output and critical strike precision. Perfect for hunters who prefer a glass-cannon playstyle.', 
    color: ['rgba(147, 51, 234, 0.4)', 'black'], 
    image: require('../../assets/classes/assassin.webp'), 
    icon: require('../../assets/classes/assassinicon.webp'),
    stats: { agility: 95, strength: 55, vitality: 40 }
  },
  { 
    id: 'Fighter', 
    name: 'FIGHTER', 
    subtitle: 'INTENSITY & STRENGTH',
    desc: 'Peak physical power. Engineered for maximum resistance and HIIT. Balanced offensive and defensive capabilities.', 
    color: ['rgba(220, 38, 38, 0.4)', 'black'], 
    image: require('../../assets/classes/fighter.webp'), 
    icon: require('../../assets/classes/fightericon.webp'),
    stats: { agility: 55, strength: 95, vitality: 70 }
  },
  { 
    id: 'Tanker', 
    name: 'TANKER', 
    subtitle: 'STAMINA & ENDURANCE',
    desc: 'Unstoppable momentum. Built for long-duration endurance and heavy resistance training. Maximum survivability.', 
    color: ['rgba(37, 99, 235, 0.4)', 'black'], 
    image: require('../../assets/classes/tanker.webp'), 
    icon: require('../../assets/classes/tankericon.webp'),
    stats: { agility: 30, strength: 75, vitality: 95 }
  },
  { 
    id: 'Ranger', 
    name: 'RANGER', 
    subtitle: 'PERCEPTION & FOCUS',
    desc: 'Superior environmental awareness and consistent pacing. Specialized in long-range engagement and sustained output.', 
    color: ['rgba(234, 88, 12, 0.4)', 'black'], 
    image: require('../../assets/classes/ranger.webp'), 
    icon: require('../../assets/classes/rangericon.webp'),
    stats: { agility: 85, strength: 50, vitality: 60 }
  },
  { 
    id: 'Mage', 
    name: 'MAGE', 
    subtitle: 'TECHNICAL & CORE', 
    desc: 'Mastery of internal balance and precision core control. High efficiency in movement patterns and energy conservation.', 
    color: ['rgba(79, 70, 229, 0.4)', 'black'], 
    image: require('../../assets/classes/mage.webp'), 
    icon: require('../../assets/classes/mageicon.webp'),
    stats: { agility: 70, strength: 40, vitality: 60 }
  },
  { 
    id: 'Healer', 
    name: 'Healer', 
    subtitle: 'RECOVERY & CONSISTENCY',
    desc: 'Cellular restoration focus. Consistency-based training designed to maximize recovery rate and longevity.', 
    color: ['rgba(22, 163, 74, 0.4)', 'black'], 
    image: require('../../assets/classes/healer.webp'), 
    icon: require('../../assets/classes/healericon.webp'),
    stats: { agility: 50, strength: 45, vitality: 85 }
  }
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
        playHunterSound('error');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      const existingEmail = await checkProfileExists(email);
      if (existingEmail) {
        setSystemError('This email is already registered.');
        setLoading(false);
        playHunterSound('error');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      await signInWithOtp(email);
      playHunterSound('click');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('verify');
    } catch (e: any) {
      setSystemError(e.message || 'Failed to send OTP.');
      playHunterSound('error');
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
      playHunterSound('loginSuccess');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('class_path');
    } catch (e: any) {
      setSystemError(e.message || 'OTP verification failed.');
      playHunterSound('error');
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

      playHunterSound('levelUp');
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
    // Current Time for HUD
    const [time, setTime] = useState('');
    useEffect(() => {
      const updateTime = () => {
        const now = new Date();
        setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      };
      updateTime();
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }, []);

    return (
      <View style={styles.classContainer}>
        {/* HUD Header */}
        <View style={styles.hudHeader}>
          <View>
            <View style={styles.hudRow}>
              <View style={styles.statusDot} />
              <Text style={styles.hudText}>SYSTEM_STATUS: ONLINE</Text>
            </View>
            <Text style={[styles.hudText, { opacity: 0.4 }]}>MODE: SELECTION</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.hudText, { opacity: 0.4 }]}>LOCAL_NODE: 04</Text>
            <Text style={styles.hudTime}>{time}</Text>
          </View>
        </View>

        <View style={styles.itemsCenter}>
          {loading && <View style={styles.spinner} />} 
          <GlowText className="text-4xl mb-2" color="#fff">CLASS SELECTION</GlowText>
          <Text style={styles.subText}>
            SELECT YOUR COMBAT ARCHETYPE
          </Text>
        </View>

        {/* Flex Accordion Container */}
        <View style={styles.accordionContainer}>
          {CLASSES.map((c) => {
            const isSelected = selectedClass === c.id;
            // Determine border color for selected state
            const borderColor = isSelected ? '#22d3ee' : 'rgba(255,255,255,0.1)';
            
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => {
                  playHunterSound('click');
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
                
                {/* Dark Overlay for inactive cards */}
                {!isSelected && <View style={styles.inactiveOverlay} />}

                <LinearGradient
                  colors={c.color}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                />
                
                {/* Border Overlay */}
                <View style={[
                  StyleSheet.absoluteFill, 
                  { 
                    borderWidth: isSelected ? 2 : 1, 
                    borderColor: borderColor,
                    borderRadius: 4
                  } 
                ]} />

                {!isSelected && (
                  <View style={styles.classTitleVertical}>
                    <Text style={styles.classTitleTextVertical}>{c.name}</Text>
                  </View>
                )}

                {isSelected && (
                  <MotiView 
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    style={styles.classSelectedContent}
                  >
                    <View style={styles.classIconRow}>
                      <Image source={c.icon} style={styles.classIconImage} resizeMode="contain" />
                      <View>
                        <Text style={styles.classSelectedTitle}>{c.name}</Text>
                        <Text style={styles.classSelectedSubtitle}>{c.subtitle}</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.classDesc}>{c.desc}</Text>
                    
                    {/* Stats Section */}
                    <View style={styles.statsContainer}>
                      {Object.entries(c.stats).map(([stat, value]) => (
                        <View key={stat} style={styles.statRow}>
                          <View style={styles.statLabelRow}>
                            <Text style={styles.statLabel}>{stat}</Text>
                            <Text style={styles.statValue}>{value}</Text>
                          </View>
                          <View style={styles.statBarBg}>
                            <MotiView 
                              from={{ width: '0%' }}
                              animate={{ width: `${value}%` }}
                              transition={{ type: 'timing', duration: 1000 }}
                              style={styles.statBarFill}
                            />
                          </View>
                        </View>
                      ))}
                    </View>

                  </MotiView>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        
        {/* Action Button Section */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 30, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={handleClassAwaken}
              disabled={loading || !selectedClass}
              style={[styles.confirmClassBtn, !selectedClass && { opacity: 0.5 }]}
            >
              <Text style={styles.confirmClassText}>
                {loading ? 'FINALIZING...' : 'CONFIRM SELECTION'} <Text style={{color: '#06b6d4'}}>→</Text>
              </Text>
            </TouchableOpacity>

            <View style={styles.footerDataRow}>
                <Text style={styles.footerDataText}>DATA_VERSION: 1.0.4</Text>
                <View style={styles.footerDot} />
                <Text style={styles.footerDataText}>ENCRYPTION: AES-256</Text>
            </View>
        </View>

        {systemError && <Text style={styles.errorText}>{systemError}</Text>}
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
    paddingTop: 10,
    width: '100%',
  },
  hudHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
    width: '100%',
  },
  hudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22d3ee',
  },
  hudText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#22d3ee',
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  hudTime: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#22d3ee',
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  accordionContainer: {
    flexDirection: 'row',
    height: 550,
    width: '100%',
    paddingHorizontal: 4,
    gap: 2,
  },
  classCard: {
    // Flex is handled by specific state styles
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  classCardInactive: {
    flex: 1,
    opacity: 0.8, // Reduced opacity handled by overlay
  },
  classCardSelected: {
    flex: 5, // Expands to take 5x space
    opacity: 1,
  },
  inactiveOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 10,
  },
  classTitleVertical: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  classTitleTextVertical: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16, // Smaller for narrow columns
    fontWeight: '900',
    letterSpacing: 4,
    transform: [{ rotate: '-90deg' }],
    width: 500, 
    textAlign: 'center',
  },
  classSelectedContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)', // Darker bg for readability
    paddingTop: 40,
  },
  classIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  classIconImage: {
    width: 60,
    height: 60,
  },
  classSelectedTitle: {
    color: 'white',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: 'rgba(59, 130, 246, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  classSelectedSubtitle: {
    color: '#60a5fa',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  classDesc: {
    color: 'rgba(255,255,255,0.8)', 
    fontSize: 10,
    fontFamily: 'Rajdhani-Medium',
    marginBottom: 16,
    lineHeight: 14,
  },
  statsContainer: {
    marginTop: 8,
    gap: 8,
  },
  statRow: {
    marginBottom: 4,
  },
  statLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statValue: {
    color: '#22d3ee',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    backgroundColor: '#22d3ee',
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  confirmClassBtn: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderWidth: 1,
    borderColor: '#06b6d4',
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmClassText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  footerDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    opacity: 0.3,
    gap: 10,
  },
  footerDataText: {
    color: 'white',
    fontSize: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
  },
  footerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'white',
  },
});
