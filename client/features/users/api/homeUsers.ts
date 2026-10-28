import type { User, EducationLevel } from '../data/types';
import { apiFetch } from '@/shared/api/client';
import { getAccessToken } from '@/shared/store/auth';
import {
  getCachedUserProfile,
  setCachedUserProfile,
  getCachedUsersList,
  setCachedUsersList,
  clearUserCache,
} from '../store/userProfileCache';

const EDUCATION_LEVELS: EducationLevel[] = ['HBO', 'WO', 'MBO', 'Master HBO', 'Master WO'];

const PLACEHOLDER_AVATAR = 'https://via.placeholder.com/120/cccccc/666666?text=%3F';

function asString(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function asEducationLevel(value: unknown): EducationLevel {
  const s = asString(value);
  return EDUCATION_LEVELS.includes(s as EducationLevel) ? (s as EducationLevel) : 'HBO';
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (!Number.isNaN(n)) return n;
  }
  return fallback;
}

export function mapApiUserToUser(raw: unknown): User | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const id = asString(r.id);
  if (!id) return null;

  const profileUrl = asString(r.profile_image_url ?? r.profileImageUrl);

  const isPausedRaw = r.is_paused ?? r.isPaused;
  const isPaused =
    typeof isPausedRaw === 'boolean'
      ? isPausedRaw
      : typeof isPausedRaw === 'string'
        ? ['true', '1', 'yes'].includes(isPausedRaw.trim().toLowerCase())
        : typeof isPausedRaw === 'number'
          ? isPausedRaw === 1
          : false;

  return {
    id,
    name: asString(r.name, 'Unknown'),
    email: asString(r.email),
    password: asString(r.password),
    major: asString(r.major),
    education_level: asEducationLevel(r.education_level ?? r.educationLevel),
    strengths: asStringArray(r.strengths),
    needs_help_with: asStringArray(r.needs_help_with ?? r.needsHelpWith),
    description: r.description != null ? asString(r.description) : undefined,
    token_balance: asNumber(r.token_balance ?? r.tokenBalance, 0),
    rating_average: asNumber(r.rating_average ?? r.ratingAverage, 0),
    rating_count: asNumber(r.rating_count ?? r.ratingCount, 0),
    created_at: asString(r.created_at ?? r.createdAt) || new Date().toISOString(),
    profile_image_url: profileUrl || PLACEHOLDER_AVATAR,
    isPaused,
  };
}

export type SubmitUserRatingBody = {
  study_session_id: string;
  ratee_id: string;
  stars: number;
};

