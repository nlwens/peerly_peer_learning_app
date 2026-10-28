import { Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';

type Props = { text?: string };

export default function AboutText({ text }: Props) {
  return <Text style={styles.text}>{text}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
