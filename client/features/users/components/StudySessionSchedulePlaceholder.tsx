import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';

type Props = {
  scheduledDatetime?: string;
};

export default function StudySessionSchedulePlaceholder({ scheduledDatetime }: Props) {
  if (!scheduledDatetime) {
    return (
      <View style={styles.scheduleRow}>
        <View style={styles.scheduleField}>
          <Text style={styles.scheduleFieldLabel}>DD</Text>
        </View>
        <View style={styles.scheduleField}>
          <Text style={styles.scheduleFieldLabel}>MM</Text>
        </View>
        <View style={styles.scheduleField}>
          <Text style={styles.scheduleFieldLabel}>YYYY</Text>
        </View>
        <View style={[styles.scheduleField, { flex: 1.2 }]}>
          <Text style={styles.scheduleFieldLabel}>HH:MM AM</Text>
        </View>
      </View>
    );
  }

  const date = new Date(scheduledDatetime);

  if (Number.isNaN(date.getTime())) {
    return (
      <View style={styles.invalidBox}>
        <Text style={styles.scheduleFieldLabel}>Invalid schedule</Text>
      </View>
    );
  }

  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = String(date.getFullYear());

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const meridiem = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  if (hours === 0) hours = 12;

  const hh = String(hours).padStart(2, '0');

  return (
    <View style={styles.scheduleRow}>
      <View style={styles.scheduleField}>
        <Text style={styles.scheduleValue}>{dd}</Text>
      </View>
      <View style={styles.scheduleField}>
        <Text style={styles.scheduleValue}>{mm}</Text>
      </View>
      <View style={styles.scheduleField}>
        <Text style={styles.scheduleValue}>{yyyy}</Text>
      </View>
      <View style={[styles.scheduleField, { flex: 1.2 }]}>
        <Text style={styles.scheduleValue}>{`${hh}:${minutes} ${meridiem}`}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  scheduleField: {
    flex: 0.8,
    borderWidth: 1,
    borderColor: COLORS.searchBar,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  scheduleFieldLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  scheduleValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  invalidBox: {
    borderWidth: 1,
    borderColor: COLORS.searchBar,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
});
