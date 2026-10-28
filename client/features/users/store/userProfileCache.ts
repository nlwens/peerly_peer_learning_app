import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../data/types';

export interface CachedUserProfile extends User {
  cachedAt: number; // timestamp
  source: 'cache' | 'network';
}

export interface CachedUsersList {
  users: CachedUserProfile[];
  cachedAt: number;
}

// In-memory caches
let profilesCache = new Map<string, CachedUserProfile>();
let usersListCache: CachedUsersList | null = null;

// Listener system
type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Individual Profile Cache
async function persistProfile(userId: string, profile: CachedUserProfile) {
  const key = `peerly_user_profile_${userId}`;
  try {
    await AsyncStorage.setItem(key, JSON.stringify(profile));
  } catch (e) {
    console.warn(`Failed to persist user profile ${userId}:`, e);
  }
}

async function loadProfile(userId: string): Promise<CachedUserProfile | null> {
  const key = `peerly_user_profile_${userId}`;
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as CachedUserProfile;
  } catch (e) {
    console.warn(`Failed to load user profile ${userId} from storage:`, e);
    return null;
  }
}

export function getCachedUserProfile(userId: string): CachedUserProfile | null {
  return profilesCache.get(userId) ?? null;
}

export function setCachedUserProfile(user: CachedUserProfile): void {
  profilesCache.set(user.id, user);
  void persistProfile(user.id, user);
  emit();
}

export function useUserProfileCache(userId: string): CachedUserProfile | null {
  return useSyncExternalStore(
    subscribe,
    () => getCachedUserProfile(userId),
    () => getCachedUserProfile(userId),
  );
}

// Users List Cache
const USERS_LIST_STORAGE_KEY = 'peerly_home_users_list';

async function persistUsersList(list: CachedUsersList) {
  try {
    await AsyncStorage.setItem(USERS_LIST_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to persist users list:', e);
  }
}

async function loadUsersList(): Promise<CachedUsersList | null> {
  try {
    const raw = await AsyncStorage.getItem(USERS_LIST_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedUsersList;
  } catch (e) {
    console.warn('Failed to load users list from storage:', e);
    return null;
  }
}

export function getCachedUsersList(): CachedUsersList | null {
  return usersListCache;
}

export function setCachedUsersList(users: CachedUserProfile[]): void {
  const now = Date.now();
  usersListCache = {
    users,
    cachedAt: now,
  };
  void persistUsersList(usersListCache);
  emit();
}

export function useUsersList(): CachedUserProfile[] | null {
  return useSyncExternalStore(
    subscribe,
    () => usersListCache?.users ?? null,
    () => usersListCache?.users ?? null,
  );
}

// Cache Invalidation
export function clearUserCache(userId?: string): void {
  if (userId) {
    profilesCache.delete(userId);
    void AsyncStorage.removeItem(`peerly_user_profile_${userId}`);
  } else {
    profilesCache.clear();
    // Clear all profile keys
    void (async () => {
      const keys = await AsyncStorage.getAllKeys();
      const profileKeys = keys.filter((k) => k.startsWith('peerly_user_profile_'));
      if (profileKeys.length > 0) {
        await AsyncStorage.multiRemove(profileKeys);
      }
    })();
  }
  emit();
}

export function clearUsersListCache(): void {
  usersListCache = null;
  void AsyncStorage.removeItem(USERS_LIST_STORAGE_KEY);
  emit();
}

export function clearAllUserCache(): void {
  clearUserCache();
  clearUsersListCache();
}

export function invalidateCache(userId?: string): void {
  clearUserCache(userId);
  if (!userId) clearUsersListCache();
}

// Initialize Cache from Storage
export async function initializeUserCacheFromStorage(): Promise<void> {
  try {
    const stored = await loadUsersList();
    if (stored) {
      usersListCache = stored;
      // Also load individual profiles from the list
      for (const user of stored.users) {
        profilesCache.set(user.id, user);
      }
    }
  } catch (e) {
    console.warn('Failed to initialize user cache:', e);
  }
  emit();
}

