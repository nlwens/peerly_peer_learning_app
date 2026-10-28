import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/theme';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
};

export function ChatInputBar({ value, onChangeText, onSend }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Type a message..."
        style={styles.input}
        accessibilityLabel="Type a message"
      />
      <Pressable
        style={styles.sendButton}
        onPress={onSend}
        accessibilityRole="button"
        accessibilityLabel="Send message"
      >
        <Text style={styles.sendButtonText}>Send</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: COLORS.card,
  },
  input: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sendButton: {
    backgroundColor: COLORS.buttonGreen,
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: COLORS.textOnDark,
    fontWeight: '700',
  },
});
