import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';

type Props = { label: string };

export default function Tag({ label }: Props) {
  return (
    <View style={styles.tag}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderWidth: 1,
    borderColor: COLORS.textMuted,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
});
