import React, { useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  Platform, 
  KeyboardAvoidingView, 
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '@/contexts/AuthContext';
import { useSocialData } from '@/hooks/useSocialData';
import SocialHub from '@/components/SocialHub';
import { User } from '@/types/user';
import { AvatarViewerModal } from '@/components/modals/AvatarViewerModal';

import { useNotification } from '@/contexts/NotificationContext';

export const SocialScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const socialData = useSocialData();
  const [selectedAvatar, setSelectedAvatar] = useState<User | null>(null);
  const [associationName, setAssociationName] = useState('');
  const [selectedEmblem, setSelectedEmblem] = useState('');

  const onRefresh = useCallback(async () => {
    await socialData.refreshAllData();
  }, [socialData]);

  if (!user) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={['#020617', '#0f172a', '#020617']}
          style={StyleSheet.absoluteFill}
        />
        
        <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? insets.top : 0 }}>
          <View style={{ flex: 1 }}>
            <SocialHub
              user={user}
              {...socialData}
              onRefresh={onRefresh}
              onFriendsTabFocus={socialData.fetchSuggestions}
              associationName={associationName}
              setAssociationName={setAssociationName}
              selectedEmblem={selectedEmblem}
              setSelectedEmblem={setSelectedEmblem}
              showNotification={showNotification}
              setSelectedAvatar={setSelectedAvatar}
              emblemOptions={[
                'https://wyatvubfobfshqyfobqy.supabase.co/storage/v1/object/public/emblems/dagger.png',
                'https://wyatvubfobfshqyfobqy.supabase.co/storage/v1/object/public/emblems/shield.png',
                'https://wyatvubfobfshqyfobqy.supabase.co/storage/v1/object/public/emblems/crown.png',
                'https://wyatvubfobfshqyfobqy.supabase.co/storage/v1/object/public/emblems/sword.png',
                'https://wyatvubfobfshqyfobqy.supabase.co/storage/v1/object/public/emblems/skull.png',
              ]}
            />
          </View>
        </SafeAreaView>

        {/* Player Detail Modal */}
        <AvatarViewerModal
          visible={!!selectedAvatar}
          onClose={() => setSelectedAvatar(null)}
          user={selectedAvatar}
          currentUser={user}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
});

export default SocialScreen;
