import { Modal, Pressable, View, Text, TextInput, StyleSheet } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import PeerlyButton from '@/shared/components/ui/PeerlyButton';
import { COLORS } from '@/constants/theme';

type Props = {
  visible: boolean;
  title: string;
  value: string;
  error: string;
  onChange: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function AddTagModal({ visible, title, value, error, onChange, onClose, onSubmit }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={onClose} accessible={false}>
        <Pressable style={styles.card} accessible={false}>
          <View style={styles.header}>
            <Text style={{ fontWeight: '700' }}>{title}</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
              <Feather name="x" size={18} />
            </Pressable>
          </View>

          <TextInput value={value} onChangeText={onChange} style={styles.input} accessibilityLabel="Enter new tag" />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PeerlyButton
            title="Add"
            backgroundColor={COLORS.buttonGreen}
            textColor={COLORS.textOnDark}
            onPress={onSubmit}
            style={{ marginTop: 12 }}
            accessibilityLabel="Add tag"
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10 },
  error: { color: COLORS.red, marginTop: 6 },
});
