import { useLocalSearchParams } from 'expo-router';
import ChatTestScreen from '@/features/messages/screens/ChatTestScreen';

export default function ChatRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id || typeof id !== 'string') return null;

  return <ChatTestScreen otherUserId={id} />;
}
