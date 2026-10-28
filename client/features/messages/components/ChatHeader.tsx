import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/theme';

type Props = {
  title: string;
  onBack: () => void;
};

export function ChatHeader({ title, onBack }: Props) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back">
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.backPlaceholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
  },
  backText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  backPlaceholder: {
    width: 40,
  },
});
