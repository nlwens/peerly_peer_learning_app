import { Tabs, router } from 'expo-router';
import { COLORS } from '@/constants/theme';
import Feather from '@expo/vector-icons/Feather';
import Entypo from '@expo/vector-icons/Entypo';

import { getAccessToken } from '@/shared/store/auth';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Tabs.Screen
        name="requests"
        options={{
          tabBarIcon: () => <Entypo name="text-document" size={24} color="black" />,
        }}
      />

      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ size }) => <Feather name="home" size={size} color={COLORS.textPrimary} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ size }) => <Feather name="user" size={size} color={COLORS.textPrimary} />,
        }}
        listeners={{
          tabPress: (e) => {
            if (!getAccessToken()) {
              e.preventDefault();
              router.push('/(auth)/login');
            }
          },
        }}
      />
    </Tabs>
  );
}
