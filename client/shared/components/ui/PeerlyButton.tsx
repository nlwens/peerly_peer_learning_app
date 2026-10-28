import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, View, AccessibilityRole } from 'react-native';
import { ReactNode } from 'react';

type Props = {
  title: string;
  onPress?: () => void;
  backgroundColor: string;
  textColor: string;
  borderColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  icon?: ReactNode;
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
};

export default function PeerlyButton({
  title,
  onPress,
  backgroundColor,
  textColor,
  borderColor,
  style,
  textStyle,
  disabled = false,
  icon,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor, borderColor: borderColor ?? 'transparent', opacity: disabled ? 0.5 : pressed ? 0.9 : 1 },
        style,
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>

        {icon && <View style={styles.icon}>{icon}</View>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
  icon: {
    marginLeft: 8,
  },
});
