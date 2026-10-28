import { useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Alert } from 'react-native';
import { COLORS } from '@/constants/theme';
import type { Request, RequestStatus } from '../data/types';
import { findUser } from '@/features/users/store/usersStore';
import { submitSessionRating } from '@/features/rate/helpers/sessionRating';
import RequestActionsMenu, { RequestAction } from './RequestActionsMenu';
import { router } from 'expo-router';
import SessionRatingModal from '@/features/rate/components/SessionRatingModal';
import { requireAuth } from '@/shared/utils/requireAuth';

type CardContext = 'active' | 'incoming' | 'outgoing' | 'completed' | 'history';

type Props = {
  request: Request;
  currentUserId: string;
  context: CardContext;
  onChangeStatus: (id: string, status: RequestStatus) => void | Promise<void>;
  onCompleteSession?: (id: string) => Promise<void>;
  onDelete?: (id: string) => void;
};

export default function RequestCard({
  request,
  currentUserId,
  context,
  onChangeStatus,
  onCompleteSession,
  onDelete,
}: Props) {
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [completeOnModalAction, setCompleteOnModalAction] = useState(false);

  const isRequester = request.requester_id === currentUserId;
  const currentUserCompleted = isRequester ? Boolean(request.requester_completed) : Boolean(request.receiver_completed);
  const peerCompleted = isRequester ? Boolean(request.receiver_completed) : Boolean(request.requester_completed);
  const otherUserId = isRequester ? request.receiver_id : request.requester_id;
  const otherUser = findUser(otherUserId);
  const PLACEHOLDER_AVATAR = 'https://via.placeholder.com/120/cccccc/666666?text=%3F';

  const displayName = otherUser?.name ?? request.other_user_name ?? 'Unknown';
  const avatarUrl = otherUser?.profile_image_url ?? request.other_user_avatar ?? PLACEHOLDER_AVATAR;

  const { status, subject, type } = request;
  const isOffer = type === 'OFFER';

  // subtitle text
  let subtitleText = '';

  if (status === 'ACCEPTED') {
    if (currentUserCompleted && !peerCompleted) {
      subtitleText = `Waiting for peer confirmation: ${subject}`;
    } else if (!currentUserCompleted && peerCompleted) {
      subtitleText = `Peer completed. Please confirm: ${subject}`;
    } else {
      subtitleText = `Active session: ${subject}`;
    }
  } else if (status === 'COMPLETED') {
    subtitleText = `Completed: ${subject}`;
  } else if (status === 'CANCELED') {
    if (isRequester) {
      if (isOffer) {
        subtitleText = `You canceled your offer to help with: ${subject}`;
      } else {
        subtitleText = `You canceled your request for help with: ${subject}`;
      }
    } else {
      if (isOffer) {
        subtitleText = `They canceled their offer to help with: ${subject}`;
      } else {
        subtitleText = `They canceled their request for help with: ${subject}`;
      }
    }
  } else if (status === 'DECLINED') {
    if (isRequester) {
      if (isOffer) {
        subtitleText = `They declined your offer to help with: ${subject}`;
      } else {
        subtitleText = `They declined your request for help with: ${subject}`;
      }
    } else {
      if (isOffer) {
        subtitleText = `You declined their offer to help with: ${subject}`;
      } else {
        subtitleText = `You declined their request for help with: ${subject}`;
      }
    }
  } else {
    // PENDING
    if (isRequester) {
      if (isOffer) {
        subtitleText = `Offer to help with: ${subject}`;
      } else {
        subtitleText = `Request for help with: ${subject}`;
      }
    } else {
      if (isOffer) {
        subtitleText = `Offer to help with: ${subject}`;
      } else {
        subtitleText = `Requested help for: ${subject}`;
      }
    }
  }

  // actions for dropdown
  const actions: RequestAction[] = [];

  const handleChat = () => {
    const loggedInUser = requireAuth();
    if (!loggedInUser) return;

    router.push({
      pathname: '/(protected)/chat/[id]',
      params: { id: otherUserId },
    });
  };

  const handleAccept = () => {
    void Promise.resolve(onChangeStatus(request.id, 'ACCEPTED'));
  };

  const handleDecline = () => {
    void Promise.resolve(onChangeStatus(request.id, 'DECLINED'));
  };

  const handleCancel = () => {
    void Promise.resolve(onChangeStatus(request.id, 'CANCELED'));
  };

  const handleDelete = () => {
    if (onDelete) onDelete(request.id);
  };

  const handleCardPress = () => {
    // Navigate to that user's profile; pass context + requestId
    router.push({
      pathname: '/users/[id]',
      params: {
        id: otherUserId,
        context, // 'incoming' | 'outgoing' | ...
        requestId: request.id,
      },
    });
  };

  // Incoming section: PENDING → Chat, Accept, Decline
  if (context === 'incoming' && status === 'PENDING') {
    actions.push({ label: 'Accept', onPress: handleAccept }, { label: 'Decline', onPress: handleDecline });
  }

  // Outgoing section: PENDING → Chat, Cancel
  if (context === 'outgoing' && status === 'PENDING') {
    actions.push({ label: 'Cancel', onPress: handleCancel });
  }

  const handleComplete = async () => {
    if (currentUserCompleted) return;

    if (onCompleteSession) {
      // When peer already completed, completing now usually moves the card out of
      // Active immediately. Open modal first and perform completion in modal action.
      if (peerCompleted) {
        setCompleteOnModalAction(true);
        setSelectedRating(0);
        setRatingModalOpen(true);
        return;
      }

      try {
        await onCompleteSession(request.id);
        setCompleteOnModalAction(false);
        setSelectedRating(0);
        setRatingModalOpen(true);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Could not complete session';
        Alert.alert('Complete failed', message);
      }
      return;
    }

    void Promise.resolve(onChangeStatus(request.id, 'COMPLETED'));
  };

  const closeRatingModal = () => {
    if (completeOnModalAction && onCompleteSession) {
      void onCompleteSession(request.id).catch((e) => {
        const message = e instanceof Error ? e.message : 'Could not complete session';
        Alert.alert('Complete failed', message);
      });
    }

    setCompleteOnModalAction(false);
    setRatingModalOpen(false);
  };

  const submitRating = async () => {
    if (selectedRating < 1) return;

    try {
      if (completeOnModalAction && onCompleteSession) {
        await onCompleteSession(request.id);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not complete session';
      Alert.alert('Complete failed', message);
      return;
    }

    try {
      await submitSessionRating({
        raterId: currentUserId,
        requestId: request.id,
        rateeId: otherUserId,
        stars: selectedRating,
        studySessionId: request.study_session_id,
      });

      setCompleteOnModalAction(false);
      setRatingModalOpen(false);
      Alert.alert('Thanks for rating', `You rated ${displayName} ${selectedRating}/5.`);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not submit rating';
      Alert.alert('Rating failed', message);
    }
  };

  // Active Sessions: ACCEPTED → Chat, Cancel, COMPLETE
  if (context === 'active' && status === 'ACCEPTED') {
    actions.push(
      { label: 'Chat', onPress: handleChat },
      {
        label: currentUserCompleted ? "Waiting for other user's confirmation" : 'Complete',
        onPress: () => {
          void handleComplete();
        },
        disabled: currentUserCompleted,
      },
      { label: 'Cancel', onPress: handleCancel },
    );
  }

  // Completed Sessions: COMPLETED → Chat, Delete
  if (context === 'completed' && status === 'COMPLETED') {
    actions.push({ label: 'Delete', onPress: handleDelete });
  }

  // Canceled / Declined section: → Delete
  if (context === 'history' && (status === 'CANCELED' || status === 'DECLINED')) {
    actions.push({ label: 'Delete', onPress: handleDelete });
  }

  return (
    <Pressable
      style={styles.card}
      onPress={handleCardPress}
      accessibilityRole="button"
      accessibilityLabel={`View request from ${displayName}`}
    >
      <Image source={{ uri: avatarUrl }} style={styles.avatar} accessibilityLabel={`Profile photo of ${displayName}`} />

      <View style={styles.content}>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.subtitle}>{subtitleText}</Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.status, getStatusStyle(status)]}>{status}</Text>
        <RequestActionsMenu actions={actions} />
      </View>

      <SessionRatingModal
        visible={ratingModalOpen}
        otherUserName={displayName}
        rating={selectedRating}
        onChangeRating={setSelectedRating}
        onSubmit={submitRating}
        onClose={closeRatingModal}
      />
    </Pressable>
  );
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'ACCEPTED':
      return { color: COLORS.buttonYellow };
    case 'PENDING':
      return { color: COLORS.textSecondary };
    case 'DECLINED':
      return { color: COLORS.red };
    case 'CANCELED':
      return { color: COLORS.textMuted };
    case 'COMPLETED':
      return { color: COLORS.buttonGreen };
    default:
      return { color: COLORS.textPrimary };
  }
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  avatar: { width: 52, height: 52, borderRadius: 12, marginRight: 14 },
  content: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  right: {
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  status: {
    fontSize: 13,
    fontWeight: '600',
  },
});
