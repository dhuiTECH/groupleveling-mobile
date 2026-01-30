import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Platform, 
  Modal,
  Dimensions,
  ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User } from '../types/user';
import LayeredAvatar from './LayeredAvatar';
import { SettingsIcon } from './icons/SettingsIcon';
import { XIcon } from './icons/XIcon';
import { SkullIcon } from './icons/SkullIcon';
import { GlobalTerminal } from './GlobalTerminal';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

interface HunterHeaderProps {
  user: User;
  onAvatarClick: () => void;
  setShowStatusWindow: (show: boolean) => void;
  fastBoot: boolean;
  setFastBoot: (fast: boolean) => void;
  showNotification: (msg: string) => void;
  toggleIncognito: () => void;
}

export const HunterHeader: React.FC<HunterHeaderProps> = ({ 
  user,
  onAvatarClick,
  setShowStatusWindow,
  fastBoot,
  setFastBoot,
  showNotification,
  toggleIncognito
}) => {
  const insets = useSafeAreaInsets();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <View style={styles.header}>
      
      {/* LEFT SIDE - Identity */}
      <TouchableOpacity 
        style={styles.headerLeft} 
        onPress={onAvatarClick}
        activeOpacity={0.8}
      >
        <View style={styles.avatarContainer}>
          <LayeredAvatar user={user} size={36} onAvatarClick={onAvatarClick} />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name || 'Hunter'}</Text>
          <Text style={styles.userLevel}>Lv.{user.level}</Text>
        </View>
      </TouchableOpacity>

      {/* RIGHT SIDE - Utility */}
      <View style={styles.headerRight}>
        
        {/* Status Window Button */}
        <TouchableOpacity 
          onPress={() => setShowStatusWindow(true)} 
          style={styles.statsBtn}
        >
           <Image source={require('../../assets/stats.png')} style={styles.statsIcon} />
        </TouchableOpacity>

        {/* Gems */}
        <View style={styles.currencyPillPurple}>
          <Image source={require('../../assets/gemicon.png')} style={styles.currencyIcon} />
          <Text style={styles.currencyTextPurple}>{(user.gems || 0).toLocaleString()}</Text>
        </View>

        {/* Gold */}
        <View style={styles.currencyPillYellow}>
          <Image source={require('../../assets/coinicon.png')} style={styles.currencyIcon} />
          <Text style={styles.currencyTextYellow}>{(user.coins || 0).toLocaleString()}</Text>
        </View>

        {/* Settings Toggle Button */}
        <TouchableOpacity 
          onPress={() => setShowSettings(true)} 
          style={styles.settingsBtn}
        >
           <SettingsIcon size={20} color="#22d3ee" />
        </TouchableOpacity>
      </View>

      {/* SETTINGS MODAL */}
      <Modal
        visible={showSettings}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={() => setShowSettings(false)}
          >
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          </TouchableOpacity>

          <View style={styles.settingsModal}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.settingsIconBox}>
                  <SettingsIcon size={20} color="#22d3ee" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>System Config</Text>
                  <Text style={styles.modalSubtitle}>HUNTER_NET_TERMINAL_V2.0</Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => setShowSettings(false)}
                style={styles.closeBtn}
              >
                <XIcon size={18} color="#f87171" />
              </TouchableOpacity>
            </View>

            {/* Settings Grid */}
            <View style={styles.settingsGrid}>
              {/* Skip Intro */}
              <TouchableOpacity
                onPress={() => {
                  const nextState = !fastBoot;
                  setFastBoot(nextState);
                  showNotification(nextState ? "INTRO ANIMATION: SKIPPED" : "INTRO ANIMATION: ENABLED");
                }}
                style={[
                  styles.settingOption,
                  fastBoot ? styles.settingOptionActive : styles.settingOptionInactive
                ]}
              >
                <SettingsIcon size={12} color={fastBoot ? "#bfdbfe" : "#9ca3af"} />
                <Text style={[styles.settingText, fastBoot ? {color: '#bfdbfe'} : {color: '#9ca3af'}]}>
                  Skip Intro
                </Text>
              </TouchableOpacity>

              {/* Incognito */}
              <TouchableOpacity
                onPress={toggleIncognito}
                style={[
                  styles.settingOption,
                  user.is_private ? styles.settingOptionPurple : styles.settingOptionInactive
                ]}
              >
                <SettingsIcon size={12} color={user.is_private ? "#e9d5ff" : "#9ca3af"} />
                <Text style={[styles.settingText, user.is_private ? {color: '#e9d5ff'} : {color: '#9ca3af'}]}>
                  Incognito Mode
                </Text>
              </TouchableOpacity>

              {/* Admin & Logout */}
              <View style={styles.row}>
                {/* Admin (Mock condition) */}
                {true && ( 
                  <TouchableOpacity
                    style={[styles.settingOption, styles.adminOption]}
                  >
                    <SettingsIcon size={12} color="#facc15" />
                    <Text style={[styles.settingText, {color: '#facc15'}]}>Admin Panel</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.settingOption, styles.logoutOption]}
                  onPress={() => {
                    // Handle logout logic here or pass prop
                    setShowSettings(false);
                  }}
                >
                  <SkullIcon size={12} color="#f87171" />
                  <Text style={[styles.settingText, {color: '#f87171'}]}>Terminate Session</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Chat Terminal */}
            <View style={styles.terminalContainer}>
              <GlobalTerminal userProfile={user} />
            </View>

          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 50,
    // Transparent/Opaque background as requested (opaque usually means visible bg)
    backgroundColor: 'transparent', 
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(6, 182, 212, 0.5)', // cyan-500/50
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  userInfo: {
    justifyContent: 'center',
  },
  userName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  userLevel: {
    color: '#22d3ee', // cyan-400
    fontSize: 10,
    fontWeight: 'bold',
    lineHeight: 12,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsBtn: {
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.5)',
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
  },
  statsIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  currencyPillPurple: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(88, 28, 135, 0.2)', // purple-900/20
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)', // purple-500/30
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  currencyTextPurple: {
    color: '#c084fc', // purple-400
    fontSize: 12,
    fontWeight: 'bold',
  },
  currencyPillYellow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(113, 63, 18, 0.2)', // yellow-900/20
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)', // yellow-500/30
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  currencyTextYellow: {
    color: '#facc15', // yellow-400
    fontSize: 12,
    fontWeight: 'bold',
  },
  currencyIcon: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
  },
  settingsBtn: {
    padding: 4,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  settingsModal: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(15, 23, 42, 0.95)', // System glass look
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 50,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(6, 182, 212, 0.2)',
    marginBottom: 16,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsIconBox: {
    padding: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  modalSubtitle: {
    color: 'rgba(34, 211, 238, 0.6)',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  closeBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  settingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  settingOption: {
    flex: 1, // Grid item
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
    gap: 8,
  },
  settingOptionActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  settingOptionInactive: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingOptionPurple: {
    backgroundColor: 'rgba(147, 51, 234, 0.2)',
    borderColor: 'rgba(168, 85, 247, 0.5)',
  },
  settingText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  adminOption: {
    backgroundColor: 'rgba(202, 138, 4, 0.1)',
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  logoutOption: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  terminalContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(6, 182, 212, 0.2)',
    paddingTop: 12,
    height: 150,
  },
});
