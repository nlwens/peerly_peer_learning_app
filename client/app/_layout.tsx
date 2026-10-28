import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Nunito_800ExtraBold, Nunito_400Regular } from '@expo-google-fonts/nunito';
import { View } from 'react-native';
import { useEffect } from 'react';

import { initUsers } from '@/features/users/store/usersStore';
import { loadRequests } from '@/features/requests/store/requestsStore';
import { loadAuth } from '@/shared/store/auth';
import { seedUsers } from '../scripts/seedUsers';
import { initializeUserCacheFromStorage } from '@/features/users/store/userProfileCache';
import { initializeConversationCacheFromStorage } from '@/features/messages/store/messagesCache';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_800ExtraBold,
    Nunito_400Regular,
  });

  useEffect(() => {
    const init = async () => {
      await initUsers();
      if (__DEV__) await seedUsers();
      await loadAuth();
      await loadRequests();
      // Initialize offline caches
      await initializeUserCacheFromStorage();
      await initializeConversationCacheFromStorage();
    };
    init();
  }, []);

  if (!fontsLoaded) {
    return <View style={{ flex: 1 }} />;
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
