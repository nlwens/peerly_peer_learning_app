import { View, StyleSheet } from 'react-native';
import PeerlyButton from '@/shared/components/ui/PeerlyButton';
import { COLORS } from '@/constants/theme';

export type FilterType = 'GOOD_AT' | 'NEED_HELP' | null;

type Props = {
  value: FilterType;
  onChange: (value: FilterType) => void;
};

export default function FilterToggle({ value, onChange }: Props) {
  const isGoodAtActive = value === 'GOOD_AT';
  const isNeedHelpActive = value === 'NEED_HELP';

  return (
    <View style={styles.row}>
      <PeerlyButton
        title="Good at"
        backgroundColor={isGoodAtActive ? COLORS.buttonGreenPressed : COLORS.buttonGreen}
        textColor={COLORS.textOnDark}
        style={styles.button}
        onPress={() => onChange(isGoodAtActive ? null : 'GOOD_AT')}
        accessibilityLabel="Filter by skills I'm good at"
      />

      <View style={{ width: 12 }} />

      <PeerlyButton
        title="Need help"
        backgroundColor={isNeedHelpActive ? COLORS.buttonYellowPressed : COLORS.buttonYellow}
        textColor={COLORS.textPrimary}
        style={styles.button}
        onPress={() => onChange(isNeedHelpActive ? null : 'NEED_HELP')}
        accessibilityLabel="Filter by skills I need help with"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
  },
});
