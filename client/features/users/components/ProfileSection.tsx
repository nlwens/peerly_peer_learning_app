import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';

type Props = {
  title: string;
  children: React.ReactNode;
};

export default function ProfileSection({ title, children }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
});
