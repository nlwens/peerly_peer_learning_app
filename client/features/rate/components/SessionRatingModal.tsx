import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import { COLORS } from '@/constants/theme';
import PeerlyButton from '@/shared/components/ui/PeerlyButton';

type Props = {
  visible: boolean;
  otherUserName: string;
  rating: number;
  onChangeRating: (value: number) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export default function SessionRatingModal({
  visible,
  otherUserName,
  rating,
  onChangeRating,
  onSubmit,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.heading}>Session completed successfully</Text>

          <View style={styles.checkWrap}>
            <Feather name="check-circle" size={58} color={COLORS.buttonGreen} />
          </View>

          <Text style={styles.prompt}>How would you rate: {otherUserName}</Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((value) => {
              const selected = value <= rating;
              return (
                <Pressable
                  key={value}
                  onPress={() => onChangeRating(value)}
                  hitSlop={8}
                  style={styles.starHitbox}
                  accessibilityRole="button"
                  accessibilityLabel={`Rate ${value} star${value > 1 ? 's' : ''}`}
                >
                  <MaterialIcons
                    name={selected ? 'star' : 'star-border'}
                    size={34}
                    color={selected ? COLORS.buttonYellow : COLORS.textMuted}
                  />
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.ratingText}>
            {rating > 0 ? `Selected rating: ${rating}/5` : 'Choose a rating from 1 to 5'}
          </Text>

          <View style={styles.footer}>
            <PeerlyButton
              title="Not Now"
              backgroundColor="transparent"
              textColor={COLORS.textPrimary}
              borderColor={COLORS.textMuted}
              style={styles.footerButton}
              onPress={onClose}
              accessibilityLabel="Not now"
            />
            <PeerlyButton
              title="Submit"
              backgroundColor={COLORS.buttonGreen}
              textColor={COLORS.textOnDark}
              style={styles.footerButton}
              onPress={onSubmit}
              disabled={rating < 1}
              accessibilityLabel="Submit rating"
            />
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
  heading: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  checkWrap: {
    alignItems: 'center',
    marginTop: 14,
  },
  prompt: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  starsRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starHitbox: {
    marginHorizontal: 4,
  },
  ratingText: {
    marginTop: 8,
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 13,
  },
  footer: {
    marginTop: 18,
    flexDirection: 'row',
  },
  footerButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});
