import { router } from 'expo-router';
import { getLoggedInUserId } from '@/shared/store/auth';

export function requireAuth(): string | null {
  const me = getLoggedInUserId();
  if (!me) {
    router.push('/(auth)/login');
    return null;
  }
  return me;
}
