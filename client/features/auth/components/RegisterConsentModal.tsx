import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

import { COLORS } from '@/constants/theme';
import PeerlyButton from '@/shared/components/ui/PeerlyButton';

type RegisterConsentModalProps = {
  visible: boolean;
  acceptedDataUse: boolean;
  acceptedVisibility: boolean;
  onToggleDataUse: () => void;
  onToggleVisibility: () => void;
  onClose: () => void;
  onConfirm: () => void;
};

type CheckboxProps = {
  checked: boolean;
  label: string;
  onPress: () => void;
};

function Checkbox({ checked, label, onPress }: CheckboxProps) {
  return (
    <Pressable
      style={styles.checkboxCard}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked ? <Feather name="check" size={16} color={COLORS.textOnDark} /> : null}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </Pressable>
  );
}

export default function RegisterConsentModal({
  visible,
  acceptedDataUse,
  acceptedVisibility,
  onToggleDataUse,
  onToggleVisibility,
  onClose,
  onConfirm,
}: RegisterConsentModalProps) {
  const canConfirm = acceptedDataUse && acceptedVisibility;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Privacy and Consent</Text>
            <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close">
              <Feather name="x" size={20} color={COLORS.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.body}>
              To create your Peerly account, we collect and store your email, name, study profile information, and the
              subjects you can help with or need help with.
            </Text>

            <Text style={styles.body}>
              Your profile details will be visible to other logged-in Peerly users so they can find suitable study
              partners. Your photo is optional.
            </Text>

            <Text style={styles.body}>
              After registration, you can pause your profile visibility or delete your account. After deletion, your
              data will be removed from our system immediately and will no longer be accessible.
            </Text>
          </View>

          <View style={styles.checkSection}>
            <Checkbox
              checked={acceptedDataUse}
              onPress={onToggleDataUse}
              label="I agree that Peerly may store and use my data to create my account and support matching, requests, and messaging."
            />

            <Checkbox
              checked={acceptedVisibility}
              onPress={onToggleVisibility}
              label="I understand that my profile information will be visible to other logged-in users of the platform."
            />
          </View>

          <View style={styles.footer}>
            <View style={styles.footerButtonWrap}>
              <PeerlyButton
                title="Cancel"
                backgroundColor="transparent"
                textColor={COLORS.textPrimary}
                borderColor={COLORS.textMuted}
                style={styles.footerButton}
                textStyle={styles.buttonText}
                onPress={onClose}
                accessibilityLabel="Cancel"
              />
            </View>

            <View style={styles.footerButtonWrap}>
              <PeerlyButton
                title="Create Account"
                backgroundColor={COLORS.buttonGreen}
                textColor={COLORS.textOnDark}
                style={styles.footerButton}
                textStyle={styles.buttonText}
                onPress={onConfirm}
                disabled={!canConfirm}
                accessibilityLabel="Create account"
              />
            </View>
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
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  infoBox: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#D7D2DA',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FAF8FB',
  },
  body: {
    color: COLORS.textPrimary,
    lineHeight: 21,
    fontSize: 14,
  },
  checkSection: {
    marginTop: 14,
  },
  checkboxCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    padding: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: COLORS.textMuted,
    borderRadius: 6,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.buttonGreen,
    borderColor: COLORS.buttonGreen,
  },
  checkboxLabel: {
    flex: 1,
    color: COLORS.textPrimary,
    lineHeight: 20,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 20,
    marginHorizontal: -4,
  },
  footerButtonWrap: {
    flex: 1,
    marginHorizontal: 4,
  },
  footerButton: {
    width: '100%',
  },
  buttonText: {
    textAlign: 'center',
    flex: 1,
  },
});
