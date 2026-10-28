import { Modal, Pressable, View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';
import { type EducationLevel } from '@/features/users/data/types';

type Props = {
  visible: boolean;
  levels: EducationLevel[];
  onSelect: (lvl: EducationLevel) => void;
  onClose: () => void;
};

export default function EducationLevelModal({ visible, levels, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={onClose} accessible={false}>
        <Pressable style={styles.sheet} accessible={false}>
          {levels.map((lvl) => (
            <Pressable
              key={lvl}
              style={styles.row}
              onPress={() => onSelect(lvl)}
              accessibilityRole="radio"
              accessibilityLabel={lvl}
            >
              <Text>{lvl}</Text>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.card, paddingVertical: 8 },
  row: { padding: 16 },
});
