import { findStudySessionIdByRequest } from '@/features/requests/store/requestsStore';
import { submitUserRating } from '@/features/users/api/homeUsers';

type SubmitSessionRatingParams = {
  raterId: string;
  requestId: string;
  rateeId: string;
  stars: number;
  studySessionId?: string | null;
};

export async function submitSessionRating({
  raterId,
  requestId,
  rateeId,
  stars,
  studySessionId,
}: SubmitSessionRatingParams): Promise<void> {
  const resolvedStudySessionId = studySessionId ?? (await findStudySessionIdByRequest(raterId, requestId));

  if (!resolvedStudySessionId) {
    throw new Error('Session id not found yet. Please try again in a moment.');
  }

  await submitUserRating(raterId, {
    study_session_id: resolvedStudySessionId,
    ratee_id: rateeId,
    stars,
  });
}
