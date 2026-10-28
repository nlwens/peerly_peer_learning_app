import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useState } from 'react';
import { COLORS } from '@/constants/theme';
import Feather from '@expo/vector-icons/Feather';

type Props = {
  title: string;
  children: React.ReactNode;
  count: number;
};

export default function RequestSection({ title, children, count }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.header}
        onPress={() => setCollapsed(!collapsed)}
        accessibilityRole="button"
        accessibilityLabel={`${collapsed ? 'Expand' : 'Collapse'} ${title} requests`}
      >
        <Text style={styles.title}>
          {title} ({count})
        </Text>
        <Feather name={collapsed ? 'chevron-down' : 'chevron-up'} size={18} color={COLORS.textPrimary} />
      </Pressable>

      {!collapsed && <View>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});
