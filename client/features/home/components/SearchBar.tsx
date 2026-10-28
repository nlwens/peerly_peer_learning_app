import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';

type Props = {
  value?: string;
  onChangeText?: (text: string) => void;
};

export default function SearchBar({ value, onChangeText }: Props) {
  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search subjects or skills..."
        placeholderTextColor={COLORS.textMuted}
        style={styles.input}
        accessibilityLabel="Search subjects or skills"
      />
      <Ionicons name="search" size={20} color={COLORS.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.searchBar,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 59,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginRight: 8,
  },
});
