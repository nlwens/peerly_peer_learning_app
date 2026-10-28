export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELED' | 'COMPLETED';

export type RequestType = 'REQUEST' | 'OFFER';

export type Request = {
  id: string;
  requester_id: string;
  receiver_id: string;
  subject: string;
  scheduled_datetime: string;
  status: RequestStatus;
  created_at: string;
  type: RequestType;

  requester_completed?: boolean;
  receiver_completed?: boolean;
  study_session_id?: string;

  /**
   * Optional fields returned by backend for the "other user" relative to the
   * currently authenticated user.
   * When missing, UI may fall back to `usersStore` lookups.
   */
  other_user_name?: string;
  other_user_avatar?: string | null;
};
