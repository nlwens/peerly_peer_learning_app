// app/(protected)/_layout.tsx
import { Stack, router } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/shared/store/auth';
import { View } from 'react-native';

export default function ProtectedLayout() {
  const { loggedInUserId, hydrated } = useAuth();

  useEffect(() => {
    if (!hydrated) return; // wait for loadAuth()
    if (!loggedInUserId) {
      router.replace('/(auth)/login');
    }
  }, [hydrated, loggedInUserId]);

  if (!hydrated) return <View style={{ flex: 1 }} />;
  if (!loggedInUserId) return <View style={{ flex: 1 }} />; // while redirecting

  return <Stack screenOptions={{ headerShown: false }} />;
}
