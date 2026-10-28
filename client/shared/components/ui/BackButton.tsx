import { Pressable, StyleSheet } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';

type Props = {
  to?: Parameters<typeof router.replace>[0];
  mode?: 'back' | 'replace';
  accessibilityLabel?: string;
};

export default function BackButton({ to, mode = 'back', accessibilityLabel = 'Back' }: Props) {
  return (
    <Pressable
      style={styles.backButton}
      onPress={() => {
        if (!to || mode === 'back') router.back();
        else router.replace(to);
      }}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: false }}
    >
      <Feather name="arrow-left" size={22} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
