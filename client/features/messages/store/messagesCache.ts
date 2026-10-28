import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Message } from '../types';

export interface CachedMessage extends Message {
  synced: boolean; // true if from backend, false if pending local
}

export interface CachedConversation {
  myId: string;
  otherId: string;
  messages: CachedMessage[];
  cachedAt: number;
  source: 'cache' | 'network';
}

// In-memory cache: keyed by "${myId}_${otherId}"
let conversationsCache = new Map<string, CachedConversation>();

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

function getCacheKey(myId: string, otherId: string): string {
  return `${myId}_${otherId}`;
}

function getStorageKey(myId: string, otherId: string): string {
  return `peerly_chat_${myId}_${otherId}`;
}

// Conversation Cache Operations
async function persistConversation(myId: string, otherId: string, convo: CachedConversation) {
  const key = getStorageKey(myId, otherId);
  try {
    await AsyncStorage.setItem(key, JSON.stringify(convo));
  } catch (e) {
    console.warn(`Failed to persist conversation ${myId}_${otherId}:`, e);
  }
}

async function loadConversation(myId: string, otherId: string): Promise<CachedConversation | null> {
  const key = getStorageKey(myId, otherId);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as CachedConversation;
  } catch (e) {
    console.warn(`Failed to load conversation ${myId}_${otherId} from storage:`, e);
    return null;
  }
}

export function getCachedConversation(myId: string, otherId: string): CachedConversation | null {
  const key = getCacheKey(myId, otherId);
  return conversationsCache.get(key) ?? null;
}

export function saveCachedConversation(
  myId: string,
  otherId: string,
  messages: Message[],
  source: 'cache' | 'network' = 'network',
): void {
  const key = getCacheKey(myId, otherId);
  const now = Date.now();

  // Mark messages as synced if from network
  const cachedMessages: CachedMessage[] = messages.map((m) => ({
    ...m,
    synced: source === 'network',
  }));

  const convo: CachedConversation = {
    myId,
    otherId,
    messages: cachedMessages,
    cachedAt: now,
    source,
  };

  conversationsCache.set(key, convo);
  void persistConversation(myId, otherId, convo);
  emit();
}

export function appendMessageToCache(myId: string, otherId: string, message: CachedMessage): void {
  const key = getCacheKey(myId, otherId);
  const existing = conversationsCache.get(key);

  if (!existing) {
    // Create new conversation with single message
    saveCachedConversation(myId, otherId, [message]);
    return;
  }

  // Check if message already exists (dedup by ID)
  const alreadyExists = existing.messages.some((m) => m.id === message.id);
  if (alreadyExists) return;

  // Append message
  const updated: CachedConversation = {
    ...existing,
    messages: [...existing.messages, message],
    cachedAt: Date.now(),
  };

  conversationsCache.set(key, updated);
  void persistConversation(myId, otherId, updated);
  emit();
}

export function useConversation(myId: string, otherId: string): CachedMessage[] | null {
  return useSyncExternalStore(
    subscribe,
    () => getCachedConversation(myId, otherId)?.messages ?? null,
    () => getCachedConversation(myId, otherId)?.messages ?? null,
  );
}

// Cache Invalidation
export function clearConversationCache(myId: string, otherId: string): void {
  const key = getCacheKey(myId, otherId);
  conversationsCache.delete(key);
  void AsyncStorage.removeItem(getStorageKey(myId, otherId));
  emit();
}

export function clearAllConversationsCache(): void {
  conversationsCache.clear();
  void (async () => {
    const keys = await AsyncStorage.getAllKeys();
    const chatKeys = keys.filter((k) => k.startsWith('peerly_chat_'));
    if (chatKeys.length > 0) {
      await AsyncStorage.multiRemove(chatKeys);
    }
  })();
  emit();
}

// Initialize Cache from Storage
export async function initializeConversationCacheFromStorage(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const chatKeys = keys.filter((k) => k.startsWith('peerly_chat_'));

    for (const key of chatKeys) {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const convo = JSON.parse(raw) as CachedConversation;
          const cacheKey = getCacheKey(convo.myId, convo.otherId);
          conversationsCache.set(cacheKey, convo);
        }
      } catch (e) {
        console.warn(`Failed to load chat cache ${key}:`, e);
      }
    }
  } catch (e) {
    console.warn('Failed to initialize conversation cache:', e);
  }
  emit();
}

