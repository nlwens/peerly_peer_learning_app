import { useEffect, useState } from 'react';

type NetworkState = 'online' | 'offline' | 'unknown';

let networkState: NetworkState = 'unknown';
type NetworkStatusListener = (state: NetworkState) => void;
const listeners = new Set<NetworkStatusListener>();

function notifyListeners() {
  listeners.forEach((l) => l(networkState));
}

function subscribeToNetworkEvents() {
  // Only set up listeners in browser environment
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    // React Native or SSR environment - assume online
    networkState = 'online';
    return () => {};
  }

  const handleOnline = () => {
    networkState = 'online';
    notifyListeners();
  };

  const handleOffline = () => {
    networkState = 'offline';
    notifyListeners();
  };

  // Set up event listeners if available
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  // Set initial state based on navigator.onLine
  if ('onLine' in navigator) {
    networkState = navigator.onLine ? 'online' : 'offline';
  } else {
    networkState = 'online';
  }

  return () => {
    if (typeof window.removeEventListener === 'function') {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
  };
}

let unsubscribe: (() => void) | null = null;

// Initialize network status on first call (browser only)
if (typeof window !== 'undefined' && !unsubscribe) {
  unsubscribe = subscribeToNetworkEvents();
}

/**
 * Get current network state without subscribing
 */
export function getNetworkState(): NetworkState {
  // Browser environment
  if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
    return navigator.onLine ? 'online' : 'offline';
  }

  // React Native or unknown environment - default to online
  return networkState || 'online';
}

/**
 * Check if device is currently offline
 */
export function isOffline(): boolean {
  const state = getNetworkState();
  return state === 'offline';
}

/**
 * Check if device is currently online
 */
export function isOnline(): boolean {
  const state = getNetworkState();
  return state === 'online';
}

/**
 * React hook to track network status
 */
export function useNetworkStatus(): NetworkState {
  const [state, setState] = useState<NetworkState>(() => getNetworkState());

  useEffect(() => {
    const listener: NetworkStatusListener = (newState) => {
      setState(newState);
    };

    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  return state;
}

/**
 * React hook for checking if offline
 */
export function useIsOffline(): boolean {
  const state = useNetworkStatus();
  return state === 'offline';
}

