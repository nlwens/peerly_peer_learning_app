import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import RequestCard from '../components/RequestCard';
import RequestSection from '../components/RequestSection';
import {
  useRequests,
  setRequestStatus,
  deleteRequest,
  completeSessionOnBackend,
  isOutOfTokensError,
} from '../store/requestsStore';
import type { Request, RequestStatus } from '../data/types';
import { getLoggedInUserId } from '@/shared/store/auth';
import OutOfTokensModal from '../components/OutOfTokensModal';

export default function RequestsScreen() {
  const requests = useRequests();
  const [outOfTokensOpen, setOutOfTokensOpen] = useState(false);
  const [outOfTokensTitle, setOutOfTokensTitle] = useState('Unable to send request');

  const currentUserId = getLoggedInUserId();
  if (!currentUserId) return null;

  const handleChangeStatus = async (id: string, status: RequestStatus) => {
    try {
      await setRequestStatus(id, status);
    } catch (e) {
      if (isOutOfTokensError(e)) {
        setOutOfTokensTitle(status === 'ACCEPTED' ? 'Unable to accept' : 'Unable to update request');
        setOutOfTokensOpen(true);
        return;
      }
      Alert.alert('Failed to update', e instanceof Error ? e.message : 'Could not update request.');
    }
  };

  const isInvolved = (r: Request) => r.requester_id === currentUserId || r.receiver_id === currentUserId;

  const activeSessions = requests.filter((r) => r.status === 'ACCEPTED' && isInvolved(r));
  const incoming = requests.filter((r) => r.status === 'PENDING' && r.receiver_id === currentUserId);
  const outgoing = requests.filter((r) => r.status === 'PENDING' && r.requester_id === currentUserId);
  const completed = requests.filter((r) => r.status === 'COMPLETED' && isInvolved(r));
  const canceledOrDeclined = requests.filter((r) => ['DECLINED', 'CANCELED'].includes(r.status) && isInvolved(r));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerBlock}>
        <Text style={styles.pageTitle}>Requests & Offers</Text>
        <Text style={styles.pageSubtitle}>Manage incoming invites, active sessions, and completed help exchanges.</Text>
        <View style={styles.headerDivider} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <RequestSection title="Active Sessions" count={activeSessions.length}>
          {activeSessions.map((r) => (
            <RequestCard
              key={r.id}
              request={r}
              currentUserId={currentUserId}
              context="active"
              onChangeStatus={handleChangeStatus}
              onCompleteSession={completeSessionOnBackend}
              onDelete={deleteRequest}
            />
          ))}
        </RequestSection>

        <RequestSection title="Incoming" count={incoming.length}>
          {incoming.map((r) => (
            <RequestCard
              key={r.id}
              request={r}
              currentUserId={currentUserId}
              context="incoming"
              onChangeStatus={handleChangeStatus}
              onDelete={deleteRequest}
            />
          ))}
        </RequestSection>

        <RequestSection title="Outgoing" count={outgoing.length}>
          {outgoing.map((r) => (
            <RequestCard
              key={r.id}
              request={r}
              currentUserId={currentUserId}
              context="outgoing"
              onChangeStatus={handleChangeStatus}
              onDelete={deleteRequest}
            />
          ))}
        </RequestSection>

        <RequestSection title="Completed Sessions" count={completed.length}>
          {completed.map((r) => (
            <RequestCard
              key={r.id}
              request={r}
              currentUserId={currentUserId}
              context="completed"
              onChangeStatus={handleChangeStatus}
              onDelete={deleteRequest}
            />
          ))}
        </RequestSection>

        <RequestSection title="Canceled / Declined" count={canceledOrDeclined.length}>
          {canceledOrDeclined.map((r) => (
            <RequestCard
              key={r.id}
              request={r}
              currentUserId={currentUserId}
              context="history"
              onChangeStatus={handleChangeStatus}
              onDelete={deleteRequest}
            />
          ))}
        </RequestSection>
      </ScrollView>

      <OutOfTokensModal visible={outOfTokensOpen} onClose={() => setOutOfTokensOpen(false)} title={outOfTokensTitle} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  headerBlock: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    marginBottom: 8,
    alignItems: 'center',
  },

  headerDivider: {
    marginTop: 14,
    width: '72%',
    height: 1,
    backgroundColor: '#aaaaaa',
  },

  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  pageSubtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
