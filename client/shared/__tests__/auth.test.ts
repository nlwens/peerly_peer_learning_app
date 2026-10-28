import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loginWithSession,
  loginLocalUser,
  logout,
  isLoggedIn,
  getLoggedInUserId,
  getAccessToken,
  loadAuth,
} from '@/shared/store/auth';

jest.mock('@react-native-async-storage/async-storage');

describe('Auth Store', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await logout();
    await (AsyncStorage.clear as jest.Mock)();
  });

  describe('loginWithSession', () => {
    it('should store accessToken and userId', async () => {
      await loginWithSession('test-token', 'user-123');

      expect(getAccessToken()).toBe('test-token');
      expect(getLoggedInUserId()).toBe('user-123');
    });

    it('should persist to AsyncStorage', async () => {
      await loginWithSession('test-token', 'user-123');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'peerly_auth',
        JSON.stringify({
          accessToken: 'test-token',
          loggedInUserId: 'user-123',
        }),
      );
    });

    it('should handle null userId', async () => {
      await loginWithSession('test-token', null);

      expect(getAccessToken()).toBe('test-token');
      expect(getLoggedInUserId()).toBeNull();
    });
  });

  describe('loginLocalUser', () => {
    it('should set userId without accessToken', async () => {
      await loginLocalUser('local-user-123');

      expect(getAccessToken()).toBeNull();
      expect(getLoggedInUserId()).toBe('local-user-123');
    });

    it('should persist to AsyncStorage', async () => {
      await loginLocalUser('local-user-123');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'peerly_auth',
        JSON.stringify({
          accessToken: null,
          loggedInUserId: 'local-user-123',
        }),
      );
    });
  });

  describe('logout', () => {
    it('should clear accessToken and userId', async () => {
      await loginWithSession('test-token', 'user-123');
      await logout();

      expect(getAccessToken()).toBeNull();
      expect(getLoggedInUserId()).toBeNull();
    });

    it('should persist empty state to AsyncStorage', async () => {
      await logout();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'peerly_auth',
        JSON.stringify({
          accessToken: null,
          loggedInUserId: null,
        }),
      );
    });
  });

  describe('isLoggedIn', () => {
    it('should return true when accessToken present', async () => {
      await loginWithSession('test-token', 'user-123');
      expect(isLoggedIn()).toBe(true);
    });

    it('should return true when userId present', async () => {
      await loginLocalUser('local-user-123');
      expect(isLoggedIn()).toBe(true);
    });

    it('should return false when both null', async () => {
      await logout();
      expect(isLoggedIn()).toBe(false);
    });

    it('should return false when both empty strings', async () => {
      await loginWithSession('', '');
      expect(isLoggedIn()).toBe(false);
    });
  });

  describe('loadAuth', () => {
    it('should load auth from AsyncStorage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({
          accessToken: 'stored-token',
          loggedInUserId: 'stored-user',
        }),
      );

      await loadAuth();

      expect(getAccessToken()).toBe('stored-token');
      expect(getLoggedInUserId()).toBe('stored-user');
    });

    it('should handle empty AsyncStorage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      await loadAuth();

      expect(getAccessToken()).toBeNull();
      expect(getLoggedInUserId()).toBeNull();
    });

    it('should handle invalid JSON', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('not-json');

      await loadAuth();

      expect(getAccessToken()).toBeNull();
      expect(getLoggedInUserId()).toBeNull();
    });
  });
});

