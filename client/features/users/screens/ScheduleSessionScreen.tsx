import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { COLORS } from '@/constants/theme';
import PeerlyButton from '@/shared/components/ui/PeerlyButton';
import BackButton from '@/shared/components/ui/BackButton';
import { setRequestSchedule, findStudySessionIdByRequest } from '@/features/requests/store/requestsStore';
import { getLoggedInUserId } from '@/shared/store/auth';
import { updateSessionDatetime } from '@/features/studySessions/api/studySessionsApi';
import { isOffline } from '@/shared/utils/networkStatus';

export default function ScheduleSessionScreen() {
  const { requestId } = useLocalSearchParams<{ requestId?: string }>();

  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('00');
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateSchedule = (): { date: Date | null; error: string | null } => {
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const h12 = parseInt(hour, 10);
    const min = parseInt(minute, 10);

    if (!day || !month || !year || !hour || !minute) {
      return {
        date: null,
        error: 'Please fill in all date and time fields.',
      };
    }

    if (isNaN(d) || isNaN(m) || isNaN(y)) {
      return {
        date: null,
        error: 'Please enter a valid date.',
      };
    }

    if (m < 1 || m > 12) {
      return {
        date: null,
        error: 'Month must be between 1 and 12.',
      };
    }

    if (d < 1 || d > 31) {
      return {
        date: null,
        error: 'Day must be between 1 and 31.',
      };
    }

    if (isNaN(h12)) {
      return {
        date: null,
        error: 'Please enter a valid hour.',
      };
    }

    if (h12 < 1 || h12 > 12) {
      return {
        date: null,
        error: 'Hour must be between 1 and 12.',
      };
    }

    if (isNaN(min)) {
      return {
        date: null,
        error: 'Please enter a valid minute.',
      };
    }

    if (min < 0 || min > 59) {
      return {
        date: null,
        error: 'Minute must be between 0 and 59.',
      };
    }

    let h24: number;
    if (ampm === 'AM') {
      h24 = h12 === 12 ? 0 : h12;
    } else {
      h24 = h12 === 12 ? 12 : h12 + 12;
    }

    const date = new Date(y, m - 1, d, h24, min, 0, 0);

    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
      return {
        date: null,
        error: 'Please enter a real calendar date.',
      };
    }

    const now = new Date();
    if (date.getTime() <= now.getTime()) {
      return {
        date: null,
        error: 'Date and time must be in the future.',
      };
    }

    return {
      date,
      error: null,
    };
  };

  const handleHourChange = (text: string) => {
    setError(null);

    const digitsOnly = text.replace(/\D/g, '');

    if (digitsOnly.length > 2) return;

    setHour(digitsOnly);
  };

  const handleMinuteChange = (text: string) => {
    setError(null);

    const digitsOnly = text.replace(/\D/g, '');

    if (digitsOnly.length > 2) return;

    setMinute(digitsOnly);
  };

  const handleSave = async () => {
    if (!requestId) {
      setError('Missing request ID.');
      return;
    }

    const { date, error } = validateSchedule();

    if (error || !date) {
      setError(error);
      return;
    }

    // Check if offline
    if (isOffline()) {
      setError('Internet connection required to save schedule.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const me = getLoggedInUserId();
      if (!me) {
        throw new Error('Not authenticated');
      }

      // Find the study session ID from the request
      const sessionId = await findStudySessionIdByRequest(me, requestId);
      if (!sessionId) {
        throw new Error('Study session not found for this request');
      }

      // Update session on backend
      await updateSessionDatetime(sessionId, date.toISOString());

      // Update local request cache
      await setRequestSchedule(requestId, date.toISOString());

      Alert.alert('Success', 'Study session scheduled for ' + date.toDateString());
      router.back();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to save schedule';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.headerRow}>
          <BackButton to="/requests" />
          <Text style={styles.title}>Schedule Study Session</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.label}>Date</Text>
          <View style={styles.dateRow}>
            <TextInput
              style={styles.dateInput}
              placeholder="DD"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              maxLength={2}
              value={day}
              onChangeText={(val) => {
                setError(null);
                setDay(val.replace(/\D/g, ''));
              }}
            />
            <TextInput
              style={styles.dateInput}
              placeholder="MM"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              maxLength={2}
              value={month}
              onChangeText={(val) => {
                setError(null);
                setMonth(val.replace(/\D/g, ''));
              }}
            />
            <TextInput
              style={[styles.dateInput, { flex: 1.5 }]}
              placeholder="YYYY"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              maxLength={4}
              value={year}
              onChangeText={(val) => {
                setError(null);
                setYear(val.replace(/\D/g, ''));
              }}
            />
          </View>

          <Text style={[styles.label, { marginTop: 24 }]}>Time</Text>
          <View style={styles.timeRow}>
            <TextInput
              style={styles.timeInput}
              placeholder="HH"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              maxLength={2}
              value={hour}
              onChangeText={handleHourChange}
            />
            <Text style={styles.timeSeparator}>:</Text>
            <TextInput
              style={styles.timeInput}
              placeholder="MM"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              maxLength={2}
              value={minute}
              onChangeText={handleMinuteChange}
            />
            <View style={styles.ampmContainer}>
              <PeerlyButton
                title="AM"
                backgroundColor={ampm === 'AM' ? COLORS.buttonYellow : 'transparent'}
                textColor={ampm === 'AM' ? COLORS.textPrimary : COLORS.textSecondary}
                style={styles.ampmButton}
                borderColor={COLORS.searchBar}
                onPress={() => {
                  setError(null);
                  setAmpm('AM');
                }}
                accessibilityLabel="Morning session time"
              />
              <PeerlyButton
                title="PM"
                backgroundColor={ampm === 'PM' ? COLORS.buttonYellow : 'transparent'}
                textColor={ampm === 'PM' ? COLORS.textPrimary : COLORS.textSecondary}
                style={styles.ampmButton}
                borderColor={COLORS.searchBar}
                onPress={() => {
                  setError(null);
                  setAmpm('PM');
                }}
                accessibilityLabel="Afternoon session time"
              />
            </View>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        <View style={styles.bottomButtons}>
          <PeerlyButton
            title={loading ? 'Saving...' : 'Save'}
            backgroundColor={loading ? COLORS.searchBar : COLORS.buttonGreen}
            textColor={COLORS.textOnDark}
            style={styles.bottomButton}
            disabled={loading}
            onPress={handleSave}
            accessibilityLabel="Save session"
          />
          <PeerlyButton
            title="Cancel"
            backgroundColor={COLORS.red}
            textColor={COLORS.textOnDark}
            style={styles.bottomButton}
            disabled={loading}
            onPress={handleCancel}
            accessibilityLabel="Cancel session"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    marginLeft: 50,
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInput: {
    flex: 1,
    marginRight: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.searchBar,
    backgroundColor: COLORS.card,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timeInput: {
    width: 64,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.searchBar,
    backgroundColor: COLORS.card,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 16,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  timeSeparator: {
    marginHorizontal: 6,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  ampmContainer: {
    marginLeft: 12,
    flexDirection: 'row',
  },
  ampmButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  bottomButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  errorText: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.red,
  },
});
