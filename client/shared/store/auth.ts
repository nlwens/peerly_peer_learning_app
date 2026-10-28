// shared/store/auth.ts
import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearAllUserCache } from '@/features/users/store/userProfileCache';
import { clearAllConversationsCache } from '@/features/messages/store/messagesCache';

const STORAGE_KEY = 'peerly_auth';

type AuthState = {
  accessToken: string | null;
  loggedInUserId: string | null;
  hydrated: boolean;
};

let state: AuthState = {
  accessToken: null,
  loggedInUserId: null,
  hydrated: false,
};

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
  return state;
}

export function useAuth() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

type PersistedAuth = {
  accessToken?: string | null;
  loggedInUserId?: string | null;
};

async function persist() {
  const payload: PersistedAuth = {
    accessToken: state.accessToken,
    loggedInUserId: state.loggedInUserId,
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export async function loadAuth() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as PersistedAuth;
      state = {
        accessToken:
          typeof parsed.accessToken === 'string' && parsed.accessToken.length > 0 ? parsed.accessToken : null,
        loggedInUserId: parsed.loggedInUserId ?? null,
        hydrated: true,
      };
    } catch {
      state = { ...state, hydrated: true };
    }
  } else {
    state = { ...state, hydrated: true };
  }
  emit();
}

export const isLoggedIn = () =>
  (state.accessToken != null && state.accessToken !== '') ||
  (state.loggedInUserId != null && state.loggedInUserId !== '');

export const getLoggedInUserId = () => state.loggedInUserId;

export const getAccessToken = () => state.accessToken;

/**
 * After backend login: stores Bearer token and user id when the API provides it
 * (or JWT `sub` was decoded in loginApi).
 */
export async function loginWithSession(accessToken: string, loggedInUserId: string | null) {
  state = {
    ...state,
    accessToken,
    loggedInUserId,
  };
  emit();
  await persist();
}

/**
 * Local-only session (e.g. register flow) without a backend token yet.
 */
export async function loginLocalUser(userId: string) {
  state = {
    ...state,
    accessToken: null,
    loggedInUserId: userId,
  };
  emit();
  await persist();
}

export async function logout() {
  state = {
    ...state,
    accessToken: null,
    loggedInUserId: null,
  };
  emit();
  await persist();
  // Clear offline caches on logout
  clearAllUserCache();
  clearAllConversationsCache();
}
