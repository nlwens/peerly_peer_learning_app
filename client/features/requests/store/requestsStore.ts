import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Request, RequestStatus, RequestType } from '../data/types';
import { apiFetch } from '@/shared/api/client';
import { getAccessToken, getLoggedInUserId } from '@/shared/store/auth';
import { mergeUserProfileFromNetwork } from '@/features/users/api/homeUsers';

const STORAGE_KEY = 'peerly_requests';

/** Thrown when the API signals insufficient tokens; UI maps this to OutOfTokensModal. */
export const OUT_OF_TOKENS_ERROR_MESSAGE = "You're out of tokens!";

function apiBodyOrRawSaysOutOfTokens(raw: string): boolean {
  let fromMessage = '';
  try {
    const o = JSON.parse(raw) as { message?: unknown };
    if (typeof o.message === 'string') fromMessage = o.message;
    else if (Array.isArray(o.message) && typeof o.message[0] === 'string') fromMessage = o.message[0];
  } catch {
    // not JSON — fall through
  }
  const hit = (s: string) => {
    const n = s.toLowerCase().replace(/`/g, "'");
    return n.includes("you're out of tokens") || n.includes('out of tokens');
  };
  return hit(fromMessage) || hit(raw);
}

export function isOutOfTokensError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  if (e.message === OUT_OF_TOKENS_ERROR_MESSAGE) return true;
  return apiBodyOrRawSaysOutOfTokens(e.message);
}

let requests: Request[] = [];

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return requests;
}

export function useRequests(): Request[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

async function persist() {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

function asString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  return String(value);
}

function asNullableString(value: unknown): string | null {
  return asString(value);
}

function normalizeUppercaseEnum<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  const s = asString(value);
  if (!s) return null;
  const upper = s.trim().toUpperCase();
  return allowed.includes(upper as T) ? (upper as T) : null;
}

const ALLOWED_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'CANCELED',
  'COMPLETED',
] as const satisfies readonly RequestStatus[];

const ALLOWED_TYPES = ['REQUEST', 'OFFER'] as const satisfies readonly RequestType[];

function mapApiRequestToRequest(raw: unknown): Request | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const id = asString(r.id) ?? asString(r.request_id) ?? asString(r._id ?? r.uuid);
  const requesterId = asString(r.requester_id) ?? asString(r.requesterId);
  const receiverId = asString(r.receiver_id) ?? asString(r.receiverId);
  const subject = asString(r.subject) ?? asString(r.title) ?? '';
  const status = normalizeUppercaseEnum(r.status, ALLOWED_STATUSES);
  const type = normalizeUppercaseEnum(r.type, ALLOWED_TYPES);

  if (!id || !requesterId || !receiverId || !status || !type) return null;

  const scheduledDatetime = (asString(r.scheduled_datetime) ?? asString(r.scheduledDatetime) ?? '') as string;
  const createdAt = asString(r.created_at) ?? asString(r.createdAt) ?? new Date().toISOString();

  const studySession =
    r.study_sessions && typeof r.study_sessions === 'object' ? (r.study_sessions as Record<string, unknown>) : null;

  const requesterCompleted =
    typeof r.requester_completed === 'boolean'
      ? r.requester_completed
      : typeof studySession?.requester_completed === 'boolean'
        ? studySession.requester_completed
        : undefined;

  const receiverCompleted =
    typeof r.receiver_completed === 'boolean'
      ? r.receiver_completed
      : typeof studySession?.receiver_completed === 'boolean'
        ? studySession.receiver_completed
        : undefined;

  return {
    id,
    requester_id: requesterId,
    receiver_id: receiverId,
    subject,
    scheduled_datetime: scheduledDatetime,
    status,
    created_at: createdAt,
    type,
    requester_completed: requesterCompleted,
    receiver_completed: receiverCompleted,
    study_session_id: asString(r.study_session_id) ?? asString(studySession?.id) ?? undefined,
    other_user_name: asNullableString(r.other_user_name) ?? undefined,
    other_user_avatar: r.other_user_avatar === null ? null : (asNullableString(r.other_user_avatar) ?? undefined),
  };
}

function unwrapRequestsArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  const o = data as Record<string, unknown>;

  for (const key of ['requests', 'data', 'items']) {
    const v = o[key];
    if (Array.isArray(v)) return v;
  }

  const inner = o.data;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    const i = inner as Record<string, unknown>;
    for (const key of ['requests', 'data', 'items']) {
      const v = i[key];
      if (Array.isArray(v)) return v;
    }
  }

  return [];
}

/** Backend may change token_balance; refresh cache from API when online without wiping offline fallback. */
async function refreshRequesterProfileFromServer(userId: string): Promise<void> {
  await mergeUserProfileFromNetwork(userId);
}

async function fetchRequestsFromBackend(userId: string): Promise<Request[]> {
  const res = await apiFetch(`/users/${encodeURIComponent(userId)}/requests`);
  if (!res.ok) {
    throw new Error(`Failed to load requests (${res.status})`);
  }
  const data: unknown = await res.json();
  return unwrapRequestsArray(data)
    .map(mapApiRequestToRequest)
    .filter((r): r is Request => r !== null);
}

export async function loadRequests() {
  const userId = getLoggedInUserId();
  const token = getAccessToken();

  if (userId && token) {
    try {
      requests = await fetchRequestsFromBackend(userId);
      await persist();
      emit();
      return;
    } catch {
      // fall back to cache
    }
  }

  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      requests = JSON.parse(raw) as Request[];
    } catch (e) {
      console.log('Failed to parse stored requests, resetting store', e);
      requests = [];
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  } else {
    requests = [];
  }

  emit();
}

export async function replaceRequests(next: Request[]) {
  requests = [...next];
  await persist();
  emit();
}

export async function upsertRequestFromSocket(raw: unknown) {
  const mapped = mapApiRequestToRequest(raw);
  if (!mapped) return;

  const existingIndex = requests.findIndex((r) => r.id === mapped.id);
  if (existingIndex === -1) {
    requests = [mapped, ...requests];
  } else {
    const next = [...requests];
    next[existingIndex] = {
      ...next[existingIndex],
      ...mapped,
    };
    requests = next;
  }

  await persist();
  emit();
}

export async function removeRequestById(id: string) {
  requests = requests.filter((r) => r.id !== id);
  await persist();
  emit();
}

export async function createRequestOnBackend(params: {
  requesterId: string;
  receiverId: string;
  subject: string;
  type: RequestType;
}): Promise<void> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated. Please log in again.');
  }

  const res = await apiFetch(`/users/${encodeURIComponent(params.requesterId)}/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      receiver_id: params.receiverId,
      subject: params.subject.trim(),
      type: params.type,
    }),
  });

  if (!res.ok) {
    let detail = '';
    let raw = '';
    try {
      raw = await res.text();
      detail = raw.slice(0, 240);
    } catch {
      // ignore
    }

    if (apiBodyOrRawSaysOutOfTokens(raw)) {
      await refreshRequesterProfileFromServer(params.requesterId);
      throw new Error(OUT_OF_TOKENS_ERROR_MESSAGE);
    }

    throw new Error(
      detail ? `Failed to send request (${res.status}): ${detail}` : `Failed to send request (${res.status})`,
    );
  }

  // Sender UI will be updated via websocket; this keeps it safe as fallback.
  requests = await fetchRequestsFromBackend(params.requesterId);
  await persist();
  emit();

  await refreshRequesterProfileFromServer(params.requesterId);
}

