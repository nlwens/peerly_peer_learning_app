import { apiFetch } from '@/shared/api/client';
import { getAccessToken, getLoggedInUserId } from '@/shared/store/auth';

export interface StudySession {
  id: string;
  request_id?: string;
  scheduled_datetime?: string;
  created_at?: string;
  updated_at?: string;
  requester_completed?: boolean;
  receiver_completed?: boolean;
}

/**
 * Fetch all study sessions for the current user
 */
export async function fetchUserSessions(): Promise<StudySession[]> {
  const userId = getLoggedInUserId();
  if (!userId) {
    throw new Error('Not authenticated');
  }

  const res = await apiFetch(`/users/${encodeURIComponent(userId)}/sessions`);
  if (!res.ok) {
    throw new Error(`Failed to load sessions (${res.status})`);
  }

  const data: unknown = await res.json();
  return unwrapSessionsArray(data);
}

/**
 * Update a study session's datetime on the backend
 */
export async function updateSessionDatetime(sessionId: string, scheduledDatetime: string): Promise<StudySession> {
  const userId = getLoggedInUserId();
  const token = getAccessToken();

  if (!userId || !token) {
    throw new Error('Not authenticated');
  }

  const res = await apiFetch(`/users/${encodeURIComponent(userId)}/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      scheduled_datetime: scheduledDatetime,
    }),
  });

  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.text()).slice(0, 240);
    } catch {
      // ignore
    }
    throw new Error(
      detail ? `Failed to update session (${res.status}): ${detail}` : `Failed to update session (${res.status})`,
    );
  }

  const responseData: unknown = await res.json();
  const session = unwrapSingleSession(responseData);
  if (!session) {
    throw new Error('Invalid session data from server');
  }

  return session;
}

/**
 * Unwrap sessions array from various response formats
 */
function unwrapSessionsArray(data: unknown): StudySession[] {
  if (Array.isArray(data)) return data as unknown as StudySession[];
  if (!data || typeof data !== 'object') return [];

  const o = data as Record<string, unknown>;
  for (const key of ['sessions', 'data', 'items']) {
    const v = o[key];
    if (Array.isArray(v)) return v as unknown as StudySession[];
  }

  return [];
}

/**
 * Unwrap single session from response
 */
function unwrapSingleSession(data: unknown): StudySession | null {
  if (!data || typeof data !== 'object') return null;

  const o = data as Record<string, unknown>;

  // Check for nested session object
  const session = o.session;
  if (session && typeof session === 'object' && !Array.isArray(session)) {
    return session as unknown as StudySession;
  }

  // Check for data wrapper
  const inner = o.data;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    return inner as unknown as StudySession;
  }

  // Return the object itself if it has an id property
  if ('id' in o) {
    return o as unknown as StudySession;
  }

  return null;
}

