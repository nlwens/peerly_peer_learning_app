import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
};

const DEFAULT_TITLE = 'Unable to send request';
const DEFAULT_MESSAGE = "You're out of tokens!";

export default function OutOfTokensModal({
  visible,
  onClose,
  title = DEFAULT_TITLE,
  message = DEFAULT_MESSAGE,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{message}</Text>
          <View style={styles.footer}>
            <Pressable style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 18,
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  body: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  footer: {
    marginTop: 18,
  },
  button: {
    backgroundColor: COLORS.buttonGreen,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.textOnDark,
    fontWeight: '700',
  },
});
