import { Modal, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '@/constants/theme';
import Feather from '@expo/vector-icons/Feather';

type Props = {
  visible: boolean;
  title: string;
  options: string[];
  selected?: string | null;
  onSelect: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
};

export default function SubjectPickerModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  onConfirm,
  confirmLabel = 'Send',
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable hitSlop={10} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
              <Feather name="x" size={20} color={COLORS.textPrimary} />
            </Pressable>
          </View>

          {options.length === 0 ? (
            <Text style={styles.empty}>No topics available on this profile.</Text>
          ) : (
            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator>
              <View style={styles.optionsWrap}>
                {options.map((opt) => {
                  const isSelected = opt === selected;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => onSelect(opt)}
                      style={[styles.option, isSelected && styles.optionSelected]}
                      accessibilityRole="radio"
                      accessibilityLabel={opt}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{opt}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )}

          <View style={styles.footer}>
            <Pressable
              style={[styles.btn, styles.btnGhost]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={[styles.btnText, styles.btnTextGhost]}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[styles.btn, styles.btnPrimary, (!selected || options.length === 0) && styles.btnDisabled]}
              disabled={!selected || options.length === 0}
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel="Confirm"
              accessibilityState={{ disabled: !selected || options.length === 0 }}
            >
              <Text style={styles.btnText}>{confirmLabel}</Text>
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
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  option: {
    borderWidth: 1,
    borderColor: COLORS.textMuted,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: COLORS.card,
  },
  optionSelected: {
    borderColor: COLORS.buttonGreen,
  },
  optionText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: COLORS.buttonGreen,
  },
  empty: {
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: 18,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  btn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: COLORS.textMuted,
    marginRight: 8,
    backgroundColor: 'transparent',
  },
  btnPrimary: {
    backgroundColor: COLORS.buttonGreen,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    color: COLORS.textOnDark,
    fontWeight: '700',
  },
  btnTextGhost: {
    color: COLORS.textPrimary,
  },
});