export async function addRequest(request: Request) {
  requests = [...requests, request];
  await persist();
  emit();
}

export async function setRequestStatus(id: string, status: RequestStatus) {
  const userId = getLoggedInUserId();
  const token = getAccessToken();

  if (userId && token) {
    const res = await apiFetch(`/users/${encodeURIComponent(userId)}/requests/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      let text = '';
      try {
        text = await res.text();
      } catch {
        // ignore
      }
      if (apiBodyOrRawSaysOutOfTokens(text)) {
        await mergeUserProfileFromNetwork(userId);
        throw new Error(OUT_OF_TOKENS_ERROR_MESSAGE);
      }
      const detail = text.slice(0, 240);
      throw new Error(
        detail ? `Failed to update status (${res.status}): ${detail}` : `Failed to update status (${res.status})`,
      );
    }

    requests = await fetchRequestsFromBackend(userId);
    await persist();
    emit();
    await mergeUserProfileFromNetwork(userId);
    return;
  }

  requests = requests.map((r) => (r.id === id ? { ...r, status } : r));
  await persist();
  emit();
}

export async function deleteRequest(id: string) {
  requests = requests.filter((r) => r.id !== id);
  await persist();
  emit();
}

export function findRequest(id: string) {
  return requests.find((r) => r.id === id);
}

export function hasPendingBetween(a: string, b: string, type?: RequestType) {
  return requests.some((r) => {
    const samePair = (r.requester_id === a && r.receiver_id === b) || (r.requester_id === b && r.receiver_id === a);
    const pending = r.status === 'PENDING';
    const typeOk = type ? r.type === type : true;
    return samePair && pending && typeOk;
  });
}

export async function setRequestSchedule(id: string, scheduledDatetime: string) {
  requests = requests.map((r) => (r.id === id ? { ...r, scheduled_datetime: scheduledDatetime } : r));
  await persist();
  emit();
}

export async function completeSessionOnBackend(id: string) {
  const userId = getLoggedInUserId();
  const token = getAccessToken();

  if (userId && token) {
    const res = await apiFetch(`/users/${encodeURIComponent(userId)}/requests/${encodeURIComponent(id)}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      let detail = '';
      try {
        detail = (await res.text()).slice(0, 240);
      } catch {
        // ignore
      }
      throw new Error(
        detail ? `Failed to complete session (${res.status}): ${detail}` : `Failed to complete session (${res.status})`,
      );
    }

    requests = await fetchRequestsFromBackend(userId);
    await persist();
    emit();
    await mergeUserProfileFromNetwork(userId);
    return;
  }

  const currentUserId = userId;
  requests = requests.map((r) => {
    if (r.id !== id) return r;

    const nextRequesterCompleted = r.requester_completed || r.requester_id === currentUserId;
    const nextReceiverCompleted = r.receiver_completed || r.receiver_id === currentUserId;
    const bothCompleted = Boolean(nextRequesterCompleted && nextReceiverCompleted);

    return {
      ...r,
      requester_completed: Boolean(nextRequesterCompleted),
      receiver_completed: Boolean(nextReceiverCompleted),
      status: bothCompleted ? 'COMPLETED' : 'ACCEPTED',
    };
  });

  await persist();
  emit();
}

function mapSessionToIds(raw: unknown): { sessionId: string | null; requestId: string | null } {
  if (!raw || typeof raw !== 'object') {
    return { sessionId: null, requestId: null };
  }

  const s = raw as Record<string, unknown>;
  const sessionId = asString(s.id);
  const requestId =
    asString(s.request_id) ??
    (s.requests && typeof s.requests === 'object' ? asString((s.requests as Record<string, unknown>).id) : null);

  return { sessionId, requestId };
}

export async function findStudySessionIdByRequest(userId: string, requestId: string): Promise<string | null> {
  const res = await apiFetch(`/users/${encodeURIComponent(userId)}/sessions`);
  if (!res.ok) {
    return null;
  }

  const data: unknown = await res.json();
  const sessions = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>).data)
      ? ((data as Record<string, unknown>).data as unknown[])
      : [];

  for (const session of sessions) {
    const ids = mapSessionToIds(session);
    if (ids.requestId === requestId && ids.sessionId) {
      return ids.sessionId;
    }
  }

  return null;
}
