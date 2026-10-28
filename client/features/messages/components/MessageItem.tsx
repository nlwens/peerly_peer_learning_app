import { Image, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/theme';
import type { Message } from '@/features/messages/types';

type Props = {
  item: Message;
  isMine: boolean;
  fallbackAvatarUri?: string | null;
};

export function MessageItem({ item, isMine, fallbackAvatarUri }: Props) {
  const time = new Date(item.sent_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowOther]}>
      {!isMine && (
        <Image
          source={{ uri: item.sender?.profile_image_url || fallbackAvatarUri || undefined }}
          style={styles.avatar}
          accessibilityLabel={`Profile photo of ${item.sender?.name || 'sender'}`}
        />
      )}

      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
        <Text style={[styles.messageText, isMine && styles.messageTextMine]}>{item.content}</Text>
        <Text style={[styles.timeText, isMine && styles.timeTextMine]}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: '#ddd',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleMine: {
    backgroundColor: COLORS.buttonYellow,
  },
  bubbleOther: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  messageText: {
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  messageTextMine: {
    color: 'black',
  },
  timeText: {
    marginTop: 4,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  timeTextMine: {
    color: '#555555',
  },
});
