import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useUserProfileCache } from '../store/userProfileCache';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import ProfileHeader from '../components/ProfileHeader';
import ProfileSection from '../components/ProfileSection';
import TagList from '../components/TagList';
import AboutText from '../components/AboutText';
import PeerlyButton from '@/shared/components/ui/PeerlyButton';
import { MaterialIcons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import { logout, getLoggedInUserId, getAccessToken } from '@/shared/store/auth';
import { router } from 'expo-router';
import {
  setRequestStatus,
  completeSessionOnBackend,
  deleteRequest,
  useRequests,
  hasPendingBetween,
  createRequestOnBackend,
  isOutOfTokensError,
} from '@/features/requests/store/requestsStore';
import { fetchUserById } from '@/features/users/api/homeUsers';
import { submitSessionRating } from '@/features/rate/helpers/sessionRating';
import type { User } from '@/features/users/data/types';
import { setEditProfilePrefill } from '../store/editProfilePrefill';
import type { RequestStatus } from '@/features/requests/data/types';
import StudySessionSchedulePlaceholder from '../components/StudySessionSchedulePlaceholder';
import SubjectPickerModal from '@/features/requests/components/SubjectPickerModal';
import OutOfTokensModal from '@/features/requests/components/OutOfTokensModal';
import { requireAuth } from '@/shared/utils/requireAuth';
import SessionRatingModal from '@/features/rate/components/SessionRatingModal';

type RequestContext = 'incoming' | 'outgoing' | 'active' | 'completed' | 'history' | undefined;

type Props = {
  userId: string;
  mode?: 'other' | 'self';
  requestContext?: RequestContext;
  requestId?: string;
};

export default function UserProfileScreen({ userId, mode = 'other', requestContext, requestId }: Props) {
  const insets = useSafeAreaInsets();
  const me = getLoggedInUserId();
  const accessToken = getAccessToken();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Use cache hook to get initial data
  const cachedProfile = useUserProfileCache(userId);

  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [pendingType, setPendingType] = useState<'REQUEST' | 'OFFER' | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [outOfTokensModalOpen, setOutOfTokensModalOpen] = useState(false);
  const [outOfTokensModalTitle, setOutOfTokensModalTitle] = useState('Unable to send request');

  const requests = useRequests();

  useEffect(() => {
    // Only redirect if NO session at all (not logged in)
    if (!me) {
      router.replace('/(auth)/login');
    }
    // accessToken missing is OK for reading cached data offline
  }, [me]);

  const lastFetchedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    lastFetchedUserIdRef.current = null;
  }, [userId]);

  // Show cached profile immediately
  useEffect(() => {
    if (cachedProfile) {
      setUser(cachedProfile);
    }
  }, [cachedProfile]);

  const loadProfile = useCallback(
    async (mode: 'full' | 'pull' | 'focus' = 'full') => {
      const silent = mode === 'focus' && lastFetchedUserIdRef.current === userId;

      if (mode === 'pull') {
        setRefreshing(true);
        setLoadError(null);
      } else if (!silent) {
        setLoadError(null);
        setLoading(true);
      }

      try {
        // Fetch from network (cache-aware internally)
        const u = await fetchUserById(userId);
        setUser(u);
        setLoadError(null);
        lastFetchedUserIdRef.current = userId;
      } catch (e) {
        if (!silent) {
          setLoadError(e instanceof Error ? e.message : 'Could not load profile');
          // Don't clear user on error if we have cache visible
          if (!user) {
            setUser(null);
          }
          lastFetchedUserIdRef.current = null;
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId, user],
  );

  useFocusEffect(
    useCallback(() => {
      if (mode === 'self' && !me) return;

      void loadProfile('focus');
    }, [loadProfile, mode, me]),
  );

  const onRefresh = useCallback(() => {
    if (mode === 'self' && !me) return;

    void loadProfile('pull');
  }, [loadProfile, mode, me]);

  const isSelf = mode === 'self';

  const isIncomingView = !isSelf && requestContext === 'incoming';
  const isActiveView = !isSelf && requestContext === 'active';
  const isOutgoingView = !isSelf && requestContext === 'outgoing';
  const isCompletedView = !isSelf && requestContext === 'completed';
  const isHistoryView = !isSelf && requestContext === 'history';

  const bottomBarHeight = useMemo(() => {
    if (isSelf) return 88;
    if (isActiveView) return 140;
    if (isIncomingView) return 88;
    if (isOutgoingView) return 88;
    if (isCompletedView) return 110;
    if (isHistoryView) return 88;
    return 88;
  }, [isSelf, isActiveView, isIncomingView, isOutgoingView, isCompletedView, isHistoryView]);

  const withRequest = async (status: RequestStatus, cb?: () => void) => {
    if (!requestId || !me) return;
    try {
      await setRequestStatus(requestId, status);
      cb?.();
    } catch (e) {
      if (isOutOfTokensError(e)) {
        setOutOfTokensModalTitle(status === 'ACCEPTED' ? 'Unable to accept' : 'Unable to update');
        setOutOfTokensModalOpen(true);
        return;
      }
      Alert.alert('Failed to update', e instanceof Error ? e.message : 'Could not update request.');
    }
  };

  const subjectOptions = useMemo(() => {
    if (!user || !pendingType) return [];
    return pendingType === 'REQUEST' ? user.strengths : user.needs_help_with;
  }, [pendingType, user]);

  const currentRequest = useMemo(() => {
    if (!requestId) return null;
    return requests.find((r) => r.id === requestId) ?? null;
  }, [requests, requestId]);

  const isCurrentUserRequester = currentRequest?.requester_id === me;
  const currentUserCompleted = currentRequest
    ? isCurrentUserRequester
      ? Boolean(currentRequest.requester_completed)
      : Boolean(currentRequest.receiver_completed)
    : false;

  const bottomPad = 12 + insets.bottom;

  const handleChat = () => {
    const loggedInUser = requireAuth();
    if (!loggedInUser) return;

    router.push({
      pathname: '/(protected)/chat/[id]',
      params: { id: userId },
    });
  };

  const handleAccept = () => {
    const loggedInUser = requireAuth();
    if (!loggedInUser) return;
    void withRequest('ACCEPTED', () => router.back());
  };

  const handleDecline = () => void withRequest('DECLINED', () => router.back());
  const handleCancel = () => void withRequest('CANCELED', () => router.back());

  const handleDelete = async () => {
    if (!requestId) return;
    await deleteRequest(requestId);
    router.back();
  };

  const handleComplete = async () => {
    if (!requestId) return;
    if (currentUserCompleted) return;
    await completeSessionOnBackend(requestId);
    setSelectedRating(0);
    setRatingModalOpen(true);
  };

  const closeRatingModal = () => {
    setRatingModalOpen(false);
    router.back();
  };

  const submitRating = async () => {
    if (selectedRating < 1) return;
    if (!me) return;
    if (!requestId) {
      Alert.alert('Rating failed', 'Missing request reference for rating.');
      return;
    }

    try {
      await submitSessionRating({
        raterId: me,
        requestId,
        rateeId: userId,
        stars: selectedRating,
        studySessionId: currentRequest?.study_session_id,
      });

      await loadProfile('pull');

      const ratedUserName = user?.name ?? 'this user';
      setRatingModalOpen(false);
      Alert.alert('Thanks for rating', `You rated ${ratedUserName} ${selectedRating}/5.`);
      router.back();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not submit rating';
      Alert.alert('Rating failed', message);
    }
  };

  const handleSchedule = () => {
    if (!requestId) return;
    router.push({
      pathname: '/requests/schedule-session',
      params: { requestId },
    });
  };

  const handleSend = async (type: 'REQUEST' | 'OFFER') => {
    if (!me) {
      router.push('/login');
      return;
    }

    if (me === userId) return; // can't request yourself

    // optional duplicate prevention
    if (hasPendingBetween?.(me, userId, type)) {
      Alert.alert('Already sent', 'You already have a pending invitation with this user.');
      return;
    }

    try {
      await createRequestOnBackend({
        requesterId: me,
        receiverId: userId,
        type,
        subject: 'General', // later you can let user choose
      });

      // Take sender to Requests tab (optional but makes it feel like it worked)
      router.push('/requests');
    } catch (e) {
      if (isOutOfTokensError(e)) {
        setSubjectModalOpen(false);
        setOutOfTokensModalTitle('Unable to send request');
        setOutOfTokensModalOpen(true);
        return;
      }
      const message = e instanceof Error ? e.message : String(e ?? '');
      Alert.alert('Failed to send', message || 'Could not send request.');
    }
  };

  const handleShareProfile = async () => {
    if (!user) return;

    try {
      if (!user) return;
      const profileUrl = `https://google.com`;

      await Share.share({
        message: `Hey! Connect with me on Peerly to exchange academic knowledge.\n\n${profileUrl}`,
        title: `Peerly profile - ${user.name}`,
      });
    } catch (error) {
      console.log('Share error', error);
    }
  };

  if (!me) {
    return null;
  }

  if (loading && !user) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]} edges={['top']}>
        <ActivityIndicator size="large" color={COLORS.textMuted} />
      </SafeAreaView>
    );
  }

  if (loadError && !user) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]} edges={['top']}>
        <Text style={styles.errorText}>{loadError}</Text>
        <PeerlyButton
          title="Go back to Login"
          backgroundColor={COLORS.buttonGreen}
          textColor={COLORS.textOnDark}
          onPress={() => {
            router.push('/login');
          }}
          style={{ marginTop: 16, width: 160 }}
          accessibilityLabel="Go back to login"
        />
      </SafeAreaView>
    );
  }

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingBottom: bottomBarHeight + bottomPad + 20,
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <ProfileHeader user={user} showBack={!isSelf} />

          <ProfileSection title="About">
            <AboutText text={user.description} />
          </ProfileSection>

          <ProfileSection title="Strengths">
            <TagList items={user.strengths} />
          </ProfileSection>

          <ProfileSection title="Needs Help With">
            <TagList items={user.needs_help_with} />
          </ProfileSection>

          {(isActiveView || isCompletedView) && (
            <ProfileSection title="Study Session Schedule">
              <StudySessionSchedulePlaceholder scheduledDatetime={currentRequest?.scheduled_datetime} />
            </ProfileSection>
          )}

          {isSelf && (
            <ProfileSection title={`Token(s): ${user.token_balance}`}>
              <View />
            </ProfileSection>
          )}
        </ScrollView>

        {isSelf && (
          <View style={[styles.selfActions, { paddingBottom: 20 }]}>
            <PeerlyButton
              title="Share"
              backgroundColor="transparent"
              textColor={COLORS.textPrimary}
              borderColor={COLORS.textMuted}
              style={styles.thirdButton}
              icon={<Feather name="share" size={16} color={COLORS.textPrimary} />}
              onPress={handleShareProfile}
              accessibilityLabel="Share profile"
            />
            <PeerlyButton
              title="Edit"
              backgroundColor="transparent"
              textColor={COLORS.textPrimary}
              borderColor={COLORS.textMuted}
              style={styles.halfButton}
              icon={<Feather name="edit-2" size={16} color={COLORS.textPrimary} />}
              onPress={() => {
                setEditProfilePrefill(user);
                router.push('/profile/edit');
              }}
              accessibilityLabel="Edit profile"
            />
            <PeerlyButton
              title="Logout"
              backgroundColor="transparent"
              textColor={COLORS.red}
              borderColor={COLORS.red}
              style={styles.halfButton}
              icon={<Feather name="log-out" size={16} color={COLORS.red} />}
              onPress={() => {
                logout();
                router.replace('/(tabs)/home');
              }}
              accessibilityLabel="Log out"
            />
          </View>
        )}

        {!isSelf && isIncomingView && (
          <View style={[styles.bottomActions, { paddingBottom: bottomPad }]}>
            <View style={styles.actionsRow}>
              <PeerlyButton
                title="Accept"
                backgroundColor={COLORS.buttonGreen}
                textColor={COLORS.textOnDark}
                style={styles.actionButton}
                onPress={handleAccept}
                accessibilityLabel="Accept request"
              />
              <PeerlyButton
                title="Decline"
                backgroundColor={COLORS.red}
                textColor={COLORS.textOnDark}
                style={styles.actionButton}
                onPress={handleDecline}
                accessibilityLabel="Decline request"
              />
            </View>
          </View>
        )}

        {!isSelf && isActiveView && !isIncomingView && (
          <View style={[styles.bottomActions, { paddingBottom: bottomPad }]}>
            <View style={styles.actionsRow}>
              <PeerlyButton
                title="Chat"
                backgroundColor={COLORS.buttonBlack}
                textColor={COLORS.textOnDark}
                style={styles.actionButton}
                icon={<MaterialIcons name="chat-bubble-outline" size={14} color={COLORS.textOnDark} />}
                onPress={handleChat}
                accessibilityLabel="Open chat"
              />
              <PeerlyButton
                title="Schedule"
                backgroundColor={COLORS.buttonYellow}
                textColor={COLORS.textPrimary}
                style={styles.actionButton}
                onPress={handleSchedule}
                accessibilityLabel="Schedule session"
              />
              <PeerlyButton
                title="Cancel"
                backgroundColor={COLORS.red}
                textColor={COLORS.textOnDark}
                style={styles.actionButton}
                onPress={handleCancel}
                accessibilityLabel="Cancel request"
              />
            </View>

            <PeerlyButton
              title={currentUserCompleted ? "Waiting for other user's confirmation" : 'Complete the Session'}
              backgroundColor={currentUserCompleted ? COLORS.searchBar : COLORS.buttonGreen}
              textColor={currentUserCompleted ? COLORS.textMuted : COLORS.textOnDark}
              style={styles.completeButton}
              disabled={currentUserCompleted}
              onPress={handleComplete}
              accessibilityLabel="Complete the session"
            />
          </View>
        )}

        {!isSelf && isOutgoingView && !isIncomingView && !isActiveView && (
          <View style={[styles.bottomActions, { paddingBottom: bottomPad }]}>
            <View style={styles.actionsRow}>
              <PeerlyButton
                title="Cancel"
                backgroundColor={COLORS.red}
                textColor={COLORS.textOnDark}
                style={styles.actionButton}
                onPress={handleCancel}
                accessibilityLabel="Cancel session"
              />
            </View>
          </View>
        )}

        {!isSelf && isCompletedView && !isIncomingView && !isActiveView && !isOutgoingView && (
          <View style={[styles.bottomActions, { paddingBottom: bottomPad }]}>
            <View style={styles.actionsRow}>
              <PeerlyButton
                title="Schedule"
                backgroundColor={COLORS.searchBar}
                textColor={COLORS.textMuted}
                style={styles.actionButton}
                disabled
                accessibilityLabel="Offer help"
              />
              <PeerlyButton
                title="Cancel"
                backgroundColor={COLORS.searchBar}
                textColor={COLORS.textMuted}
                style={styles.actionButton}
                disabled
                accessibilityLabel="Request help"
              />
            </View>
            <Text style={styles.completedText}>COMPLETED ✓</Text>
          </View>
        )}

        {!isSelf && isHistoryView && !isIncomingView && !isActiveView && !isOutgoingView && !isCompletedView && (
          <View style={[styles.bottomActions, { paddingBottom: bottomPad }]}>
            <View style={styles.actionsRow}>
              <PeerlyButton
                title="Delete"
                backgroundColor={COLORS.red}
                textColor={COLORS.textOnDark}
                style={styles.actionButton}
                onPress={handleDelete}
                accessibilityLabel="Delete request"
              />
            </View>
          </View>
        )}

        {!isSelf && !isIncomingView && !isActiveView && !isOutgoingView && !isCompletedView && !isHistoryView && (
          <View style={[styles.bottomActions, { paddingBottom: bottomPad }]}>
            <View style={styles.actionsRow}>
              <PeerlyButton
                title="Request"
                backgroundColor={COLORS.buttonYellow}
                textColor={COLORS.textPrimary}
                style={styles.actionButton}
                onPress={() => {
                  const loggedInUser = requireAuth();
                  if (!loggedInUser) return;
                  setPendingType('REQUEST');
                  setSelectedSubject(null);
                  setSubjectModalOpen(true);
                }}
                accessibilityLabel="Request help"
              />
              <PeerlyButton
                title="Offer"
                backgroundColor={COLORS.buttonGreen}
                textColor={COLORS.textOnDark}
                style={styles.actionButton}
                onPress={() => {
                  const loggedInUser = requireAuth();
                  if (!loggedInUser) return;
                  setPendingType('OFFER');
                  setSelectedSubject(null);
                  setSubjectModalOpen(true);
                }}
                accessibilityLabel="Offer help"
              />
            </View>
          </View>
        )}
      </View>

      <SubjectPickerModal
        visible={subjectModalOpen}
        title={pendingType === 'REQUEST' ? 'Pick a subject to request help with' : 'Pick a subject to offer help with'}
        options={subjectOptions}
        selected={selectedSubject}
        onSelect={setSelectedSubject}
        onClose={() => setSubjectModalOpen(false)}
        confirmLabel={pendingType === 'REQUEST' ? 'Send Request' : 'Send Offer'}
        onConfirm={async () => {
          const loggedInUser = getLoggedInUserId();
          if (!loggedInUser || !pendingType || !selectedSubject) return;

          if (loggedInUser === userId) return;

          try {
            await createRequestOnBackend({
              requesterId: loggedInUser,
              receiverId: userId,
              type: pendingType,
              subject: selectedSubject,
            });

            setSubjectModalOpen(false);
            router.push('/requests');
          } catch (e) {
            if (isOutOfTokensError(e)) {
              setSubjectModalOpen(false);
              setOutOfTokensModalTitle('Unable to send request');
              setOutOfTokensModalOpen(true);
              return;
            }
            const message = e instanceof Error ? e.message : String(e ?? '');
            Alert.alert('Failed to send', message || 'Could not send request.');
          }
        }}
      />

      <SessionRatingModal
        visible={ratingModalOpen}
        otherUserName={user.name}
        rating={selectedRating}
        onChangeRating={setSelectedRating}
        onSubmit={submitRating}
        onClose={closeRatingModal}
      />

      <OutOfTokensModal
        visible={outOfTokensModalOpen}
        onClose={() => setOutOfTokensModalOpen(false)}
        title={outOfTokensModalTitle}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  errorText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 15,
  },

  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: COLORS.background,
  },

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  actionButton: {
    flex: 1,
    marginHorizontal: 2.5,
  },

  completeButton: {
    marginTop: 8,
  },

  completedText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.buttonGreen,
  },

  selfActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: COLORS.background,
  },

  halfButton: {
    flex: 1,
    marginHorizontal: 6,
  },

  thirdButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});