export async function submitUserRating(userId: string, body: SubmitUserRatingBody) {
  if (!getAccessToken()) {
    throw new Error('Not authenticated. Log in again to submit a rating.');
  }

  const res = await apiFetch(`/users/${encodeURIComponent(userId)}/ratings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    let detail = '';
    try {
      if (text.trim()) {
        const j = JSON.parse(text) as { message?: string | string[]; error?: string };
        detail =
          typeof j.message === 'string'
            ? j.message
            : Array.isArray(j.message) && typeof j.message[0] === 'string'
              ? j.message[0]
              : typeof j.error === 'string'
                ? j.error
                : text.slice(0, 240);
      }
    } catch {
      detail = text.slice(0, 240);
    }

    throw new Error(
      detail ? `Failed to submit rating (${res.status}): ${detail}` : `Failed to submit rating (${res.status})`,
    );
  }

  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function unwrapUsersArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    for (const key of ['users', 'data', 'items']) {
      const v = o[key];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

export async function fetchHomeUsers(): Promise<User[]> {
  // Check cache first - use if less than 5 minutes old
  const cached = getCachedUsersList();
  if (cached && Date.now() - cached.cachedAt < 5 * 60 * 1000) {
    return cached.users;
  }

  try {
    const res = await apiFetch('/users');
    if (!res.ok) {
      throw new Error(`Failed to load users (${res.status})`);
    }
    const data: unknown = await res.json();
    const users = unwrapUsersArray(data)
      .map(mapApiUserToUser)
      .filter((u): u is User => u !== null);

    // Cache the result
    const cachedUsers = users.map((u) => ({
      ...u,
      cachedAt: Date.now(),
      source: 'network' as const,
    }));
    setCachedUsersList(cachedUsers);

    return users;
  } catch (error) {
    // If fetch failed but we have a cache, return it quietly
    const cached = getCachedUsersList();
    if (cached) {
      return cached.users;
    }
    throw error;
  }
}

function unwrapSingleUserPayload(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  const o = data as Record<string, unknown>;
  const user = o.user;
  if (user && typeof user === 'object' && !Array.isArray(user)) return user;
  const inner = o.data;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) return inner;
  return data;
}

/**
 * Fetches the latest user from the API and updates the profile cache when successful.
 * On failure, leaves any existing cache as-is so offline / flaky networks still show last-known data.
 */
export async function mergeUserProfileFromNetwork(id: string): Promise<void> {
  try {
    const res = await apiFetch(`/users/${encodeURIComponent(id)}`);
    if (!res.ok) return;
    const data: unknown = await res.json();
    const raw = unwrapSingleUserPayload(data);
    const user = mapApiUserToUser(raw);
    if (!user) return;
    setCachedUserProfile({
      ...user,
      cachedAt: Date.now(),
      source: 'network',
    });
  } catch {
    // keep cached profile for offline
  }
}

export async function fetchUserById(id: string): Promise<User> {
  // Try cache first
  const cached = getCachedUserProfile(id);
  if (cached) {
    return cached;
  }

  try {
    const res = await apiFetch(`/users/${encodeURIComponent(id)}`);
    if (!res.ok) {
      throw new Error(`Failed to load user (${res.status})`);
    }
    const data: unknown = await res.json();
    const raw = unwrapSingleUserPayload(data);
    const user = mapApiUserToUser(raw);
    if (!user) {
      throw new Error('Invalid user data from server');
    }

    // Cache the result
    setCachedUserProfile({
      ...user,
      cachedAt: Date.now(),
      source: 'network',
    });

    return user;
  } catch (error) {
    // If fetch failed but we have a cache, return it
    const cached = getCachedUserProfile(id);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

export type ProfileUpdateBody = {
  name: string;
  major: string;
  description?: string;
  education_level: EducationLevel;
  strengths: string[];
  needs_help_with: string[];
  profile_image_url?: string;
};

/**
 * PUT /users/:id — uses apiFetch() so Authorization: Bearer <accessToken> is sent automatically.
 * Body uses snake_case (adjust if your API expects camelCase).
 * Empty or non-JSON success body falls back to GET /users/:id.
 */
export async function putUserProfile(id: string, body: ProfileUpdateBody): Promise<User> {
  if (!getAccessToken()) {
    throw new Error('Not authenticated. Log in again to save your profile.');
  }
  const res = await apiFetch(`/users/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    let detail = '';
    try {
      if (text.trim()) {
        const j = JSON.parse(text) as { message?: string; error?: string };
        detail = typeof j.message === 'string' ? j.message : typeof j.error === 'string' ? j.error : text.slice(0, 240);
      }
    } catch {
      detail = text.slice(0, 240);
    }
    throw new Error(
      detail ? `Failed to save profile (${res.status}): ${detail}` : `Failed to save profile (${res.status})`,
    );
  }

  const reloadAfterPut = async (): Promise<User> => {
    clearUserCache(id);
    return fetchUserById(id);
  };

  if (!text.trim()) {
    return reloadAfterPut();
  }
  let data: unknown;
  try {
    data = JSON.parse(text) as unknown;
  } catch {
    return reloadAfterPut();
  }
  const raw = unwrapSingleUserPayload(data);
  const user = mapApiUserToUser(raw);
  if (!user) {
    return reloadAfterPut();
  }
  setCachedUserProfile({
    ...user,
    cachedAt: Date.now(),
    source: 'network',
  });
  return user;
}

/**
 * DELETE /users/:id — permanently delete the authenticated user's account.
 */
export async function deleteUserAccount(id: string): Promise<void> {
  if (!getAccessToken()) {
    throw new Error('Not authenticated. Log in again to delete your account.');
  }

  const res = await apiFetch(`/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
    },
  });

  if (res.ok) {
    return;
  }

  const text = await res.text();
  let detail = '';
  try {
    if (text.trim()) {
      const j = JSON.parse(text) as { message?: string | string[]; error?: string };
      detail =
        typeof j.message === 'string'
          ? j.message
          : Array.isArray(j.message) && typeof j.message[0] === 'string'
            ? j.message[0]
            : typeof j.error === 'string'
              ? j.error
              : text.slice(0, 240);
    }
  } catch {
    detail = text.slice(0, 240);
  }

  throw new Error(
    detail ? `Failed to delete account (${res.status}): ${detail}` : `Failed to delete account (${res.status})`,
  );
}

/**
 * PATCH /users/:id/pause — set whether the account is paused (e.g. hidden from home list).
 * Body: `{ is_paused: boolean }` (snake_case).
 */
export async function patchUserPause(id: string, isPaused: boolean): Promise<User> {
  if (!getAccessToken()) {
    throw new Error('Not authenticated. Log in again to update pause status.');
  }

  const res = await apiFetch(`/users/${encodeURIComponent(id)}/pause`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ is_paused: isPaused }),
  });

  const text = await res.text();
  if (!res.ok) {
    let detail = '';
    try {
      if (text.trim()) {
        const j = JSON.parse(text) as { message?: string | string[]; error?: string };
        detail =
          typeof j.message === 'string'
            ? j.message
            : Array.isArray(j.message) && typeof j.message[0] === 'string'
              ? j.message[0]
              : typeof j.error === 'string'
                ? j.error
                : text.slice(0, 240);
      }
    } catch {
      detail = text.slice(0, 240);
    }
    throw new Error(
      detail
        ? `Failed to update pause status (${res.status}): ${detail}`
        : `Failed to update pause status (${res.status})`,
    );
  }

  if (text.trim()) {
    try {
      const data = JSON.parse(text) as unknown;
      const raw = unwrapSingleUserPayload(data);
      const user = mapApiUserToUser(raw);
      if (user) return user;
    } catch {
      // fall through to GET
    }
  }

  return fetchUserById(id);
}
