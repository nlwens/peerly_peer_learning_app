import { useLocalSearchParams } from 'expo-router';
import UserProfileScreen from '@/features/users/screens/UserProfileScreen';

export default function UserProfileRoute() {
  const { id, context, requestId } = useLocalSearchParams<{
    id: string;
    context?: string;
    requestId?: string;
  }>();

  if (!id) return null;

  return (
    <UserProfileScreen
      userId={id}
      mode="other"
      requestContext={context as any}
      requestId={typeof requestId === 'string' ? requestId : undefined}
    />
  );
}
