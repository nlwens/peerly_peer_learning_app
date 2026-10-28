// app/index.tsx
import { Redirect } from 'expo-router';
import { useAuth, isLoggedIn } from '@/shared/store/auth';
import { View } from 'react-native';

export default function Index() {
  const { hydrated } = useAuth();

  if (!hydrated) return <View style={{ flex: 1 }} />;

  return isLoggedIn() ? <Redirect href="/(tabs)/home" /> : <Redirect href="/(auth)/login" />;
}
