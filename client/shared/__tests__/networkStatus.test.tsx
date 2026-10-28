import React from 'react';
import { Text } from 'react-native';
import { render, screen, waitFor, act } from '@testing-library/react-native';
import { getNetworkState, isOffline, isOnline, useNetworkStatus } from '@/shared/utils/networkStatus';

describe('networkStatus', () => {
  const originalNavigator = global.navigator;
  const originalWindow = global.window;

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(global, 'window', {
      value: originalWindow,
      configurable: true,
      writable: true,
    });
  });

  it('reports offline when navigator.onLine is false', () => {
    Object.defineProperty(global, 'navigator', {
      value: { onLine: false },
      configurable: true,
      writable: true,
    });

    expect(getNetworkState()).toBe('offline');
    expect(isOffline()).toBe(true);
    expect(isOnline()).toBe(false);
  });

  it('reports online when navigator.onLine is true', () => {
    Object.defineProperty(global, 'navigator', {
      value: { onLine: true },
      configurable: true,
      writable: true,
    });

    expect(getNetworkState()).toBe('online');
    expect(isOnline()).toBe(true);
    expect(isOffline()).toBe(false);
  });

  it('defaults to online when navigator is unavailable', () => {
    Object.defineProperty(global, 'navigator', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    expect(getNetworkState()).toBe('online');
  });

  it('useNetworkStatus returns a valid state', async () => {
    function TestComponent() {
      const state = useNetworkStatus();
      return <Text>{state}</Text>;
    }

    render(<TestComponent />);

    await waitFor(() => {
      expect(
        screen.queryByText('online') || screen.queryByText('offline') || screen.queryByText('unknown'),
      ).toBeTruthy();
    });
  });

  it('useNetworkStatus uses the current navigator state on initial render', async () => {
    Object.defineProperty(global, 'navigator', {
      value: { onLine: false },
      configurable: true,
      writable: true,
    });

    function BrowserHookComponent() {
      const state = useNetworkStatus();
      return <Text>{state}</Text>;
    }

    render(<BrowserHookComponent />);

    await waitFor(() => {
      expect(screen.getByText('offline')).toBeTruthy();
    });
  });
});
